import type { Route } from "./+types/route";
import { redirect, Form } from "react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Button } from "@coinbase/cds-web/buttons";
import { IconButton } from "@coinbase/cds-web/buttons/IconButton";
import { VStack, HStack, Box } from "@coinbase/cds-web/layout";
import { Banner } from "@coinbase/cds-web/banner";
import { Text } from "@coinbase/cds-web/typography/Text";
import { TextInput } from "@coinbase/cds-web/controls";
import { RemoteImage } from "@coinbase/cds-web/media/RemoteImage";
import { getSession } from "~/auth/auth.server";
import * as schema from "../../../database/schema";
import { proposal, vacationCycle, vacationCycleProposal } from "../../../database/schema";
import { Link } from "../../components/Link";
import { ConflictResolutionModal } from "./ConflictResolutionModal";
import "./proposals-new.css";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Submit Proposal - Fam Vacay Picker" }, { name: "description", content: "Create a new vacation proposal" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSession(request, context.cloudflare.env);

	// Redirect if no session
	if (!session) {
		throw redirect("/login");
	}

	const db = drizzle(context.cloudflare.env.DB, { schema });
	const url = new URL(request.url);
	const vacationParam = url.searchParams.get("vacation");
	const vacationCycleId = vacationParam ? Number(vacationParam) : null;

	let vacation = null;
	let existingProposal = null;

	// If vacation ID provided, check for conflicts
	if (vacationCycleId) {
		// Load vacation details
		vacation = await db.query.vacationCycle.findFirst({
			where: eq(vacationCycle.id, vacationCycleId),
		});

		// Check if vacation exists
		if (!vacation) {
			throw new Response("Vacation cycle not found", { status: 404 });
		}

		// Checks for any existing proposals created by this user which are already submitted for the specified vacation
		const existingResults = await db
			.select({
				proposal: proposal,
			})
			.from(vacationCycleProposal)
			.innerJoin(proposal, eq(proposal.id, vacationCycleProposal.proposalId))
			.where(and(eq(vacationCycleProposal.vacationCycleId, vacationCycleId), eq(proposal.userId, session.user.id)))
			.limit(1);

		existingProposal = existingResults[0]?.proposal || null;
	}

	return {
		session,
		vacationCycleId,
		vacation,
		existingProposal,
		googleMapsApiKey: context.cloudflare.env.GOOGLE_MAPS_API_KEY,
	};
}

export async function action({ request, context }: Route.ActionArgs) {
	const session = await getSession(request, context.cloudflare.env);

	// Redirect if no session
	if (!session) {
		throw redirect("/login");
	}

	const formData = await request.formData();
	const destinationName = formData.get("destinationName") as string;
	const destinationImageUrl = formData.get("destinationImageUrl") as string | null;
	const activities = formData.get("activities") as string | null;
	const budgetEstimate = formData.get("budgetEstimate") as string | null;
	const vacationParam = formData.get("vacation") as string | null;
	const conflictAction = formData.get("conflictAction") as string | null;
	const existingProposalId = formData.get("existingProposalId") as string | null;

	const vacationId = vacationParam ? Number(vacationParam) : null;

	// Validate required fields
	if (!destinationName || destinationName.trim() === "") {
		return { error: "Destination name is required" };
	}

	const db = drizzle(context.cloudflare.env.DB, { schema });

	// Handle "throw_out" - redirect without changes
	if (conflictAction === "throw_out" && vacationId) {
		return redirect(`/vacation/${vacationId}`);
	}

	// Handle "replace" - delete old association
	if (conflictAction === "replace" && vacationId && existingProposalId) {
		await db
			.delete(vacationCycleProposal)
			.where(and(eq(vacationCycleProposal.vacationCycleId, vacationId), eq(vacationCycleProposal.proposalId, Number(existingProposalId))));
	}

	// Create new proposal
	const [newProposal] = await db
		.insert(proposal)
		.values({
			userId: session.user.id,
			destinationName: destinationName.trim(),
			destinationImageUrl: destinationImageUrl?.trim() || null,
			activities: activities?.trim() || null,
			budgetEstimate: budgetEstimate ? Number(budgetEstimate) : null,
			isAiGeneratedActivities: false,
			isAiGeneratedBudget: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	// Only create the association between vacation && new proposal if conflictAction IS NOT for "save_for_later"
	if (vacationId && conflictAction !== "save_for_later") {
		await db.insert(vacationCycleProposal).values({
			vacationCycleId: vacationId,
			proposalId: newProposal.id,
			selectionWeight: 1,
		});
	}

	// Redirect on success
	if (vacationId) {
		return redirect(`/vacation/${vacationId}`);
	} else {
		return redirect("/");
	}
}

export default function ProposalNew({ loaderData, actionData }: Route.ComponentProps) {
	const { vacationCycleId, vacation, existingProposal, googleMapsApiKey } = loaderData;

	// conditional UI
	const [showConflictModal, setShowConflictModal] = useState(false);

	// async operation pending states
	const [isFetchingImage, setIsFetchingImage] = useState(false);
	const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);
	const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);

	// Create proposal form state:
	const [destinationName, setDestinationName] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [activities, setActivities] = useState("");
	const [budgetEstimate, setBudgetEstimate] = useState("");
	const [conflictResolution, setConflictResolution] = useState<string | null>(null);
	const [selectedPlace, setSelectedPlace] = useState<{
		name: string;
		coordinates: { lat: number; lng: number };
	} | null>(null);

	// Google Maps
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<google.maps.Map | null>(null);
	const markerRef = useRef<google.maps.Marker | null>(null);
	const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Set Google Maps API options once on mount
	useEffect(() => {
		setOptions({
			key: googleMapsApiKey,
			v: "weekly",
		});
	}, [googleMapsApiKey]);

	// Initialize Google Places Autocomplete
	useEffect(() => {
		if (!inputRef.current) return;

		const initAutocomplete = async () => {
			try {
				const { Autocomplete } = await importLibrary("places");

				const autocomplete = new Autocomplete(inputRef.current!, {
					// types: ["geocode"],
					fields: ["name", "formatted_address", "geometry", "place_id"],
				});

				autocomplete.addListener("place_changed", () => {
					const place = autocomplete.getPlace();

					if (place.geometry?.location && place.name) {
						const name = place.name;
						const coordinates = {
							lat: place.geometry.location.lat(),
							lng: place.geometry.location.lng(),
						};

						setDestinationName(name);
						setSelectedPlace({ name, coordinates });

						// Clear all other inputs when location changes
						setImageUrl("");
						setActivities("");
						setBudgetEstimate("");

						// Update map to the selected location
						if (mapInstanceRef.current) {
							mapInstanceRef.current.setCenter(place.geometry.location);
							mapInstanceRef.current.setZoom(12);

							// Remove old marker if exists
							if (markerRef.current) {
								markerRef.current.setMap(null);
							}

							// Create new marker
							importLibrary("marker").then(({ Marker }) => {
								const marker = new Marker({
									position: place.geometry?.location,
									map: mapInstanceRef.current,
									title: name,
								});
								markerRef.current = marker;
							});
						}
					}
				});

				autocompleteRef.current = autocomplete;
			} catch (error) {
				console.error("Error initializing autocomplete:", error);
			}
		};

		initAutocomplete();
	}, []);

	// Fetch random image from Unsplash via our unsplash API route
	async function fetchRandomImage() {
		if (!destinationName.trim()) return;

		setIsFetchingImage(true);
		try {
			const response = await fetch(`/api/unsplash?query=${encodeURIComponent(destinationName)}`);

			if (!response.ok) {
				throw new Error("Failed to fetch image");
			}

			const data = (await response.json()) as { imageUrl: string };
			setImageUrl(data.imageUrl);
		} catch (error) {
			console.error("Error fetching image:", error);
		} finally {
			setIsFetchingImage(false);
		}
	}

	// Generate activities using AI via our API route (with streaming)
	async function generateActivities() {
		if (!destinationName.trim()) return;

		setIsGeneratingActivities(true);
		setActivities(""); // Clear previous activities

		try {
			const response = await fetch(`/api/generate-activities?destination=${encodeURIComponent(destinationName)}`);

			if (!response.ok) {
				throw new Error("Failed to generate activities");
			}

			// Read the streaming response
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("No response body");
			}

			let accumulatedText = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				// Decode the chunk and append to accumulated text
				const chunk = decoder.decode(value, { stream: true });
				accumulatedText += chunk;

				// Update the state with the accumulated text
				setActivities(accumulatedText);
			}
		} catch (error) {
			console.error("Error generating activities:", error);
		} finally {
			setIsGeneratingActivities(false);
		}
	}

	// Generate budget estimate using AI via our API route
	async function generateBudget() {
		if (!destinationName.trim()) return;

		setIsGeneratingBudget(true);
		try {
			const response = await fetch(`/api/generate-budget?destination=${encodeURIComponent(destinationName)}`);

			if (!response.ok) {
				throw new Error("Failed to generate budget estimate");
			}

			const data = (await response.json()) as { budgetEstimate: number };
			setBudgetEstimate(data.budgetEstimate.toString());
		} catch (error) {
			console.error("Error generating budget estimate:", error);
		} finally {
			setIsGeneratingBudget(false);
		}
	}

	// Geocode destination and update map
	const geocodeDestination = useCallback(async () => {
		if (!destinationName.trim() || !mapInstanceRef.current) return;

		try {
			// Import the geocoding library
			const { Geocoder } = await importLibrary("geocoding");
			const geocoder = new Geocoder();

			// Geocode the destination
			geocoder.geocode({ address: destinationName }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
				if (status === "OK" && results && results.length > 0) {
					const location = results[0].geometry.location;

					// Center map on the location
					mapInstanceRef.current?.setCenter(location);
					mapInstanceRef.current?.setZoom(12);

					// Remove old marker if exists
					if (markerRef.current) {
						markerRef.current.setMap(null);
					}

					// Create new marker
					importLibrary("marker").then(({ Marker }) => {
						const marker = new Marker({
							position: location,
							map: mapInstanceRef.current,
							title: destinationName,
						});
						markerRef.current = marker;
					});
				} else {
					console.error("Geocoding failed:", status);
				}
			});
		} catch (error) {
			console.error("Error geocoding destination:", error);
		}
	}, [destinationName]);

	// Initialize map when shown
	useEffect(() => {
		if (!mapRef.current) return;

		// Don't reinitialize if map already exists
		if (mapInstanceRef.current) return;

		const initMap = async () => {
			try {
				// Import the Maps library
				const { Map } = await importLibrary("maps");

				// Create map instance with default view centered on Chicago
				const map = new Map(mapRef.current!, {
					center: { lat: 41.8781, lng: -87.6298 },
					zoom: 10,
					disableDefaultUI: true,
					zoomControl: true,
				});

				mapInstanceRef.current = map;

				// If we have a destination already, geocode it
				if (destinationName.trim()) {
					geocodeDestination();
				}
			} catch (error) {
				console.error("Error initializing map:", error);
			}
		};

		initMap();
	}, [destinationName]);

	// Handle form submission - intercept if conflict exists
	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		if (existingProposal && !conflictResolution) {
			e.preventDefault();
			setShowConflictModal(true);
		}
		// Otherwise allow normal form submission (default submit behavior)
	}

	function handleConflictResolution(action: "save_for_later" | "replace" | "throw_out") {
		setConflictResolution(action);
		setShowConflictModal(false);
		// Trigger form submission after state updates
		setTimeout(() => {
			const form = document.querySelector("form");
			if (form) {
				form.requestSubmit();
			}
		}, 0);
	}

	return (
		<Box className="proposals-new-page">
			<VStack gap={6}>
				{/* Page Header */}
				<HStack gap={2} justifyContent="space-between" alignItems="center">
					<Text font="display1">Create Proposal</Text>
					<Link to="/">
						<Button variant="secondary" compact>
							Cancel
						</Button>
					</Link>
				</HStack>

				{/* Vacation Context Banner (if applicable) */}
				{vacation && (
					<Banner variant="informational" startIcon="info" title={`Proposal for ${vacation.year} Vacation`}>
						<Text>You're creating a proposal for the {vacation.year} vacation cycle.</Text>
					</Banner>
				)}

				{/* Main Form */}
				<Form method="post" onSubmit={handleSubmit}>
					<VStack gap={4}>
						{/* Hidden fields */}
						{vacationCycleId && <input type="hidden" name="vacation" value={vacationCycleId} />}
						{existingProposal && conflictResolution && (
							<>
								<input type="hidden" name="conflictAction" value={conflictResolution} />
								<input type="hidden" name="existingProposalId" value={existingProposal.id} />
							</>
						)}

						{/* Destination Name */}
						<VStack gap={2}>
							<VStack gap={1} className="destination-input-wrapper">
								<label htmlFor="destinationName" className="destination-label">
									<Text font="label1">Destination</Text>
								</label>
								<input
									ref={inputRef}
									id="destinationName"
									name="destinationName"
									type="text"
									placeholder="e.g., Paris, France"
									required
									className="destination-input"
								/>
								<Text font="label2" color="fgMuted">
									Where do you want to go? Start typing for suggestions.
								</Text>
							</VStack>
							<Box
								ref={mapRef}
								style={{
									width: "100%",
									height: "300px",
									borderRadius: "8px",
									overflow: "hidden",
								}}
							/>
						</VStack>

						{/* Destination Image URL with Fetch Button */}
						<VStack gap={2}>
							<HStack gap={2} alignItems="flex-end">
								<Box style={{ flex: 1 }}>
									<TextInput
										name="destinationImageUrl"
										label="Image URL (Optional)"
										placeholder="Click the image icon to fetch a photo"
										helperText="A URL to an image of the destination"
										value={imageUrl}
										readOnly
									/>
								</Box>
								<IconButton
									name="image"
									accessibilityLabel="Fetch random image from Unsplash"
									variant="secondary"
									onClick={fetchRandomImage}
									disabled={!destinationName.trim() || isFetchingImage}
									loading={isFetchingImage}
								/>
							</HStack>
							{imageUrl && (
								<Box>
									<RemoteImage source={imageUrl} width={200} height={150} shape="rectangle" />
								</Box>
							)}
						</VStack>

						{/* Activities */}
						<VStack gap={2}>
							<HStack gap={2} alignItems="flex-end">
								<Box style={{ flex: 1 }}>
									<TextInput
										name="activities"
										label="Activities (Optional)"
										placeholder="Describe activities you'd like to do..."
										helperText="What would you like to do there? Or click the robot icon to generate ideas."
										inputNode={<textarea rows={4} value={activities} onChange={(e) => setActivities(e.target.value)} />}
									/>
								</Box>
								<IconButton
									name="robot"
									accessibilityLabel="Generate activity ideas with AI"
									variant="secondary"
									onClick={generateActivities}
									disabled={!destinationName.trim() || isGeneratingActivities}
									loading={isGeneratingActivities}
								/>
							</HStack>
						</VStack>

						{/* Budget Estimate */}
						<VStack gap={2}>
							<HStack gap={2} alignItems="flex-end">
								<Box style={{ flex: 1 }}>
									<TextInput
										name="budgetEstimate"
										label="Budget Estimate (Optional)"
										type="number"
										min="0"
										step="1"
										placeholder="2000"
										suffix="USD"
										helperText="Estimated cost per person in USD. Or click the robot icon to generate an estimate."
										value={budgetEstimate}
										onChange={(e) => setBudgetEstimate(e.target.value)}
									/>
								</Box>
								<IconButton
									name="robot"
									accessibilityLabel="Generate budget estimate with AI"
									variant="secondary"
									onClick={generateBudget}
									disabled={!destinationName.trim() || isGeneratingBudget}
									loading={isGeneratingBudget}
								/>
							</HStack>
						</VStack>

						{/* Error message from action */}
						{actionData?.error && (
							<Banner variant="error" startIcon="warning" title="Error">
								<Text>{actionData.error}</Text>
							</Banner>
						)}

						{/* Submit Button */}
						<Button type="submit">Create Proposal</Button>
					</VStack>
				</Form>

				{/* Conflict Resolution Modal */}
				{existingProposal && (
					<ConflictResolutionModal
						visible={showConflictModal}
						existingProposal={existingProposal}
						vacation={vacation}
						onResolution={handleConflictResolution}
						onCancel={() => setShowConflictModal(false)}
					/>
				)}
			</VStack>
		</Box>
	);
}

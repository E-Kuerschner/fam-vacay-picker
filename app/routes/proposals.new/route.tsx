import type { Route } from "./+types/route";
import { redirect } from "react-router";
import { useState, type FormEvent } from "react";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { getSession } from "~/auth/auth.server";
import { Button } from "@coinbase/cds-web/buttons";
import { IconButton } from "@coinbase/cds-web/buttons/IconButton";
import { VStack, HStack, Box } from "@coinbase/cds-web/layout";
import { Banner } from "@coinbase/cds-web/banner";
import { Text } from "@coinbase/cds-web/typography/Text";
import { TextInput } from "@coinbase/cds-web/controls";
import { RemoteImage } from "@coinbase/cds-web/media/RemoteImage";
import { Form } from "react-router";
import * as schema from "../../../database/schema";
import { proposal, vacationCycle, vacationCycleProposal } from "../../../database/schema";
import { Link } from "../../components/Link";
import { ConflictResolutionModal } from "./ConflictResolutionModal";
import "./proposals-new.css";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Create Proposal - Fam Vacay Picker" }, { name: "description", content: "Create a new vacation proposal" }];
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

		// Check for existing proposal by this user for this cycle
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

	// Create association (NOT for "save_for_later")
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
	const { session, vacationCycleId, vacation, existingProposal } = loaderData;
	const [showConflictModal, setShowConflictModal] = useState(false);
	const [conflictResolution, setConflictResolution] = useState<string | null>(null);
	const [destinationName, setDestinationName] = useState("");
	const [imageUrl, setImageUrl] = useState("");
	const [isFetchingImage, setIsFetchingImage] = useState(false);
	const [activities, setActivities] = useState("");
	const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);
	const [budgetEstimate, setBudgetEstimate] = useState("");
	const [isGeneratingBudget, setIsGeneratingBudget] = useState(false);

	// Handle form submission - intercept if conflict exists
	function handleSubmit(e: FormEvent) {
		if (existingProposal && !conflictResolution) {
			e.preventDefault();
			setShowConflictModal(true);
		}
		// Otherwise allow normal form submission
	}

	// Fetch random image from Unsplash via our API route
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
						<TextInput
							name="destinationName"
							label="Destination"
							placeholder="e.g., Paris, France"
							required
							helperText="Where do you want to go?"
							value={destinationName}
							onChange={(e) => setDestinationName(e.target.value)}
						/>

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
										inputNode={
											<textarea
												rows={4}
												value={activities}
												onChange={(e) => setActivities(e.target.value)}
											/>
										}
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

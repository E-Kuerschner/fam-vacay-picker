import type { Route } from "./+types/route";
import { redirect, Link } from "react-router";
import { useState } from "react";
import { drizzle } from "drizzle-orm/d1";
import { gte, lt, asc, desc, eq, count } from "drizzle-orm";
import { getSession } from "~/auth/auth.server";
import { Button } from "@coinbase/cds-web/buttons";
import { VStack, HStack, Box } from "@coinbase/cds-web/layout";
import { Text } from "@coinbase/cds-web/typography/Text";
import { signOut } from "~/auth/auth.client";
import * as schema from "../../../database/schema";
import { vacationCycle, user } from "../../../database/schema";
import { VacationList } from "./VacationList";
import { CreateVacationModal } from "./CreateVacationModal";
import "./home.css";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Fam Vacay Picker" }, { name: "description", content: "Family Vacation Picker" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSession(request, context.cloudflare.env);

	// Redirect if no session
	if (!session) {
		throw redirect("/login");
	}

	const db = drizzle(context.cloudflare.env.DB, { schema });
	const currentYear = new Date().getFullYear();

	// Query next vacation with proposals (year >= current year, earliest first)
	const nextVacation = await db.query.vacationCycle.findFirst({
		where: gte(vacationCycle.year, currentYear),
		orderBy: asc(vacationCycle.year),
		with: {
			proposals: {
				with: {
					proposal: true,
				},
			},
		},
	});

	// Query past vacations (year < current year, most recent first)
	const pastVacations = await db.select().from(vacationCycle).where(lt(vacationCycle.year, currentYear)).orderBy(desc(vacationCycle.year));

	// Count total users to calculate expected proposals (total - 1)
	const [userCount] = await db.select({ value: count() }).from(user);

	const expectedProposals = userCount.value - 1;

	// Check if current user has submitted a proposal for the next vacation
	const hasSubmittedProposal = nextVacation ? nextVacation.proposals.some((vcp) => vcp.proposal?.userId === session.user.id) : false;

	return {
		session,
		nextVacation: nextVacation || null,
		pastVacations,
		expectedProposals,
		hasSubmittedProposal,
	};
}

export async function action({ request, context }: Route.ActionArgs) {
	const session = await getSession(request, context.cloudflare.env);

	// Verify admin role
	if (!session || session.user.role !== "admin") {
		throw new Response("Forbidden", { status: 403 });
	}

	const formData = await request.formData();
	const year = Number(formData.get("year"));
	const currentYear = new Date().getFullYear();

	// Validate year
	if (year < currentYear) {
		return { error: `Upcoming vacations cannot have a year before ${currentYear}` };
	}

	const db = drizzle(context.cloudflare.env.DB);

	// Check if year already exists
	const existing = await db.select().from(vacationCycle).where(eq(vacationCycle.year, year)).limit(1);

	if (existing.length > 0) {
		return { error: "A vacation for this year already exists" };
	}

	// Create vacation
	const [newVacation] = await db
		.insert(vacationCycle)
		.values({
			year,
			status: "draft" as const,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	return redirect(`/vacation/${newVacation.id}`);
}

export default function Home({ loaderData, actionData }: Route.ComponentProps) {
	const [showModal, setShowModal] = useState(false);
	const { session, nextVacation, pastVacations, expectedProposals, hasSubmittedProposal } = loaderData;
	const isAdmin = session.user.role === "admin";

	async function handleSignOut() {
		await signOut();
		window.location.reload();
	}

	return (
		<Box className="home-page">
			<VStack gap={6}>
				{/* Header with greeting and logout */}
				<HStack gap={2} justifyContent="flex-end" alignItems="center">
					<Text font="label2" color="fgPrimary">
						Hello, {session.user.name}!
					</Text>
					<Button onClick={handleSignOut} variant="secondary" compact>
						Log Out
					</Button>
				</HStack>

				{/* Next Vacation Section */}
				<VStack gap={2}>
					<Text font="title2">Next Vacation</Text>
					{nextVacation ? (
						<VStack gap={2}>
							<Box className="vacation-link">
								<Link to={`/vacation/${nextVacation.id}`}>
									<Text>
										{nextVacation.year} - {nextVacation.status}
									</Text>
								</Link>
							</Box>
							<Text font="label2" color="fgMuted">
								Proposals: {nextVacation.proposals.length}/{expectedProposals}
							</Text>
							{!hasSubmittedProposal && (
								<Box background="accentSubtleBlue" padding={3} borderRadius={300}>
									<VStack gap={2}>
										<Text font="label1">You haven't submitted a proposal yet</Text>
										<Link to={`/vacation/${nextVacation.id}/proposal/new`}>
											<Button compact>Submit a Proposal</Button>
										</Link>
									</VStack>
								</Box>
							)}
						</VStack>
					) : (
						<VStack gap={2}>
							<Text>No upcoming vacation scheduled</Text>
							{isAdmin && (
								<Box>
									<Button onClick={() => setShowModal(true)} compact>
										Create New Vacation
									</Button>
								</Box>
							)}
						</VStack>
					)}
				</VStack>

				{/* Past Vacations List */}
				<VacationList vacations={pastVacations} />

				{/* Create Modal (admin only) */}
				{isAdmin && <CreateVacationModal visible={showModal} onRequestClose={() => setShowModal(false)} actionData={actionData} />}
			</VStack>
		</Box>
	);
}

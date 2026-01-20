import type { Route } from "./+types/route";
import { redirect, Link } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { VStack, Box } from "@coinbase/cds-web/layout";
import { Text } from "@coinbase/cds-web/typography/Text";
import { Button } from "@coinbase/cds-web/buttons";
import { getSession } from "~/auth/auth.server";
import * as schema from "../../../database/schema";
import { vacationCycle } from "../../../database/schema";
import { getStatusLabel } from "../../utils/vacationStatus";

export function meta({ params }: Route.MetaArgs) {
	return [{ title: `Vacation ${params.id} - Fam Vacay Picker` }, { name: "description", content: "Vacation details" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const session = await getSession(request, context.cloudflare.env);

	// Redirect if no session
	if (!session) {
		throw redirect("/login");
	}

	const db = drizzle(context.cloudflare.env.DB, { schema });
	const vacationId = Number(params.id);

	// Query vacation by ID with proposals relation including submitter info
	const vacation = await db.query.vacationCycle.findFirst({
		where: eq(vacationCycle.id, vacationId),
		with: {
			proposals: {
				with: {
					proposal: {
						with: {
							submitter: true,
						},
					},
				},
			},
		},
	});

	if (!vacation) {
		throw new Response("Vacation not found", { status: 404 });
	}

	// Get all users to determine who hasn't submitted
	const allUsers = await db.query.user.findMany();

	return {
		session,
		vacation,
		allUsers,
	};
}

function SubmissionOpenView({ vacation, allUsers }: { vacation: any; allUsers: any[] }) {
	// Extract submitted user IDs from proposals
	const submittedUserIds = new Set(vacation.proposals.map((vcp: any) => vcp.proposal.userId));

	// Calculate who hasn't submitted yet
	const usersWhoHaventSubmitted = allUsers.filter((user) => !submittedUserIds.has(user.id));

	const totalExpected = allUsers.length;
	const totalSubmitted = vacation.proposals.length;
	const totalPending = totalExpected - totalSubmitted;

	return (
		<VStack gap={4}>
			<VStack gap={2}>
				<Text>
					<strong>Status:</strong> {getStatusLabel(vacation.status)}
				</Text>
				<Text>
					<strong>Submissions:</strong> {totalSubmitted} of {totalExpected} ({totalPending} pending)
				</Text>
			</VStack>

			{/* Submitted proposals list */}
			{vacation.proposals.length > 0 && (
				<VStack gap={2}>
					<Text font="title3">Submitted Proposals</Text>
					{vacation.proposals.map((vcp: any) => (
						<Box
							key={vcp.proposalId}
							style={{
								padding: "1rem",
								backgroundColor: "var(--cds-bg-elevation1, #f5f5f5)",
								borderRadius: "8px",
							}}
						>
							<VStack gap={1}>
								<Text font="title4">{vcp.proposal.destinationName}</Text>
								<Text font="label2" color="fgMuted">
									Submitted by {vcp.proposal.submitter.name || vcp.proposal.submitter.email}
								</Text>
							</VStack>
						</Box>
					))}
				</VStack>
			)}

			{/* Pending submissions */}
			{usersWhoHaventSubmitted.length > 0 && (
				<VStack gap={2}>
					<Text font="title3">Waiting for Submissions From</Text>
					{usersWhoHaventSubmitted.map((user) => (
						<Box
							key={user.id}
							style={{
								padding: "0.75rem 1rem",
								backgroundColor: "var(--cds-bg-elevation1, #f5f5f5)",
								borderRadius: "8px",
								opacity: 0.7,
							}}
						>
							<Text>{user.name || user.email}</Text>
						</Box>
					))}
				</VStack>
			)}
		</VStack>
	);
}

function SelectionCompleteView({ vacation }: { vacation: any }) {
	return (
		<Box padding={2} background="bgElevation1" borderRadius={400}>
			<Text font="title1">Winner selected - Details coming soon</Text>
		</Box>
	);
}

function TripFinalizedView({ vacation }: { vacation: any }) {
	return (
		<Box padding={2} background="bgElevation1" borderRadius={400}>
			<Text font="title1">Trip finalized - Details coming soon</Text>
		</Box>
	);
}

function PastVacationView({ vacation }: { vacation: any }) {
	return (
		<Box padding={2} background="bgElevation1" borderRadius={400}>
			<Text font="title1">Past vacation - Details coming soon</Text>
		</Box>
	);
}

export default function VacationDetail({ loaderData }: Route.ComponentProps) {
	const { vacation, allUsers } = loaderData;

	return (
		<Box style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
			<VStack gap={4}>
				<Link to="/">
					<Button variant="secondary" compact>
						← Back to Home
					</Button>
				</Link>

				<Text font="display1">{vacation.year} Vacation</Text>

				{/* Status-specific views */}
				{vacation.status === "submission_open" && <SubmissionOpenView vacation={vacation} allUsers={allUsers} />}

				{vacation.status === "selection_complete" && <SelectionCompleteView vacation={vacation} />}

				{vacation.status === "trip_finalized" && <TripFinalizedView vacation={vacation} />}

				{vacation.status === "past" && <PastVacationView vacation={vacation} />}
			</VStack>
		</Box>
	);
}

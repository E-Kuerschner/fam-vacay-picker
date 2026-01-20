import type { Route } from "./+types/route";
import { redirect } from "react-router";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { VStack, HStack, Box } from "@coinbase/cds-web/layout";
import { Text } from "@coinbase/cds-web/typography/Text";
import { Button } from "@coinbase/cds-web/buttons";
import { RemoteImage } from "@coinbase/cds-web/media/RemoteImage";
import { getSession } from "~/auth/auth.server";
import * as schema from "../../../database/schema";
import { proposal } from "../../../database/schema";
import { Link } from "../../components/Link";
import "./proposals.css";

export function meta({}: Route.MetaArgs) {
	return [{ title: "My Proposals - Fam Vacay Picker" }, { name: "description", content: "View all your vacation proposals" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSession(request, context.cloudflare.env);

	// Redirect if no session
	if (!session) {
		throw redirect("/login");
	}

	const db = drizzle(context.cloudflare.env.DB, { schema });

	// Query all proposals for the current user
	const userProposals = await db.query.proposal.findMany({
		where: eq(proposal.userId, session.user.id),
		orderBy: (proposals, { desc }) => [desc(proposals.createdAt)],
	});

	// For each proposal, get the associated vacation cycles
	const proposalsWithCycles = await Promise.all(
		userProposals.map(async (p) => {
			const cycles = await db.query.vacationCycleProposal.findMany({
				where: (vcp, { eq }) => eq(vcp.proposalId, p.id),
				with: {
					vacationCycle: true,
				},
			});

			return {
				...p,
				vacationCycles: cycles.map((c) => c.vacationCycle).filter(Boolean),
			};
		})
	);

	return {
		session,
		proposals: proposalsWithCycles,
	};
}

export default function Proposals({ loaderData }: Route.ComponentProps) {
	const { proposals } = loaderData;

	return (
		<Box className="proposals-page">
			<VStack gap={6}>
				{/* Page Header */}
				<HStack gap={2} justifyContent="space-between" alignItems="center">
					<Text font="display1">My Proposals</Text>
					<Link to="/proposals/new">
						<Button>Create New Proposal</Button>
					</Link>
				</HStack>

				{/* Proposals List */}
				{proposals.length === 0 ? (
					<Box className="empty-state">
						<VStack gap={3} alignItems="center">
							<Text font="title1" color="fgMuted">
								No proposals yet
							</Text>
							<Text color="fgMuted">Create your first vacation proposal to get started!</Text>
							<Link to="/proposals/new">
								<Button>Create Proposal</Button>
							</Link>
						</VStack>
					</Box>
				) : (
					<VStack gap={4}>
						{proposals.map((proposal) => (
							<Link key={proposal.id} to={`/proposals/${proposal.id}`} className="proposal-card-link">
								<Box className="proposal-card">
									<HStack gap={4} alignItems="flex-start">
										{/* Proposal Image */}
										{proposal.destinationImageUrl ? (
											<Box className="proposal-image">
												<RemoteImage source={proposal.destinationImageUrl} width={200} height={150} shape="rectangle" />
											</Box>
										) : (
											<Box className="proposal-image-placeholder">
												<Text color="fgMuted">No image</Text>
											</Box>
										)}

										{/* Proposal Details */}
										<VStack gap={2} style={{ flex: 1 }}>
											<Text font="title1">{proposal.destinationName}</Text>

											{/* Vacation Cycles */}
											{proposal.vacationCycles.length > 0 && (
												<VStack gap={1}>
													<Text font="label2" color="fgMuted">
														Submitted for:
													</Text>
													<HStack gap={2} wrap>
														{proposal.vacationCycles.map((cycle) => (
															<Box key={cycle.id} className="vacation-cycle-badge">
																<Text font="label2">{cycle.year} Vacation</Text>
															</Box>
														))}
													</HStack>
												</VStack>
											)}

											{/* Budget if available */}
											{proposal.budgetEstimate && (
												<Text font="body" color="fgMuted">
													Budget: ${proposal.budgetEstimate.toLocaleString()} USD
												</Text>
											)}

											{/* Created date */}
											<Text font="label2" color="fgMuted">
												Created {new Date(proposal.createdAt).toLocaleDateString()}
											</Text>
										</VStack>
									</HStack>
								</Box>
							</Link>
						))}
					</VStack>
				)}
			</VStack>
		</Box>
	);
}

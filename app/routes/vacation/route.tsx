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

	// Query vacation by ID with proposals relation
	const vacation = await db.query.vacationCycle.findFirst({
		where: eq(vacationCycle.id, vacationId),
		with: {
			proposals: true,
		},
	});

	if (!vacation) {
		throw new Response("Vacation not found", { status: 404 });
	}

	return {
		session,
		vacation,
	};
}

export default function VacationDetail({ loaderData }: Route.ComponentProps) {
	const { vacation } = loaderData;

	return (
		<Box style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
			<VStack gap={4}>
				<Link to="/">
					<Button variant="secondary" compact>
						← Back to Home
					</Button>
				</Link>

				<Text font="display1">{vacation.year} Vacation</Text>

				<VStack gap={2}>
					<Text>
						<strong>Status:</strong> {vacation.status}
					</Text>
					<Text>
						<strong>Proposals:</strong> {vacation.proposals.length}
					</Text>
				</VStack>

				<Box
					style={{
						padding: "1.5rem",
						backgroundColor: "var(--cds-bg-elevation1, #f5f5f5)",
						borderRadius: "8px",
					}}
				>
					<Text font="title1">Vacation detail page - Coming soon</Text>
				</Box>
			</VStack>
		</Box>
	);
}

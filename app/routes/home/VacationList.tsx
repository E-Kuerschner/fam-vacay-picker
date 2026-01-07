import type { Route } from "./+types/route";
import { Link } from "react-router";
import { VStack, Box } from "@coinbase/cds-web/layout";
import { Text } from "@coinbase/cds-web/typography/Text";

type VacationListProps = {
	vacations: Route.ComponentProps["loaderData"]["pastVacations"];
};

export function VacationList({ vacations }: VacationListProps) {
	return (
		<VStack gap={2}>
			<Text font="title2">Past Vacations</Text>
			{vacations.length === 0 ? (
				<Text>No past vacations</Text>
			) : (
				<VStack gap={1}>
					{vacations.map((vacation) => (
						<Box key={vacation.id} className="vacation-link">
							<Link to={`/vacation/${vacation.id}`}>
								<Text>
									{vacation.year} - {vacation.status}
								</Text>
							</Link>
						</Box>
					))}
				</VStack>
			)}
		</VStack>
	);
}

export function getStatusLabel(status: string): string {
	switch (status) {
		case "submission_open":
			return "Open for Submissions";
		case "selection_complete":
			return "Winner Selected";
		case "trip_finalized":
			return "Trip Confirmed";
		case "past":
			return "Completed";
		default:
			return status;
	}
}

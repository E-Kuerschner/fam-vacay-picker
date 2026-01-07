import type { Route } from "./+types/route";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "~/auth/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSession(request, context.cloudflare.env);

	if (!session) {
		return new Response("Unauthorized", { status: 401 });
	}

	const url = new URL(request.url);
	const destination = url.searchParams.get("destination");

	if (!destination) {
		return new Response("Missing destination parameter", { status: 400 });
	}

	try {
		const anthropic = new Anthropic({
			apiKey: context.cloudflare.env.ANTHROPIC_API_KEY,
		});

		const message = await anthropic.messages.create({
			model: "claude-3-5-haiku-20241022",
			max_tokens: 200,
			messages: [
				{
					role: "user",
					content: `Estimate the total cost per person in USD for a trip to ${destination} from Chicago. Include:
- Round-trip flight from Chicago
- 5 nights in a standard 3-star hotel

Provide ONLY a single number as your response (the total estimated cost in USD). Do not include any explanation, currency symbols, or other text. Just the number.`,
				},
			],
		});

		// Extract text content from the response
		const textContent = message.content.find((block) => block.type === "text");
		const budgetText = textContent && textContent.type === "text" ? textContent.text.trim() : "";

		// Parse the number from the response
		const budgetEstimate = parseInt(budgetText, 10);

		if (isNaN(budgetEstimate)) {
			return new Response("Failed to parse budget estimate", { status: 500 });
		}

		return Response.json({ budgetEstimate });
	} catch (error) {
		console.error("Error generating budget estimate:", error);
		return new Response("Failed to generate budget estimate", { status: 500 });
	}
}

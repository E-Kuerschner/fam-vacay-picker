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

		// Create a streaming response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					const messageStream = await anthropic.messages.create({
						model: "claude-haiku-4-5",
						max_tokens: 500,
						stream: true,
						messages: [
							{
								role: "user",
								content: `Create a concise bulleted list of the top things to do at ${destination}. Maximum 10 items. Format as a simple bulleted list with each item on a new line starting with a dash (-).`,
							},
						],
					});

					// Stream each token as it arrives
					for await (const event of messageStream) {
						if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
							const text = event.delta.text;
							controller.enqueue(new TextEncoder().encode(text));
						}
					}

					controller.close();
				} catch (error) {
					console.error("Error in stream:", error);
					controller.error(error);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		console.error("Error generating activities:", error);
		return new Response("Failed to generate activities", { status: 500 });
	}
}

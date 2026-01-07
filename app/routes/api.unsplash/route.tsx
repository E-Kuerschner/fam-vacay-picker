import type { Route } from "./+types/route";
import { getSession } from "~/auth/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
	const session = await getSession(request, context.cloudflare.env);

	if (!session) {
		return new Response("Unauthorized", { status: 401 });
	}

	const url = new URL(request.url);
	const query = url.searchParams.get("query");

	if (!query) {
		return new Response("Missing query parameter", { status: 400 });
	}

	try {
		const response = await fetch(
			`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
			{
				headers: {
					Authorization: `Client-ID ${context.cloudflare.env.UNSPLASH_API_KEY}`,
				},
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch image from Unsplash");
		}

		const data = (await response.json()) as { urls: { regular: string } };
		return Response.json({ imageUrl: data.urls.regular });
	} catch (error) {
		console.error("Error fetching from Unsplash:", error);
		return new Response("Failed to fetch image", { status: 500 });
	}
}

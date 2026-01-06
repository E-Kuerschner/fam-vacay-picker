import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, ContentBlock } from "@anthropic-ai/sdk/resources/messages";

export type { MessageParam, ContentBlock };

type CreateClaudeClientParams = {
	apiKey: string;
};

export function createClaudeClient({ apiKey }: CreateClaudeClientParams) {
	const client = new Anthropic({ apiKey });

	return client;
}

export type ClaudeClient = ReturnType<typeof createClaudeClient>;

/**
 * Helper to create Claude client from Cloudflare env.
 * Use in loaders/actions to get the Claude client instance.
 */
export function getClaudeFromEnv(env: Env) {
	return createClaudeClient({
		apiKey: env.ANTHROPIC_API_KEY,
	});
}

/**
 * Static auth config for the better-auth CLI.
 * Used by `npx @better-auth/cli generate` to understand the schema structure.
 *
 * The actual runtime auth is created in app/auth/auth.server.ts
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createPlugins, userAdditionalFields, sessionAdditionalFields } from "./database/auth.config";

export const auth = betterAuth({
	database: drizzleAdapter({} as never, {
		provider: "sqlite",
	}),
	plugins: createPlugins(),
	user: {
		additionalFields: userAdditionalFields,
	},
	session: {
		additionalFields: sessionAdditionalFields,
	},
});

import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { createResendClient, createEmailSender, type ResendClient } from "~/server/resend.server";

import { createPlugins, userAdditionalFields, sessionAdditionalFields } from "../../database/auth.config";
import * as schema from "../../database/schema";

type CreateAuthParams = {
	db: D1Database;
	secret: string;
	baseURL: string;
	resend: ResendClient;
};

export function createAuth({ db, secret, baseURL, resend }: CreateAuthParams) {
	const drizzleDb = drizzle(db);
	const sendEmail = createEmailSender(resend);

	const options = {
		plugins: createPlugins({
			sendMagicLink: async ({ email, url }) => {
				await sendEmail({
					to: email,
					subject: "Sign in to Fam Vacay Picker",
					html: `
            <h1>Sign in to Fam Vacay Picker</h1>
            <p>Click the link below to sign in:</p>
            <a href="${url}">Sign in</a>
            <p>This link will expire in 5 minutes.</p>
            <p>If you didn't request this email, you can safely ignore it.</p>
          `,
				});
			},
		}),
		user: {
			additionalFields: userAdditionalFields,
		},
		session: {
			additionalFields: sessionAdditionalFields,
			// session stored in cookie to prevent frequently hitting database
			cookieCache: {
				enabled: true,
				maxAge: 60 * 60 * 24 * 1, // one day
			},
		},
	};

	return betterAuth({
		secret,
		baseURL,
		...options,
		database: drizzleAdapter(drizzleDb, {
			provider: "sqlite",
			schema,
		}),
	});
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Helper to create auth instance from Cloudflare env.
 * Use in loaders/actions to get the auth instance.
 */
export function getAuthFromEnv(env: Env) {
	const resend = createResendClient({ apiKey: env.RESEND_API_KEY });

	return createAuth({
		db: env.DB,
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		resend,
	});
}

/**
 * Helper to get session in route loaders.
 * Returns null if not authenticated.
 */
export async function getSession(request: Request, env: Env) {
	const auth = getAuthFromEnv(env);
	const session = await auth.api.getSession({
		headers: request.headers,
	});
	return session;
}

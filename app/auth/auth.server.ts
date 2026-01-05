import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import {
  createResendClient,
  createEmailSender,
  type ResendClient,
} from "~/server/resend.server";
import { createAuthOptions } from "./options";

type CreateAuthParams = {
  db: D1Database;
  secret: string;
  baseURL: string;
  resend: ResendClient;
};

export function createAuth({ db, secret, baseURL, resend }: CreateAuthParams) {
  const drizzleDb = drizzle(db);
  const sendEmail = createEmailSender(resend);

  const options = createAuthOptions({ secret, baseURL, sendEmail });

  return betterAuth({
    ...options,
    database: drizzleAdapter(drizzleDb, {
      provider: "sqlite",
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

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Resend } from "resend";
import { createAuthOptions } from "./options";

type CreateAuthParams = {
  db: D1Database;
  secret: string;
  baseURL: string;
  resendApiKey: string;
};

export function createAuth({ db, secret, baseURL, resendApiKey }: CreateAuthParams) {
  const drizzleDb = drizzle(db);
  const resend = new Resend(resendApiKey);

  const sendEmail = async ({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) => {
    await resend.emails.send({
      from: "Fam Vacay Picker <noreply@mail.yourdomain.com>",
      to,
      subject,
      html,
    });
  };

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
  return createAuth({
    db: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    resendApiKey: env.RESEND_API_KEY,
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

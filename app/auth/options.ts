import type { BetterAuthOptions } from "better-auth";
import {
  createPlugins,
  userAdditionalFields,
  sessionAdditionalFields,
} from "../../database/auth.config";

type AuthOptionsParams = {
  secret: string;
  baseURL: string;
  sendEmail: (params: { to: string; subject: string; html: string }) => Promise<void>;
};

export function createAuthOptions({
  secret,
  baseURL,
  sendEmail,
}: AuthOptionsParams): Omit<BetterAuthOptions, "database"> {
  return {
    secret,
    baseURL,
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
    },
  };
}

import { Resend } from "resend";

type CreateResendClientParams = {
	apiKey: string;
};

export function createResendClient({ apiKey }: CreateResendClientParams) {
	return new Resend(apiKey);
}

export type ResendClient = ReturnType<typeof createResendClient>;

/**
 * Helper to create Resend client from Cloudflare env.
 * Use in loaders/actions to get the Resend client instance.
 */
export function getResendFromEnv(env: Env) {
	return createResendClient({
		apiKey: env.RESEND_API_KEY,
	});
}

type SendEmailParams = {
	to: string;
	subject: string;
	html: string;
};

/**
 * Creates an email sender function using a Resend client.
 * Useful for passing to auth options or other services that need email capabilities.
 */
export function createEmailSender(resend: ResendClient) {
	return async ({ to, subject, html }: SendEmailParams) => {
		if (import.meta.env.DEV) {
			console.log("=".repeat(60));
			console.log("[DEV] Email would be sent:");
			console.log(`  To: ${to}`);
			console.log(`  Subject: ${subject}`);
			console.log(`  HTML:\n${html}`);
			console.log("=".repeat(60));
			return;
		}

		await resend.emails.send({
			// TODO need to use a different domain for sending emails - using only registered one with Resend for now
			from: "Fam Vacay Picker <noreply@erichandliz.love>",
			to,
			subject,
			html,
		});
	};
}

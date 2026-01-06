import { useState } from "react";
import { Button } from "@coinbase/cds-web/buttons";
import { TextInput } from "@coinbase/cds-web/controls";
import { Box, VStack } from "@coinbase/cds-web/layout";
import { signIn } from "~/auth/auth.client";
import type { Route } from "./+types/route";
import "./login.css";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Sign In - Fam Vacay Picker" }, { name: "description", content: "Sign in to Fam Vacay Picker" }];
}

export default function Login() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setStatus("loading");
		setErrorMessage("");

		const { error } = await signIn.magicLink({
			email,
			callbackURL: "/",
		});

		if (error) {
			setStatus("error");
			setErrorMessage(error.message || "Failed to send magic link");
		} else {
			setStatus("success");
		}
	}

	if (status === "success") {
		return (
			<main className="login-page">
				<Box maxWidth="400px" width="100%">
					<VStack gap={4}>
						<h1>Check your email</h1>
						<p>
							We sent a sign-in link to <strong>{email}</strong>
						</p>
						<p>Click the link in the email to sign in.</p>
					</VStack>
				</Box>
			</main>
		);
	}

	return (
		<main className="login-page">
			<Box maxWidth="400px" width="100%">
				<VStack gap={4}>
					<h1>Sign In</h1>
					<form onSubmit={handleSubmit}>
						<VStack gap={4}>
							<TextInput
								label="Email"
								type="email"
								value={email}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
							/>
							{status === "error" && <p className="login-error">{errorMessage}</p>}
							<Button type="submit" disabled={status === "loading"}>
								{status === "loading" ? "Sending..." : "Send magic link"}
							</Button>
						</VStack>
					</form>
				</VStack>
			</Box>
		</main>
	);
}

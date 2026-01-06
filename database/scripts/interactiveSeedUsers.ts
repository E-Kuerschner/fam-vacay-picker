#!/usr/bin/env bun

import { spawnSync } from "bun";

const DB_NAME = "fam-vacay-picker";

interface SeededUser {
	name: string;
	email: string;
	role: string;
}

async function run() {
	if (!Bun.env.CLOUDFLARE_ACCOUNT_ID) {
		console.error("Cloudflare account id is not set on the environment");
		process.exit(1);
	}

	console.log("🚀 Starting Interactive D1 Seeding Tool...");

	// 1. Choose Target Environment
	const target = prompt("Target environment? (local/remote):", "local")?.toLowerCase();
	const isLocal = target === "local";
	const envFlag = isLocal ? ["--local"] : ["--remote"];

	// 2. Strict Remote Login Check
	if (!isLocal) {
		console.log("Checking Cloudflare authentication...");

		const checkAuth = () => {
			const check = spawnSync(["bun", "x", "wrangler", "whoami"]);
			const output = (check.stdout.toString() + check.stderr.toString()).toLowerCase();
			// Returns true if authenticated, false if not
			return check.exitCode === 0 && !output.includes("not authenticated") && !output.includes("not logged in");
		};

		if (!checkAuth()) {
			console.log("⚠️ Not authenticated. Triggering 'bun x wrangler login'...");

			// Open login in browser
			spawnSync(["bun", "x", "wrangler", "login"], { stdin: "inherit", stdout: "inherit" });

			// Immediate re-verify
			if (!checkAuth()) {
				console.error("❌ Authentication failed or was cancelled. Cannot proceed with remote seeding.");
				process.exit(1);
			}
			console.log("✅ Login successful.");
		} else {
			console.log("✅ Authenticated.");
		}
	}

	const addedUsers: SeededUser[] = [];
	let continueSeeding = true;

	// 3. Seeding Loop
	while (continueSeeding) {
		console.log("\n--- New User Entry ---");

		const name = prompt("Name:") || "Unknown User";

		let email = "";
		while (true) {
			email = prompt("Email:") || "";
			const confirm = prompt("Confirm Email:") || "";
			if (email && email === confirm) break;
			console.log("⚠️ Emails do not match. Try again.");
		}

		const roleInput = prompt("Role (user/admin) [user]:", "user")?.toLowerCase();
		const role = roleInput === "admin" ? "admin" : "user";

		const id = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);

		// SQL using snake_case columns from your schema image
		const sql = `
      INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, banned) 
      VALUES ('${id}', '${name}', '${email}', 1, ${now}, ${now}, '${role}', 0)
    `;

		console.log(`⌛ Inserting ${email} into ${isLocal ? "local" : "remote"} D1...`);

		// localFlag placed BEFORE DB_NAME for correct wrangler parsing
		const insert = spawnSync(["bun", "x", "wrangler", "d1", "execute", ...envFlag, DB_NAME, "--command", sql]);

		if (insert.exitCode === 0) {
			console.log(`✅ Successfully added ${name}.`);
			addedUsers.push({ name, email, role });
		} else {
			const err = insert.stderr.toString();
			if (err.includes("UNIQUE constraint")) {
				console.error(`❌ Failed: Email ${email} already exists.`);
			} else {
				console.error(`❌ SQL Error: ${err}`);
			}
		}

		const next = prompt("Add another user? (y/n):", "y")?.toLowerCase();
		if (next !== "y") continueSeeding = false;
	}

	// 4. Final Summary
	console.log("\n" + "=".repeat(30));
	console.log("✨ SEEDING SUMMARY");
	console.log(`Target: ${isLocal ? "Local" : "Remote"}`);
	console.log(`Total Added: ${addedUsers.length}`);
	if (addedUsers.length > 0) {
		console.table(addedUsers);
	}
	console.log("=".repeat(30));
}

run().catch(console.error);

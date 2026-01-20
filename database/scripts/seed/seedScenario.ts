#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { spawnSync, Glob } from "bun";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Deterministic UUIDs for consistent test users across all seed runs
const TESTER_ONE_ID = "a1b2c3d4-e5f6-4a1b-8c9d-0e1f2a3b4c5d";
const TESTER_TWO_ID = "b2c3d4e5-f6a7-4b2c-9d0e-1f2a3b4c5d6e";
const TESTER_THREE_ID = "c3d4e5f6-a7b8-4c3d-0e1f-2a3b4c5d6e7f";

// Get script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../../..");

// Parse command line argument or prompt for scenario
let scenario = process.argv[2];

if (!scenario) {
	console.log("🌱 Database Seeding Tool\n");
	console.log("Select a scenario to seed:");
	console.log("  1 - No new vacation (only 2023 past vacation)");
	console.log("  2 - New vacation (2026), no proposals");
	console.log("  3 - New vacation (2026), 1 proposal (Tester Two)");
	console.log("  4 - New vacation (2026), 2 proposals (Tester Two + Three)");
	console.log("  5 - New vacation (2026), all proposals + winner (Tester One)\n");

	scenario = prompt("Select scenario (1-5):", "1") || "";
}

if (!["1", "2", "3", "4", "5"].includes(scenario)) {
	console.error("❌ Error: Invalid scenario. Please select 1-5");
	process.exit(1);
}

console.log(`\n🌱 Seeding database with scenario ${scenario}...\n`);

// Step 1: Reset the database
console.log("📦 Resetting local database...");
const resetResult = spawnSync({
	cmd: ["bun", "run", "db:reset:local"],
	cwd: projectRoot,
	stdout: "inherit",
	stderr: "inherit",
});

if (!resetResult.success) {
	console.error("❌ Failed to reset database");
	process.exit(1);
}

console.log("✅ Database reset complete\n");

// Wait a moment for migrations to settle
await Bun.sleep(500);

// Step 2: Find the local D1 database file
console.log("🔍 Finding local D1 database file...");
const glob = new Glob("**/*.sqlite");
const dbFiles = Array.from(glob.scanSync({ cwd: join(projectRoot, ".wrangler/state/v3/d1"), absolute: true }));

if (dbFiles.length === 0) {
	console.error("❌ No database file found. Make sure the database was reset properly.");
	process.exit(1);
}

if (dbFiles.length > 1) {
	console.warn(`⚠️  Multiple database files found, using first one: ${dbFiles[0]}`);
}

const dbPath = dbFiles[0];
console.log(`✅ Found database: ${dbPath}\n`);

// Step 3: Read and prepare SQL files
console.log("📄 Reading SQL files...");

const readSQLFile = async (relativePath: string): Promise<string> => {
	const fullPath = join(__dirname, relativePath);
	const content = await Bun.file(fullPath).text();
	return content;
};

const replacePlaceholders = (sql: string): string => {
	return sql
		.replaceAll("{{TESTER_ONE_ID}}", TESTER_ONE_ID)
		.replaceAll("{{TESTER_TWO_ID}}", TESTER_TWO_ID)
		.replaceAll("{{TESTER_THREE_ID}}", TESTER_THREE_ID);
};

// Read shared SQL files
const usersSql = await readSQLFile("shared/users.sql");
const pastVacationSql = await readSQLFile("shared/pastVacation.sql");
const scenarioSql = await readSQLFile(`scenarios/scenario${scenario}.sql`);

console.log("✅ SQL files loaded\n");

// Step 4: Connect to database and execute SQL
console.log("🔗 Connecting to database...");
let db: Database;
try {
	db = new Database(dbPath);
} catch (error) {
	console.error("❌ Failed to connect to database:", error);
	process.exit(1);
}

console.log("✅ Connected to database\n");

// Step 5: Execute SQL within a transaction
console.log("💉 Executing SQL...");
try {
	// Begin transaction
	db.run("BEGIN TRANSACTION");

	// Execute shared SQL files
	console.log("  → Inserting users...");
	db.run(replacePlaceholders(usersSql));

	console.log("  → Inserting past vacation (2023)...");
	db.run(replacePlaceholders(pastVacationSql));

	// Execute scenario-specific SQL
	if (scenarioSql.trim()) {
		console.log(`  → Executing scenario ${scenario}...`);
		db.run(replacePlaceholders(scenarioSql));
	} else {
		console.log(`  → Scenario ${scenario} has no additional data`);
	}

	// Commit transaction
	db.run("COMMIT");
	console.log("✅ SQL execution complete\n");
} catch (error) {
	console.error("❌ Error executing SQL:", error);
	try {
		db.run("ROLLBACK");
		console.log("↩️  Transaction rolled back");
	} catch (rollbackError) {
		console.error("❌ Failed to rollback transaction:", rollbackError);
	}
	db.close();
	process.exit(1);
}

// Step 6: Verify data
console.log("🔍 Verifying seed data...");
try {
	const userCount = db.query("SELECT COUNT(*) as count FROM user").get() as { count: number };
	const vacationCount = db.query("SELECT COUNT(*) as count FROM vacation_cycle").get() as {
		count: number;
	};
	const proposalCount = db.query("SELECT COUNT(*) as count FROM proposal").get() as {
		count: number;
	};

	console.log(`  → Users: ${userCount.count} (expected: 3)`);
	console.log(`  → Vacation cycles: ${vacationCount.count}`);
	console.log(`  → Proposals: ${proposalCount.count}`);

	if (userCount.count !== 3) {
		console.warn("⚠️  Warning: Expected 3 users, but found", userCount.count);
	}

	console.log("\n✅ Verification complete\n");
} catch (error) {
	console.error("❌ Error verifying data:", error);
}

// Close database connection
db.close();

console.log("✨ Seed complete!\n");
console.log("📝 Test users (use magic link auth):");
console.log("   • tester1@gmail.com (admin)");
console.log("   • tester2@gmail.com (user)");
console.log("   • tester3@gmail.com (user)");
console.log();

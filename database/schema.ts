import { relations } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

import { session, user } from "./authSchema";
export * from "./authSchema";

// Vacation cycles (biannual)
export const vacationCycle = sqliteTable("vacation_cycle", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	year: integer("year").notNull(),
	status: text("status", { enum: ["draft", "open", "finalized"] }).notNull(),
	submissionStartDate: integer("submission_start_date", { mode: "timestamp" }),
	submissionEndDate: integer("submission_end_date", { mode: "timestamp" }),
	winningProposalId: integer("winning_proposal_id").references(() => proposal.id, { onDelete: "set null" }),
	finalizedAt: integer("finalized_at", { mode: "timestamp" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Vacation proposals submitted by users
export const proposal = sqliteTable("proposal", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	destinationName: text("destination_name").notNull(),
	destinationImageUrl: text("destination_image_url"),
	activities: text("activities"),
	isAiGeneratedActivities: integer("is_ai_generated_activities", { mode: "boolean" }).default(false),
	budgetEstimate: integer("budget_estimate"), // in dollars USD
	isAiGeneratedBudget: integer("is_ai_generated_budget", { mode: "boolean" }).default(false),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const vacationCycleProposal = sqliteTable("vacation_cycle_proposal", {
	vacationCycleId: integer("vacation_cycle_id").references(() => vacationCycle.id, { onDelete: "cascade" }),
	proposalId: integer("proposal_id").references(() => proposal.id, { onDelete: "cascade" }),
	// the weight given to this proposal in the context of the cycle
	selectionWeight: integer("selection_weight").default(1),
});

export const userRelations = relations(user, ({ many }) => ({
	proposals: many(proposal),
}));

export const proposalRelations = relations(proposal, ({ one }) => ({
	submitter: one(user, {
		fields: [proposal.userId],
		references: [user.id],
	}),
}));

export const vacationCycleRelations = relations(vacationCycle, ({ one, many }) => ({
	proposals: many(vacationCycleProposal),
	winningProposal: one(proposal, {
		fields: [vacationCycle.winningProposalId],
		references: [proposal.id],
	}),
}));

export const vacationCycleProposalRelations = relations(vacationCycleProposal, ({ one }) => ({
	vacationCycle: one(vacationCycle, {
		fields: [vacationCycleProposal.vacationCycleId],
		references: [vacationCycle.id],
	}),
	proposal: one(proposal, {
		fields: [vacationCycleProposal.proposalId],
		references: [proposal.id],
	}),
}));

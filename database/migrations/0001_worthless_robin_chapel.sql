CREATE TABLE `proposal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`destination_name` text NOT NULL,
	`destination_image_url` text,
	`activities` text,
	`is_ai_generated_activities` integer DEFAULT false,
	`budget_estimate` integer,
	`is_ai_generated_budget` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vacation_cycle` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`status` text NOT NULL,
	`submission_start_date` integer,
	`submission_end_date` integer,
	`winning_proposal_id` integer,
	`finalized_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`winning_proposal_id`) REFERENCES `proposal`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `vacation_cycle_proposal` (
	`vacation_cycle_id` integer,
	`proposal_id` integer,
	`selection_weight` integer DEFAULT 1,
	FOREIGN KEY (`vacation_cycle_id`) REFERENCES `vacation_cycle`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposal`(`id`) ON UPDATE no action ON DELETE cascade
);

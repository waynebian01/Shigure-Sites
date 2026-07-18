CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`author` text NOT NULL,
	`version` text NOT NULL,
	`profession` text NOT NULL,
	`specialization` text NOT NULL,
	`description` text NOT NULL,
	`size` integer NOT NULL,
	`r2_key` text NOT NULL,
	`created_at` integer NOT NULL
);

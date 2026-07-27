ALTER TABLE `shares` ADD `expires_at` integer;--> statement-breakpoint
CREATE INDEX `shares_expires_at_idx` ON `shares` (`expires_at`);
ALTER TABLE `feedback` ADD `public_requested` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback` ADD `is_public` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `feedback` ADD `admin_reply` text;--> statement-breakpoint
ALTER TABLE `feedback` ADD `replied_at` timestamp;
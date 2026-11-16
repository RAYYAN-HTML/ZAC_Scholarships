CREATE TABLE `admins` (
	`id` varchar(36) NOT NULL,
	`email` varchar(254) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(160) NOT NULL,
	`role` enum('admin','editor') NOT NULL DEFAULT 'admin',
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admins_id` PRIMARY KEY(`id`),
	CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` varchar(36) NOT NULL,
	`category` varchar(60) NOT NULL,
	`message` text NOT NULL,
	`status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scholarships` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(190) NOT NULL,
	`title` varchar(240) NOT NULL,
	`provider` varchar(240) NOT NULL,
	`country` varchar(120) NOT NULL,
	`category` varchar(80) NOT NULL,
	`degree_levels` text NOT NULL,
	`fields_of_study` text,
	`description` text NOT NULL,
	`eligibility` text,
	`benefits` text,
	`required_documents` text,
	`opening_date` date,
	`deadline` date,
	`funding_type` varchar(80) NOT NULL,
	`application_url` varchar(1000),
	`source_url` varchar(1000) NOT NULL,
	`verified_at` timestamp,
	`verification_status` enum('pending_verification','verified','needs_reverification','expired','rejected') NOT NULL DEFAULT 'pending_verification',
	`application_status` enum('open','upcoming','closed','unconfirmed') NOT NULL DEFAULT 'unconfirmed',
	`publication_status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`review_note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scholarships_id` PRIMARY KEY(`id`),
	CONSTRAINT `scholarships_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`admin_id` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_admin_id_admins_id_fk` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `feedback_status_index` ON `feedback` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `scholarship_public_index` ON `scholarships` (`publication_status`,`verification_status`,`deadline`);--> statement-breakpoint
CREATE INDEX `scholarship_country_index` ON `scholarships` (`country`);--> statement-breakpoint
CREATE INDEX `scholarship_category_index` ON `scholarships` (`category`);--> statement-breakpoint
CREATE INDEX `session_expiry_index` ON `sessions` (`expires_at`);
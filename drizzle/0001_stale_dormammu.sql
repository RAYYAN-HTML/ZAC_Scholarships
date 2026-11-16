CREATE TABLE `daily_page_views` (
	`id` varchar(36) NOT NULL,
	`resource_type` enum('page','scholarship') NOT NULL,
	`resource_key` varchar(190) NOT NULL,
	`view_date` date NOT NULL,
	`view_count` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `daily_page_views_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_page_views_resource_day_unique` UNIQUE(`resource_type`,`resource_key`,`view_date`)
);
--> statement-breakpoint
CREATE INDEX `daily_page_views_date_index` ON `daily_page_views` (`view_date`);
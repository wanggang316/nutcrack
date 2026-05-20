CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`user_metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "users_role_check" CHECK("users"."role" IN ('admin', 'user'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`access_token_hash` text PRIMARY KEY NOT NULL,
	`refresh_token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`refresh_expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_refresh_token_hash_unique` ON `sessions` (`refresh_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `api_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`prefix` text NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`usage_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` text,
	`last_used_ip` text,
	`expires_at` text,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "api_tokens_status_check" CHECK("api_tokens"."status" IN ('active', 'disabled', 'expired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_tokens_token_hash_unique` ON `api_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_api_tokens_created_by` ON `api_tokens` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_api_tokens_status` ON `api_tokens` (`status`);--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`original_title` text,
	`original_content` text,
	`original_description` text,
	`title` text,
	`summary` text,
	`key_points` text DEFAULT '[]' NOT NULL,
	`category_id` text,
	`ai_title` text,
	`ai_summary` text,
	`ai_key_points` text DEFAULT '[]' NOT NULL,
	`ai_category` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`processing_status` text DEFAULT 'queued' NOT NULL,
	`published_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_by` text,
	`process_error` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "links_status_check" CHECK("links"."status" IN ('pending', 'published', 'archived', 'deleted')),
	CONSTRAINT "links_processing_status_check" CHECK("links"."processing_status" IN ('queued', 'fetching', 'analyzing', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `idx_links_status` ON `links` (`status`);--> statement-breakpoint
CREATE INDEX `idx_links_processing_status` ON `links` (`processing_status`);--> statement-breakpoint
CREATE INDEX `idx_links_created_at` ON `links` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_links_published_at` ON `links` (`published_at`);--> statement-breakpoint
CREATE INDEX `idx_links_category_id` ON `links` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_links_created_by` ON `links` (`created_by`);--> statement-breakpoint
CREATE TABLE `link_tags` (
	`link_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`link_id`, `tag`),
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_link_tags_tag` ON `link_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `link_ai_tags` (
	`link_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`link_id`, `tag`),
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_link_ai_tags_tag` ON `link_ai_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`type` text DEFAULT 'string' NOT NULL,
	`description` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "settings_type_check" CHECK("settings"."type" IN ('string', 'number', 'boolean', 'json'))
);
--> statement-breakpoint
CREATE TABLE `operation_log` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`resource` text,
	`resource_id` text,
	`details` text,
	`status` text DEFAULT 'success' NOT NULL,
	`error_message` text,
	`user_agent` text,
	`ip` text,
	`token_id` text,
	`user_id` text,
	`duration` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`token_id`) REFERENCES `api_tokens`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "operation_log_status_check" CHECK("operation_log"."status" IN ('success', 'failed', 'pending'))
);
--> statement-breakpoint
CREATE INDEX `idx_operation_log_created_at` ON `operation_log` ("created_at" DESC);--> statement-breakpoint
CREATE INDEX `idx_operation_log_user_id` ON `operation_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_operation_log_token_id` ON `operation_log` (`token_id`);--> statement-breakpoint
CREATE INDEX `idx_operation_log_action` ON `operation_log` (`action`);--> statement-breakpoint
-- =====================================================================
-- Seed data (idempotent via INSERT OR IGNORE)
-- =====================================================================
INSERT OR IGNORE INTO categories (id, name, slug, description, icon, sort_order, created_at, updated_at) VALUES
  ('11111111-1111-4111-a111-000000000001', '产品', 'product', '产品相关内容', 'CubeIcon', 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('11111111-1111-4111-a111-000000000002', '技术', 'tech', '技术相关内容', 'CodeBracketIcon', 2, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('11111111-1111-4111-a111-000000000003', '开发', 'dev', '开发相关内容', 'CommandLineIcon', 3, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('11111111-1111-4111-a111-000000000004', '工具', 'tool', '工具推荐', 'WrenchScrewdriverIcon', 4, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('11111111-1111-4111-a111-000000000005', '其他', 'other', '其他内容', 'BookmarkIcon', 5, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
--> statement-breakpoint
INSERT OR IGNORE INTO settings (key, value, type, description, updated_at) VALUES
  ('ai_api_base_url', 'https://api.openai.com/v1', 'string', 'AI API Base URL', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('ai_api_key', '', 'string', 'AI API Key', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('ai_model', 'gpt-4o-mini', 'string', 'AI Model', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('ai_temperature', '0.7', 'number', 'AI Temperature', strftime('%Y-%m-%dT%H:%M:%fZ','now'));

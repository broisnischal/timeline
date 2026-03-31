CREATE TYPE "public"."space_invite_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."space_member_role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	CONSTRAINT "mcp_api_key_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "mcp_api_key_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "notion_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"workspace_name" text,
	"workspace_icon" text,
	"bot_id" text,
	"token_type" text DEFAULT 'bearer' NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"selected_database_id" text,
	"last_imported_at" timestamp,
	"last_pushed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notion_connection_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notion_oauth_state" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"state" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notion_oauth_state_state_unique" UNIQUE("state")
);
--> statement-breakpoint
CREATE TABLE "notion_task_map" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"notion_page_id" text NOT NULL,
	"notion_last_edited_time" timestamp,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_profile_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "space" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"public_slug" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "space_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
CREATE TABLE "space_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"invited_email" text NOT NULL,
	"invited_user_id" text,
	"invited_by_user_id" text NOT NULL,
	"status" "space_invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_member" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "space_member_role" DEFAULT 'editor' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"space_id" text NOT NULL,
	"title" text NOT NULL,
	"icon" text,
	"accent_color" text,
	"notes" text,
	"outcome" text,
	"starts_at" timestamp,
	"due_at" timestamp,
	"duration_minutes" integer,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"subtasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activity_log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_api_key" ADD CONSTRAINT "mcp_api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_connection" ADD CONSTRAINT "notion_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_oauth_state" ADD CONSTRAINT "notion_oauth_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_task_map" ADD CONSTRAINT "notion_task_map_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_task_map" ADD CONSTRAINT "notion_task_map_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_invite" ADD CONSTRAINT "space_invite_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_invite" ADD CONSTRAINT "space_invite_invited_user_id_user_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_invite" ADD CONSTRAINT "space_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_member" ADD CONSTRAINT "space_member_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_member" ADD CONSTRAINT "space_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "mcp_api_key_user_idx" ON "mcp_api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_connection_user_idx" ON "notion_connection" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_oauth_state_user_idx" ON "notion_oauth_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_oauth_state_exp_idx" ON "notion_oauth_state" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notion_task_map_user_idx" ON "notion_task_map" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_task_map_task_idx" ON "notion_task_map" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "notion_task_map_page_idx" ON "notion_task_map" USING btree ("notion_page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notion_task_map_user_task_uq" ON "notion_task_map" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notion_task_map_user_page_uq" ON "notion_task_map" USING btree ("user_id","notion_page_id");--> statement-breakpoint
CREATE INDEX "public_profile_slug_idx" ON "public_profile" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "space_user_idx" ON "space" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "space_invite_space_idx" ON "space_invite" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "space_invite_email_idx" ON "space_invite" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "space_invite_invited_user_idx" ON "space_invite" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "space_invite_invited_by_idx" ON "space_invite" USING btree ("invited_by_user_id");--> statement-breakpoint
CREATE INDEX "space_invite_status_idx" ON "space_invite" USING btree ("status");--> statement-breakpoint
CREATE INDEX "space_member_space_idx" ON "space_member" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "space_member_user_idx" ON "space_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "space_member_space_user_uidx" ON "space_member" USING btree ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "task_user_idx" ON "task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_space_idx" ON "task" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "task_starts_idx" ON "task" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "task_due_idx" ON "task" USING btree ("due_at");
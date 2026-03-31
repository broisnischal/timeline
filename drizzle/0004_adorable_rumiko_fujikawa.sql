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
ALTER TABLE "notion_connection" ADD CONSTRAINT "notion_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_oauth_state" ADD CONSTRAINT "notion_oauth_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_task_map" ADD CONSTRAINT "notion_task_map_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notion_task_map" ADD CONSTRAINT "notion_task_map_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notion_connection_user_idx" ON "notion_connection" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_oauth_state_user_idx" ON "notion_oauth_state" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_oauth_state_exp_idx" ON "notion_oauth_state" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "notion_task_map_user_idx" ON "notion_task_map" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notion_task_map_task_idx" ON "notion_task_map" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "notion_task_map_page_idx" ON "notion_task_map" USING btree ("notion_page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notion_task_map_user_task_uq" ON "notion_task_map" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notion_task_map_user_page_uq" ON "notion_task_map" USING btree ("user_id","notion_page_id");
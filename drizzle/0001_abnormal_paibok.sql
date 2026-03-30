CREATE TYPE "public"."task_status" AS ENUM('todo', 'done', 'cancelled');--> statement-breakpoint
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
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"space_id" text NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"outcome" text,
	"starts_at" timestamp,
	"due_at" timestamp,
	"duration_minutes" integer,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "public_profile" ADD CONSTRAINT "public_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_profile_slug_idx" ON "public_profile" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "space_user_idx" ON "space" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_user_idx" ON "task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_space_idx" ON "task" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "task_starts_idx" ON "task" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "task_due_idx" ON "task" USING btree ("due_at");
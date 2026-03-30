ALTER TABLE "task" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "accent_color" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "subtasks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "activity_log" jsonb DEFAULT '[]'::jsonb NOT NULL;
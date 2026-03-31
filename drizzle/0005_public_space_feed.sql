ALTER TABLE "space" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "space" ADD CONSTRAINT "space_public_slug_unique" UNIQUE("public_slug");

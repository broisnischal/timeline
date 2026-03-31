ALTER TABLE "space" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "space" ADD COLUMN IF NOT EXISTS "public_slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "space_public_slug_unique" ON "space" USING btree ("public_slug");
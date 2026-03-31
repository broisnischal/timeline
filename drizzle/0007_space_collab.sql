CREATE TYPE "public"."space_member_role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."space_invite_status" AS ENUM('pending', 'accepted', 'declined', 'revoked', 'expired');--> statement-breakpoint

CREATE TABLE "space_member" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "space_member_role" DEFAULT 'editor' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "space_member" ADD CONSTRAINT "space_member_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_member" ADD CONSTRAINT "space_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_invite" ADD CONSTRAINT "space_invite_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_invite" ADD CONSTRAINT "space_invite_invited_user_id_user_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_invite" ADD CONSTRAINT "space_invite_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "space_member_space_idx" ON "space_member" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "space_member_user_idx" ON "space_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "space_member_space_user_uidx" ON "space_member" USING btree ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "space_invite_space_idx" ON "space_invite" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "space_invite_email_idx" ON "space_invite" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "space_invite_invited_user_idx" ON "space_invite" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "space_invite_invited_by_idx" ON "space_invite" USING btree ("invited_by_user_id");--> statement-breakpoint
CREATE INDEX "space_invite_status_idx" ON "space_invite" USING btree ("status");--> statement-breakpoint

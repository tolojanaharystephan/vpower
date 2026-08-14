ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vblink_account" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vblink_password" text;

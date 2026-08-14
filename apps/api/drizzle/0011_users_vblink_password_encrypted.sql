ALTER TABLE "users" ADD COLUMN "vblink_password_encrypted" text;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "vblink_password";

ALTER TABLE "user_wallets" ADD COLUMN IF NOT EXISTS "id" uuid;
--> statement-breakpoint
ALTER TABLE "user_wallets" ADD COLUMN IF NOT EXISTS "room_slug" text;
--> statement-breakpoint
UPDATE "user_wallets" SET "id" = gen_random_uuid() WHERE "id" IS NULL;
--> statement-breakpoint
UPDATE "user_wallets" SET "room_slug" = 'vblink' WHERE "room_slug" IS NULL;
--> statement-breakpoint
ALTER TABLE "user_wallets" DROP CONSTRAINT IF EXISTS "user_wallets_pkey";
--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "room_slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_wallets" ADD PRIMARY KEY ("id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_wallets_user_room_uidx" ON "user_wallets" ("user_id", "room_slug");
--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "room_slug" text;
--> statement-breakpoint
UPDATE "wallet_transactions" SET "room_slug" = 'vblink' WHERE "room_slug" IS NULL;
--> statement-breakpoint
ALTER TABLE "wallet_transactions" ALTER COLUMN "room_slug" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_room_idx" ON "wallet_transactions" ("user_id", "room_slug");

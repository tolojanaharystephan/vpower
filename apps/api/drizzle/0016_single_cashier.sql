-- Fold every room balance into one cashier wallet per player, then zero the room rows.
INSERT INTO "user_wallets" ("user_id", "room_slug", "balance_cents", "updated_at")
SELECT "user_id", 'cashier', COALESCE(SUM("balance_cents"), 0), NOW()
FROM "user_wallets"
WHERE "room_slug" <> 'cashier'
GROUP BY "user_id"
ON CONFLICT ("user_id", "room_slug")
DO UPDATE SET
  "balance_cents" = "user_wallets"."balance_cents" + EXCLUDED."balance_cents",
  "updated_at" = NOW();
--> statement-breakpoint
UPDATE "user_wallets"
SET "balance_cents" = 0, "updated_at" = NOW()
WHERE "room_slug" <> 'cashier';

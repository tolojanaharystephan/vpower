-- Drop test credits. A cashier keeps only money from a paid AllScale order.
UPDATE "user_wallets" AS w
SET
  "balance_cents" = COALESCE((
    SELECT SUM(p."amount_cents")::int
    FROM "payment_orders" p
    WHERE p."user_id" = w."user_id" AND p."status" = 'paid'
  ), 0),
  "updated_at" = NOW()
WHERE w."room_slug" = 'cashier';
--> statement-breakpoint
UPDATE "user_wallets"
SET "balance_cents" = 0, "updated_at" = NOW()
WHERE "room_slug" <> 'cashier';

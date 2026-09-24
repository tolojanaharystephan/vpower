CREATE TABLE IF NOT EXISTS "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"room_slug" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'allscale' NOT NULL,
	"checkout_intent_id" text,
	"checkout_url" text,
	"transaction_id" text,
	"webhook_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_orders_order_uidx" ON "payment_orders" USING btree ("order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_orders_intent_uidx" ON "payment_orders" USING btree ("checkout_intent_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_orders_webhook_uidx" ON "payment_orders" USING btree ("webhook_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_orders_user_idx" ON "payment_orders" USING btree ("user_id");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "payment_orders"
    ADD CONSTRAINT "payment_orders_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "dgames_bet_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"login" text NOT NULL,
	"bet_cents" integer NOT NULL,
	"win_cents" integer NOT NULL,
	"balance_after_cents" integer NOT NULL,
	"session_id" text,
	"game_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dgames_bet_trades_trade_uidx" ON "dgames_bet_trades" USING btree ("trade_id");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "dgames_bet_trades"
    ADD CONSTRAINT "dgames_bet_trades_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

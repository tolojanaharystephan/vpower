CREATE TABLE IF NOT EXISTS "provider_player_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_slug" text NOT NULL,
	"external_account" text NOT NULL,
	"full_account" text,
	"external_password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_player_accounts" ADD CONSTRAINT "provider_player_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "provider_player_accounts_user_provider_uidx" ON "provider_player_accounts" USING btree ("user_id","provider_slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "provider_player_accounts_slug_account_uidx" ON "provider_player_accounts" USING btree ("provider_slug","external_account");

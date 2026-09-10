ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid;
DO $$ BEGIN
  ALTER TABLE "wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_created_by_user_id_users_id_fk"
    FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_room_kind_idx" ON "wallet_transactions" USING btree ("room_slug","kind");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_room_scopes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"room_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_room_scopes_user_room_uidx" ON "agent_room_scopes" USING btree ("user_id","room_slug");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_room_scopes"
    ADD CONSTRAINT "agent_room_scopes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_user_id" uuid NOT NULL,
	"room_slug" text NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "room_conversations_player_room_uidx" ON "room_conversations" USING btree ("player_user_id","room_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "room_conversations_room_last_idx" ON "room_conversations" USING btree ("room_slug","last_message_at");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "room_conversations"
    ADD CONSTRAINT "room_conversations_player_user_id_users_id_fk"
    FOREIGN KEY ("player_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."room_chat_author" AS ENUM('player', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"author_kind" "room_chat_author" NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "room_chat_messages_conv_created_idx" ON "room_chat_messages" USING btree ("conversation_id","created_at");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "room_chat_messages"
    ADD CONSTRAINT "room_chat_messages_conversation_id_room_conversations_id_fk"
    FOREIGN KEY ("conversation_id") REFERENCES "public"."room_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "room_chat_messages"
    ADD CONSTRAINT "room_chat_messages_author_user_id_users_id_fk"
    FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

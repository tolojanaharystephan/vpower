CREATE TYPE "public"."message_kind" AS ENUM('text', 'voice');--> statement-breakpoint
ALTER TYPE "public"."message_author_type" ADD VALUE 'bot';--> statement-breakpoint
CREATE TABLE "support_bot_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keywords" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"locale" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_messages" ALTER COLUMN "body" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "kind" "message_kind" DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "audio_url" text;
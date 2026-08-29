ALTER TABLE "retro_participant" ADD COLUMN "anonymous_session_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_plan" "plan" DEFAULT 'anonymous' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "paypal_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_current_period_end" timestamp;
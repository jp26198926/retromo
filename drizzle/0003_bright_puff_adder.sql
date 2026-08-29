CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"app_name" text DEFAULT 'RetroMo' NOT NULL,
	"app_description" text DEFAULT 'Your online retrospective made easy' NOT NULL,
	"app_icon_url" text,
	"favicon_url" text,
	"individual_price" text DEFAULT '10.00' NOT NULL,
	"company_price" text DEFAULT '20.00' NOT NULL,
	"anonymous_participant_limit" integer DEFAULT 50 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"paypal_order_id" text,
	"plan" "plan" NOT NULL,
	"amount" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"type" text DEFAULT 'subscribe' NOT NULL,
	"previous_plan" "plan",
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card" ADD COLUMN "author_participant_id" uuid;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "card" ADD COLUMN "approved" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "retro" ADD COLUMN "encryption_enabled" boolean DEFAULT false NOT NULL;
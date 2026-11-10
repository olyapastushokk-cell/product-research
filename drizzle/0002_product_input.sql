ALTER TABLE "products" ALTER COLUMN "main_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "input" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "resolution" jsonb;
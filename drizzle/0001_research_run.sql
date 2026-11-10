ALTER TABLE "card_items" ADD COLUMN "field" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "model_calls" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "input_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "output_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "cost_usd" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "error" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "workflow_run_id" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "ref" integer;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "relevant" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "note" text;
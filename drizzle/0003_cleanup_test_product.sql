-- Keep what the user typed for products created before the "input" column existed.
UPDATE "products" SET "input" = "main_url" WHERE "input" = '' AND "main_url" IS NOT NULL;--> statement-breakpoint
-- Delete the broken test product whose main URL pointed at this app itself
-- (runs, sources and card items are removed by ON DELETE CASCADE).
DELETE FROM "products" WHERE "main_url" ILIKE '%product-research-phi.vercel.app%';

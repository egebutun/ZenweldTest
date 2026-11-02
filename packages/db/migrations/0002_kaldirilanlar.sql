DROP TABLE "form_submissions" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "carrier";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "tracking_number";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipped_at";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "delivered_at";
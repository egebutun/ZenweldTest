CREATE TABLE "coupon_customers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coupon_customers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"coupon_id" text NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "audience" text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_customers" ADD CONSTRAINT "coupon_customers_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_customers_email" ON "coupon_customers" USING btree ("coupon_id",lower("email"));--> statement-breakpoint
CREATE INDEX "coupon_customers_lookup" ON "coupon_customers" USING btree (lower("email"));--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_audience" CHECK ("coupons"."audience" IN ('all', 'customers'));
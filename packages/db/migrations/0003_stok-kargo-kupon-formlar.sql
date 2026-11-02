CREATE TABLE "shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"kind" text DEFAULT 'outbound' NOT NULL,
	"return_request_id" text,
	"carrier_id" text,
	"carrier_name" text NOT NULL,
	"tracking_number" text NOT NULL,
	"shipped_at" timestamp with time zone NOT NULL,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_kind" CHECK ("shipments"."kind" IN ('outbound', 'return')),
	CONSTRAINT "shipments_dates" CHECK ("shipments"."delivered_at" IS NULL OR "shipments"."delivered_at" >= "shipments"."shipped_at")
);
--> statement-breakpoint
CREATE TABLE "carriers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tracking_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carriers_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coupon_redemptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"coupon_id" text NOT NULL,
	"coupon_code" text NOT NULL,
	"user_id" text,
	"order_id" text NOT NULL,
	"discount_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	CONSTRAINT "coupon_redemptions_order" UNIQUE("order_id"),
	CONSTRAINT "coupon_redemptions_amount" CHECK ("coupon_redemptions"."discount_amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "coupon_targets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "coupon_targets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"coupon_id" text NOT NULL,
	"product_id" text,
	"category_id" text,
	CONSTRAINT "coupon_targets_one" CHECK (num_nonnulls("coupon_targets"."product_id", "coupon_targets"."category_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"discount_type" text NOT NULL,
	"discount_value" numeric(12, 2) NOT NULL,
	"min_cart_total" numeric(12, 2),
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"total_usage_limit" integer,
	"per_user_limit" integer,
	"scope" text DEFAULT 'all' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_discount_type" CHECK ("coupons"."discount_type" IN ('percent', 'amount')),
	CONSTRAINT "coupons_discount_value" CHECK ("coupons"."discount_value" > 0 AND ("coupons"."discount_type" <> 'percent' OR "coupons"."discount_value" <= 100)),
	CONSTRAINT "coupons_scope" CHECK ("coupons"."scope" IN ('all', 'targets')),
	CONSTRAINT "coupons_dates" CHECK ("coupons"."ends_at" IS NULL OR "coupons"."starts_at" IS NULL OR "coupons"."ends_at" > "coupons"."starts_at"),
	CONSTRAINT "coupons_limits" CHECK (coalesce("coupons"."total_usage_limit", 1) >= 1 AND coalesce("coupons"."per_user_limit", 1) >= 1)
);
--> statement-breakpoint
CREATE TABLE "sap_sync_runs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sap_sync_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"kind" text DEFAULT 'stock' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"rows_read" integer,
	"error" text,
	CONSTRAINT "sap_sync_runs_kind" CHECK ("sap_sync_runs"."kind" IN ('stock')),
	CONSTRAINT "sap_sync_runs_status" CHECK ("sap_sync_runs"."status" IN ('running', 'success', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "warehouse_stock" (
	"sap_item_code" text PRIMARY KEY NOT NULL,
	"item_name" text,
	"quantity" numeric(14, 3) NOT NULL,
	"synced_at" timestamp with time zone NOT NULL,
	"sync_run_id" bigint,
	CONSTRAINT "warehouse_stock_quantity" CHECK ("warehouse_stock"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "dealer_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"company_name" text NOT NULL,
	"tax_info" text,
	"city" text,
	"sector" text,
	"years_in_sector" text,
	"brands" text,
	"has_showroom" boolean,
	"has_service" boolean,
	"contact_name" text,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"user_id" text,
	"dealer_id" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealer_applications_status" CHECK ("dealer_applications"."status" IN ('new', 'reviewing', 'approved', 'rejected')),
	CONSTRAINT "dealer_applications_years" CHECK ("dealer_applications"."years_in_sector" IN ('0-2', '3-5', '6-10', '10+'))
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"subject" text,
	"message" text NOT NULL,
	"product_id" text,
	"product_name" text,
	"product_sku" text,
	"page_url" text,
	"user_id" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_messages_type" CHECK ("support_messages"."type" IN ('iletisim', 'urun-destek')),
	CONSTRAINT "support_messages_status" CHECK ("support_messages"."status" IN ('new', 'read', 'answered'))
);
--> statement-breakpoint
CREATE TABLE "welders_club_signups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"city" text,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_discount" numeric(12, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_return_request_id_return_requests_id_fk" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrier_id_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_targets" ADD CONSTRAINT "coupon_targets_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_targets" ADD CONSTRAINT "coupon_targets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_targets" ADD CONSTRAINT "coupon_targets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_sync_run_id_sap_sync_runs_id_fk" FOREIGN KEY ("sync_run_id") REFERENCES "public"."sap_sync_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_applications" ADD CONSTRAINT "dealer_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_applications" ADD CONSTRAINT "dealer_applications_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welders_club_signups" ADD CONSTRAINT "welders_club_signups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shipments_order" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_redemptions_coupon_user" ON "coupon_redemptions" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_targets_product" ON "coupon_targets" USING btree ("coupon_id","product_id") WHERE "coupon_targets"."product_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_targets_category" ON "coupon_targets" USING btree ("coupon_id","category_id") WHERE "coupon_targets"."category_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code" ON "coupons" USING btree (upper("code"));--> statement-breakpoint
CREATE INDEX "dealer_applications_created" ON "dealer_applications" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "support_messages_type" ON "support_messages" USING btree ("type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "welders_club_signups_created" ON "welders_club_signups" USING btree ("created_at" DESC NULLS LAST);
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"about_text" text,
	"image" text,
	"icon" text,
	"code" text,
	"position" integer NOT NULL,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_filter_values" (
	"category_id" text NOT NULL,
	"filter_id" text NOT NULL,
	"id" text NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "category_filter_values_pk" PRIMARY KEY("category_id","filter_id","id")
);
--> statement-breakpoint
CREATE TABLE "category_filters" (
	"category_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "category_filters_pk" PRIMARY KEY("category_id","id")
);
--> statement-breakpoint
CREATE TABLE "category_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"about_text" text,
	"image" text,
	"position" integer NOT NULL,
	"code" text,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_groups_section" CHECK ("category_groups"."section" IN ('ekipmanlar', 'guvenlik', 'aksesuarlar', 'dolgu-metalleri'))
);
--> statement-breakpoint
CREATE TABLE "category_option_definitions" (
	"category_id" text NOT NULL,
	"option_definition_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "category_option_definitions_pk" PRIMARY KEY("category_id","option_definition_id")
);
--> statement-breakpoint
CREATE TABLE "option_definitions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "option_values" (
	"option_definition_id" text NOT NULL,
	"id" text NOT NULL,
	"label" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "option_values_pk" PRIMARY KEY("option_definition_id","id")
);
--> statement-breakpoint
CREATE TABLE "product_filter_values" (
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	"filter_id" text NOT NULL,
	"value_id" text NOT NULL,
	CONSTRAINT "product_filter_values_pk" PRIMARY KEY("product_id","filter_id","value_id")
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"product_id" text NOT NULL,
	"option_definition_id" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "product_options_pk" PRIMARY KEY("product_id","option_definition_id"),
	CONSTRAINT "product_options_max3" CHECK ("product_options"."position" BETWEEN 0 AND 2)
);
--> statement-breakpoint
CREATE TABLE "product_variant_values" (
	"product_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"option_definition_id" text NOT NULL,
	"option_value_id" text NOT NULL,
	CONSTRAINT "product_variant_values_pk" PRIMARY KEY("product_id","variant_id","option_definition_id")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"product_id" text NOT NULL,
	"id" text NOT NULL,
	"combination_key" text NOT NULL,
	"sku" text NOT NULL,
	"price_delta_ex_vat" numeric(12, 2) DEFAULT 0 NOT NULL,
	"spec_overrides" jsonb,
	"in_the_box" jsonb,
	"image" text,
	"position" integer NOT NULL,
	CONSTRAINT "product_variants_pk" PRIMARY KEY("product_id","id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category_id" text NOT NULL,
	"model_code" text,
	"brand" text,
	"short_description" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_ex_vat" numeric(12, 2) NOT NULL,
	"vat_rate" numeric(5, 2) NOT NULL,
	"currency" text DEFAULT 'TRY' NOT NULL,
	"discount_percent" integer,
	"discount_starts_at" timestamp with time zone,
	"discount_ends_at" timestamp with time zone,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"in_the_box" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"processes" text[],
	"is_new" boolean DEFAULT false NOT NULL,
	"position" integer,
	"manual_url" text,
	"warranty_months" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug" UNIQUE("slug"),
	CONSTRAINT "products_price" CHECK ("products"."price_ex_vat" >= 0),
	CONSTRAINT "products_currency" CHECK ("products"."currency" = 'TRY'),
	CONSTRAINT "products_discount_percent" CHECK ("products"."discount_percent" BETWEEN 1 AND 90),
	CONSTRAINT "products_discount_dates" CHECK ("products"."discount_ends_at" IS NULL OR "products"."discount_starts_at" IS NULL OR "products"."discount_ends_at" > "products"."discount_starts_at")
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"old_path" text PRIMARY KEY NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"variant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_target_type" CHECK ("redirects"."target_type" IN ('product', 'category', 'group', 'blog', 'news', 'event')),
	CONSTRAINT "redirects_old_path" CHECK ("redirects"."old_path" LIKE '/%')
);
--> statement-breakpoint
CREATE TABLE "sku_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_stock" (
	"dealer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text DEFAULT '' NOT NULL,
	"sku" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(12, 2),
	"url" text,
	"updated_at" timestamp with time zone NOT NULL,
	"import_id" text,
	CONSTRAINT "dealer_stock_pk" PRIMARY KEY("dealer_id","product_id","variant_id"),
	CONSTRAINT "dealer_stock_quantity" CHECK ("dealer_stock"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "dealers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"district" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text,
	"email" text,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"badges" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"working_hours" text NOT NULL,
	"retailer_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealers_retailer" UNIQUE("retailer_id"),
	CONSTRAINT "dealers_badges" CHECK ("dealers"."badges" <@ ARRAY['yetkili-satici', 'yetkili-servis']::text[])
);
--> statement-breakpoint
CREATE TABLE "retailer_stock" (
	"retailer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text DEFAULT '' NOT NULL,
	"sku" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(12, 2),
	"url" text,
	"updated_at" timestamp with time zone NOT NULL,
	"import_id" text,
	CONSTRAINT "retailer_stock_pk" PRIMARY KEY("retailer_id","product_id","variant_id"),
	CONSTRAINT "retailer_stock_quantity" CHECK ("retailer_stock"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "retailers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"website_url" text NOT NULL,
	"logo_text" text NOT NULL,
	"logo_url" text,
	"is_own_store" boolean DEFAULT false NOT NULL,
	"city" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sku_aliases" (
	"source_id" text NOT NULL,
	"code" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text DEFAULT '' NOT NULL,
	CONSTRAINT "sku_aliases_pk" PRIMARY KEY("source_id","code")
);
--> statement-breakpoint
CREATE TABLE "stock_imports" (
	"id" text PRIMARY KEY NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"kind" text NOT NULL,
	"file_name" text,
	"file_key" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"rows" integer NOT NULL,
	"matched" integer NOT NULL,
	"unmatched" integer NOT NULL,
	"invalid" integer NOT NULL,
	"added" integer NOT NULL,
	"changed" integer NOT NULL,
	"zeroed" integer NOT NULL,
	"previous" jsonb,
	"reverted_at" timestamp with time zone,
	CONSTRAINT "stock_imports_source_type" CHECK ("stock_imports"."source_type" IN ('dealer', 'retailer')),
	CONSTRAINT "stock_imports_kind" CHECK ("stock_imports"."kind" IN ('file', 'manual', 'revert'))
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"district" text NOT NULL,
	"line" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favourites" (
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favourites_pk" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"scope" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" "inet",
	"user_agent" text,
	CONSTRAINT "sessions_scope" CHECK ("sessions"."scope" IN ('site', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text NOT NULL,
	"company_name" text,
	"tax_office" text,
	"tax_number" text,
	"sector" text,
	"city" text,
	"newsletter" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	CONSTRAINT "users_role" CHECK ("users"."role" IN ('individual', 'business', 'admin')),
	CONSTRAINT "users_status" CHECK ("users"."status" IN ('active', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"order_id" text NOT NULL,
	"line" integer NOT NULL,
	"product_id" text,
	"variant_id" text,
	"product_name" text NOT NULL,
	"sku" text NOT NULL,
	"variant_label" text,
	"quantity" integer NOT NULL,
	"unit_price_ex_vat" numeric(12, 2) NOT NULL,
	"vat_rate" numeric(5, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	CONSTRAINT "order_items_pk" PRIMARY KEY("order_id","line"),
	CONSTRAINT "order_items_quantity" CHECK ("order_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"order_id" text NOT NULL,
	"seq" integer NOT NULL,
	"status" text NOT NULL,
	"at" timestamp with time zone NOT NULL,
	"note" text,
	"changed_by" text,
	CONSTRAINT "order_status_history_pk" PRIMARY KEY("order_id","seq")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"user_id" text,
	"status" text NOT NULL,
	"customer_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"invoice" jsonb NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"vat" numeric(12, 2) NOT NULL,
	"shipping" numeric(12, 2) NOT NULL,
	"installment_fee" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"installments" integer,
	"card_brand" text,
	"card_program" text,
	"card_last4" text,
	"pos_id" text,
	"pos_name" text,
	"commission_percent" numeric(5, 2),
	"paid_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"carrier" text,
	"tracking_number" text,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"customer_note" text,
	"admin_note" text,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_code" UNIQUE("code"),
	CONSTRAINT "orders_status" CHECK ("orders"."status" IN ('awaiting_payment', 'preparing', 'shipped', 'delivered', 'cancelled')),
	CONSTRAINT "orders_payment_method" CHECK ("orders"."payment_method" IN ('card', 'transfer')),
	CONSTRAINT "orders_card_last4" CHECK ("orders"."card_last4" ~ '^[0-9]{4}$')
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"pos_id" text,
	"kind" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"installments" integer,
	"status" text NOT NULL,
	"provider_ref" text,
	"error_code" text,
	"error_message" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transactions_kind" CHECK ("payment_transactions"."kind" IN ('sale', 'refund', 'cancel')),
	CONSTRAINT "payment_transactions_status" CHECK ("payment_transactions"."status" IN ('pending', 'success', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"quote_id" text NOT NULL,
	"line" integer NOT NULL,
	"product_id" text,
	"variant_id" text,
	"product_name" text NOT NULL,
	"sku" text,
	"variant_label" text,
	"quantity" integer NOT NULL,
	"note" text,
	CONSTRAINT "quote_items_pk" PRIMARY KEY("quote_id","line"),
	CONSTRAINT "quote_items_quantity" CHECK ("quote_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"user_id" text,
	"status" text DEFAULT 'new' NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"tax_number" text,
	"city" text NOT NULL,
	"payment_preference" text NOT NULL,
	"term_days" integer,
	"message" text,
	"assigned_to" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_code" UNIQUE("code"),
	CONSTRAINT "quotes_status" CHECK ("quotes"."status" IN ('new', 'reviewing', 'sent', 'won', 'lost')),
	CONSTRAINT "quotes_payment_preference" CHECK ("quotes"."payment_preference" IN ('vadeli', 'cek', 'havale', 'belirsiz'))
);
--> statement-breakpoint
CREATE TABLE "return_request_items" (
	"return_request_id" text NOT NULL,
	"order_line" integer NOT NULL,
	"product_id" text,
	"product_name" text NOT NULL,
	"sku" text NOT NULL,
	"variant_label" text,
	"quantity" integer NOT NULL,
	CONSTRAINT "return_request_items_pk" PRIMARY KEY("return_request_id","order_line"),
	CONSTRAINT "return_request_items_quantity" CHECK ("return_request_items"."quantity" >= 1)
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"order_id" text NOT NULL,
	"order_code" text NOT NULL,
	"user_id" text,
	"customer_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"reason" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_requests_code" UNIQUE("code"),
	CONSTRAINT "return_requests_reason" CHECK ("return_requests"."reason" IN ('changed_mind', 'defective', 'wrong_item', 'other')),
	CONSTRAINT "return_requests_status" CHECK ("return_requests"."status" IN ('new', 'reviewing', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"user_id" text,
	"author_name" text NOT NULL,
	"rating" smallint NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"media" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verified_purchase" boolean,
	"approved" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"category_id" text,
	"product_id" text,
	"product_name" text NOT NULL,
	"reasons" text[] NOT NULL,
	"complaint" text NOT NULL,
	"company_name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"district" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_gsm" text NOT NULL,
	"user_id" text,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_requests_code" UNIQUE("code"),
	CONSTRAINT "service_requests_status" CHECK ("service_requests"."status" IN ('new', 'in_progress', 'done')),
	CONSTRAINT "service_requests_reasons" CHECK ("service_requests"."reasons" <@ ARRAY['kurulum', 'bakim', 'onarim', 'egitim']::text[])
);
--> statement-breakpoint
CREATE TABLE "warranties" (
	"id" text PRIMARY KEY NOT NULL,
	"serial_number" text NOT NULL,
	"category_id" text,
	"product_id" text,
	"product_name" text,
	"owner_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"address" text NOT NULL,
	"seller_tax_number" text NOT NULL,
	"registered_at" timestamp with time zone NOT NULL,
	"expires_at" date NOT NULL,
	"extended" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "about_page" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"hero_title" text NOT NULL,
	"hero_subtitle" text NOT NULL,
	"hero_image" text,
	"stats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "about_page_single" CHECK ("about_page"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"cover_url" text NOT NULL,
	"category" text NOT NULL,
	"author" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "document_pages" (
	"section" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_pages_section" CHECK ("document_pages"."section" IN ('msds', 'kaynak-rehberi', 'parti-sertifikalari'))
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"title" text NOT NULL,
	"product_id" text,
	"lot_number" text,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"file_key" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_section" CHECK ("documents"."section" IN ('msds', 'kaynak-rehberi', 'parti-sertifikalari'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"venue" text NOT NULL,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"logo_url" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"website_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug" UNIQUE("slug"),
	CONSTRAINT "events_dates" CHECK ("events"."end_date" >= "events"."start_date")
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"topic" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faqs_topic" CHECK ("faqs"."topic" IN ('genel', 'garanti', 'siparis', 'teknik'))
);
--> statement-breakpoint
CREATE TABLE "legal_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"cover_url" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"seo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_seo" (
	"path" text PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_seo_path" CHECK ("page_seo"."path" LIKE '/%')
);
--> statement-breakpoint
CREATE TABLE "sales_reps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"photo_url" text,
	"position" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_name" text NOT NULL,
	"account_holder" text NOT NULL,
	"iban" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_pos" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_short_name" text NOT NULL,
	"name" text NOT NULL,
	"program" text,
	"merchant_no" text NOT NULL,
	"pos_name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"installments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"commissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "settings_key" CHECK ("settings"."key" IN ('shop', 'stock', 'rich_text'))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_label" text,
	"changes" jsonb,
	"ip" "inet",
	CONSTRAINT "audit_log_action" CHECK ("audit_log"."action" IN ('create', 'update', 'delete', 'login', 'logout'))
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"source_path" text,
	"entity_type" text,
	"entity_id" text,
	"recipients" text[] NOT NULL,
	"reply_to" text,
	"subject" text NOT NULL,
	"status" text NOT NULL,
	"provider_message_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_log_type" CHECK ("email_log"."type" IN ('iletisim', 'bayilik', 'welders-club', 'urun-destek', 'teklif', 'servis', 'garanti', 'yorum', 'uye', 'siparis', 'iade')),
	CONSTRAINT "email_log_status" CHECK ("email_log"."status" IN ('sent', 'failed', 'skipped'))
);
--> statement-breakpoint
CREATE TABLE "email_recipients" (
	"type" text PRIMARY KEY NOT NULL,
	"recipients" text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "email_recipients_type" CHECK ("email_recipients"."type" IN ('iletisim', 'bayilik', 'welders-club', 'urun-destek', 'teklif', 'servis', 'garanti', 'yorum', 'uye', 'siparis', 'iade')),
	CONSTRAINT "email_recipients_not_empty" CHECK (cardinality("email_recipients"."recipients") >= 1)
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"city" text,
	"company_name" text,
	"subject" text,
	"message" text,
	"product_id" text,
	"user_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "form_submissions_type" CHECK ("form_submissions"."type" IN ('bayilik', 'iletisim', 'urun-destek', 'welders-club')),
	CONSTRAINT "form_submissions_status" CHECK ("form_submissions"."status" IN ('new', 'read', 'done'))
);
--> statement-breakpoint
CREATE TABLE "record_counters" (
	"prefix" text PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "record_counters_positive" CHECK ("record_counters"."last_number" >= 0)
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_category_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_filter_values" ADD CONSTRAINT "category_filter_values_filter_fk" FOREIGN KEY ("category_id","filter_id") REFERENCES "public"."category_filters"("category_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_option_definitions" ADD CONSTRAINT "category_option_definitions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_option_definitions" ADD CONSTRAINT "category_option_definitions_option_definition_id_option_definitions_id_fk" FOREIGN KEY ("option_definition_id") REFERENCES "public"."option_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_values" ADD CONSTRAINT "option_values_option_definition_id_option_definitions_id_fk" FOREIGN KEY ("option_definition_id") REFERENCES "public"."option_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filter_values" ADD CONSTRAINT "product_filter_values_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filter_values" ADD CONSTRAINT "product_filter_values_value_fk" FOREIGN KEY ("category_id","filter_id","value_id") REFERENCES "public"."category_filter_values"("category_id","filter_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_option_definition_id_option_definitions_id_fk" FOREIGN KEY ("option_definition_id") REFERENCES "public"."option_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_variant_fk" FOREIGN KEY ("product_id","variant_id") REFERENCES "public"."product_variants"("product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_option_fk" FOREIGN KEY ("product_id","option_definition_id") REFERENCES "public"."product_options"("product_id","option_definition_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_value_fk" FOREIGN KEY ("option_definition_id","option_value_id") REFERENCES "public"."option_values"("option_definition_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_codes" ADD CONSTRAINT "sku_codes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_stock" ADD CONSTRAINT "dealer_stock_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_stock" ADD CONSTRAINT "dealer_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_stock" ADD CONSTRAINT "dealer_stock_import_id_stock_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."stock_imports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_stock" ADD CONSTRAINT "retailer_stock_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_stock" ADD CONSTRAINT "retailer_stock_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_stock" ADD CONSTRAINT "retailer_stock_import_id_stock_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."stock_imports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sku_aliases" ADD CONSTRAINT "sku_aliases_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pos_id_payment_pos_id_fk" FOREIGN KEY ("pos_id") REFERENCES "public"."payment_pos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_pos_id_payment_pos_id_fk" FOREIGN KEY ("pos_id") REFERENCES "public"."payment_pos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_return_request_id_return_requests_id_fk" FOREIGN KEY ("return_request_id") REFERENCES "public"."return_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_request_items" ADD CONSTRAINT "return_request_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_group" ON "categories" USING btree ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_filter_values_label_tr" ON "category_filter_values" USING btree ("category_id","filter_id",lower("label" COLLATE "tr-x-icu"));--> statement-breakpoint
CREATE UNIQUE INDEX "category_filters_name_tr" ON "category_filters" USING btree ("category_id",lower("name" COLLATE "tr-x-icu"));--> statement-breakpoint
CREATE UNIQUE INDEX "category_groups_section_slug" ON "category_groups" USING btree ("section","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "option_definitions_name_tr" ON "option_definitions" USING btree (lower("name" COLLATE "tr-x-icu"));--> statement-breakpoint
CREATE UNIQUE INDEX "option_values_label_tr" ON "option_values" USING btree ("option_definition_id",lower("label" COLLATE "tr-x-icu"));--> statement-breakpoint
CREATE INDEX "product_filter_values_value" ON "product_filter_values" USING btree ("category_id","filter_id","value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_position" ON "product_options" USING btree ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_combination" ON "product_variants" USING btree ("product_id","combination_key");--> statement-breakpoint
CREATE INDEX "products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "redirects_target" ON "redirects" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sku_codes_owner" ON "sku_codes" USING btree ("product_id","variant_id");--> statement-breakpoint
CREATE INDEX "dealer_stock_product" ON "dealer_stock" USING btree ("product_id","updated_at") WHERE "dealer_stock"."quantity" > 0;--> statement-breakpoint
CREATE INDEX "retailer_stock_product" ON "retailer_stock" USING btree ("product_id","updated_at") WHERE "retailer_stock"."quantity" > 0;--> statement-breakpoint
CREATE INDEX "stock_imports_source" ON "stock_imports" USING btree ("source_type","source_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "addresses_user" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_one_default" ON "addresses" USING btree ("user_id") WHERE "addresses"."is_default";--> statement-breakpoint
CREATE INDEX "sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "order_items_product" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user" ON "orders" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_created" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_awaiting_payment" ON "orders" USING btree ("due_at") WHERE "orders"."status" = 'awaiting_payment';--> statement-breakpoint
CREATE INDEX "payment_transactions_order" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "quotes_user" ON "quotes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quotes_created" ON "quotes" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "return_requests_order" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reviews_product" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "service_requests_created" ON "service_requests" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "warranties_serial" ON "warranties" USING btree (upper("serial_number"));--> statement-breakpoint
CREATE INDEX "warranties_email" ON "warranties" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "payment_pos_one_default" ON "payment_pos" USING btree ("is_default") WHERE "payment_pos"."is_default";--> statement-breakpoint
CREATE INDEX "audit_log_entity" ON "audit_log" USING btree ("entity_type","entity_id","at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_at" ON "audit_log" USING btree ("at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_log_type" ON "email_log" USING btree ("type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_log_entity" ON "email_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "form_submissions_type" ON "form_submissions" USING btree ("type","created_at" DESC NULLS LAST);
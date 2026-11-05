CREATE TABLE "sap_order_exports" (
	"order_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sap_doc_no" text,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sap_order_exports_status" CHECK ("sap_order_exports"."status" IN ('pending', 'sent', 'failed', 'skipped')),
	CONSTRAINT "sap_order_exports_attempts" CHECK ("sap_order_exports"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sap_order_exports" ADD CONSTRAINT "sap_order_exports_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sap_order_exports_due" ON "sap_order_exports" USING btree ("status","next_attempt_at");
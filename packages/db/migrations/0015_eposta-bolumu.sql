CREATE TABLE "email_settings" (
	"type" text PRIMARY KEY NOT NULL,
	"sender" text,
	"recipients" text[] DEFAULT '{}'::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "email_settings_type" CHECK ("email_settings"."type" IN ('siparis', 'iade', 'teklif', 'servis', 'garanti', 'yorum', 'uye', 'iletisim', 'urun-destek', 'bayilik', 'sifre-sifirlama', 'bulten')),
	CONSTRAINT "email_settings_not_empty" CHECK ("email_settings"."sender" IS NOT NULL OR cardinality("email_settings"."recipients") >= 1)
);
--> statement-breakpoint
CREATE TABLE "mailbox_state" (
	"mailbox" text PRIMARY KEY NOT NULL,
	"uid_validity" bigint,
	"last_uid" bigint DEFAULT 0 NOT NULL,
	"checked_at" timestamp with time zone,
	"last_error" text
);
--> statement-breakpoint
ALTER TABLE "email_log" DROP CONSTRAINT "email_log_type";--> statement-breakpoint
ALTER TABLE "email_log" DROP CONSTRAINT "email_log_status";--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "direction" text DEFAULT 'out' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "from_address" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "message_id" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "parent_id" bigint;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "attachments" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "actor_user_id" text;--> statement-breakpoint
ALTER TABLE "email_log" ADD COLUMN "actor_name" text;--> statement-breakpoint
ALTER TABLE "email_settings" ADD CONSTRAINT "email_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_parent_id_email_log_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."email_log"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_log_message" ON "email_log" USING btree ("message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_log_incoming" ON "email_log" USING btree ("message_id") WHERE "email_log"."direction" = 'in';--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_direction" CHECK ("email_log"."direction" IN ('out', 'in'));--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_received" CHECK (("email_log"."direction" = 'in') = ("email_log"."status" = 'received'));--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_type" CHECK ("email_log"."type" IN ('siparis', 'iade', 'teklif', 'servis', 'garanti', 'yorum', 'uye', 'iletisim', 'urun-destek', 'bayilik', 'sifre-sifirlama', 'bulten'));--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_status" CHECK ("email_log"."status" IN ('sent', 'failed', 'skipped', 'received'));--> statement-breakpoint
INSERT INTO "email_settings" ("type", "recipients", "updated_at", "updated_by")
SELECT "type", "recipients", "updated_at", "updated_by" FROM "email_recipients";--> statement-breakpoint
DROP TABLE "email_recipients" CASCADE;
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"youtube_id" text,
	"title" text,
	"product_id" text,
	"cover_url" text,
	"show_on_home" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer NOT NULL,
	"file_status" text,
	"file_hd" text,
	"file_sd" text,
	"duration_seconds" integer,
	"width" smallint,
	"height" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "videos_youtube_id" UNIQUE("youtube_id"),
	CONSTRAINT "videos_source" CHECK ("videos"."source" IN ('youtube', 'file')),
	CONSTRAINT "videos_file_status" CHECK ("videos"."file_status" is null or "videos"."file_status" in ('processing', 'ready', 'failed')),
	CONSTRAINT "videos_source_fields" CHECK (("videos"."source" = 'youtube' and "videos"."youtube_id" is not null and "videos"."file_status" is null) or ("videos"."source" = 'file' and "videos"."youtube_id" is null and "videos"."file_status" is not null))
);
--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Anasayfa videolari (K-125) ayardaki listeden kutuphaneye tasinir; ayarda yalnizca bolum basligi kalir.
INSERT INTO "videos" ("id", "source", "youtube_id", "product_id", "cover_url", "show_on_home", "active", "position")
SELECT v.value->>'id', 'youtube', v.value->>'youtubeId',
  (SELECT p.id FROM "products" p WHERE p.id = v.value->>'productId'),
  NULLIF(v.value->>'cover', ''), true, COALESCE((v.value->>'active')::boolean, true), (v.ordinality - 1)::integer
FROM "settings" s, jsonb_array_elements(s.value->'videos') WITH ORDINALITY v
WHERE s.key = 'home_videos' AND jsonb_typeof(s.value->'videos') = 'array'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "settings" SET "value" = jsonb_build_object('title', "value"->'title') WHERE "key" = 'home_videos';

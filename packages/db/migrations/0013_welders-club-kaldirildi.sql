-- Welders Club kaldirildi: katilim tablosu, e-posta turu ve o turun alicilari ile e-posta kayitlari silinir.
DROP TABLE "welders_club_signups" CASCADE;--> statement-breakpoint
DELETE FROM "email_recipients" WHERE "type" = 'welders-club';--> statement-breakpoint
DELETE FROM "email_log" WHERE "type" = 'welders-club';--> statement-breakpoint
ALTER TABLE "email_log" DROP CONSTRAINT "email_log_type";--> statement-breakpoint
ALTER TABLE "email_recipients" DROP CONSTRAINT "email_recipients_type";--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_type" CHECK ("email_log"."type" IN ('iletisim', 'bayilik', 'urun-destek', 'teklif', 'servis', 'garanti', 'yorum', 'uye', 'siparis', 'iade', 'sifre-sifirlama'));--> statement-breakpoint
ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_type" CHECK ("email_recipients"."type" IN ('iletisim', 'bayilik', 'urun-destek', 'teklif', 'servis', 'garanti', 'yorum', 'uye', 'siparis', 'iade'));

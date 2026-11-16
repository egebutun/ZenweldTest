ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_status";--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "service_dealer_id" text;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_dealer_id_dealers_id_fk" FOREIGN KEY ("service_dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_requests_user" ON "service_requests" USING btree ("user_id");--> statement-breakpoint
-- "İşlemde" durumu "Yetkili servis atandı" oldu (KARARLAR K-117).
UPDATE "service_requests" SET "status" = 'assigned' WHERE "status" = 'in_progress';--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_status" CHECK ("service_requests"."status" IN ('new', 'assigned', 'done'));
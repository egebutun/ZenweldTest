"use client";

import Link from "@/components/common/Link";
import { Wrench } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { SERVICE_REASON_LABELS, SERVICE_STATUS_LABELS, type ServiceRequestStatus } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Badge, Button, EmptyState } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { useT } from "@/lib/i18n-client";
import { useMemberRecords } from "@/lib/member-records";

const STATUS_TONE: Record<ServiceRequestStatus, "amber" | "grey" | "green"> = {
  new: "amber",
  assigned: "grey",
  done: "green",
};

/**
 * HESABIM › SERVIS TALEPLERIM (KARARLAR K-117)
 *
 * Uyenin gonderdigi servis talepleri ve durumlari (panelle ayni yazilir:
 * Yetkili servis atanmasi bekleniyor → Yetkili servis atandi → Tamamlandi).
 * Atanan servisin bilgisi gosterilmez; yetkili servis musteriyle kendisi
 * iletisime gecer.
 */
export default function MyServiceRequestsPage() {
  const t = useT();
  const db = useDatabase();
  const { user } = useAuth();
  const { serviceRequests, ready } = useMemberRecords();
  const category = (slug: string) => db.categories.find((c) => c.slug === slug)?.name;

  if (!user) return null;
  if (!ready) return <div className="py-10 text-center text-zw-grey-500">{t.common.loading}</div>;

  if (serviceRequests.length === 0) {
    return (
      <EmptyState
        icon={<Wrench size={38} />}
        title={t.account.noServiceRequests}
        action={
          <Link href="/servis-talebi">
            <Button>{t.account.newServiceRequest}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {serviceRequests.map((r) => (
        <div key={r.id} data-servis-talebi className="rounded-[4px] border border-zw-grey-200 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-bold">{r.code}</span>
            <Badge tone={STATUS_TONE[r.status]}>{SERVICE_STATUS_LABELS[r.status]}</Badge>
            <span className="ml-auto text-sm text-zw-grey-500">{formatDate(r.createdAt)}</span>
          </div>
          <dl className="mt-3 grid gap-1 text-sm text-zw-grey-700 sm:grid-cols-[140px_1fr]">
            <dt className="text-zw-grey-500">{t.service.model}</dt>
            <dd>
              {r.productName}
              {category(r.categorySlug) && <span className="text-zw-grey-500"> — {category(r.categorySlug)}</span>}
            </dd>
            <dt className="text-zw-grey-500">{t.service.reason}</dt>
            <dd>{r.reasons.map((x) => SERVICE_REASON_LABELS[x]).join(", ")}</dd>
            <dt className="text-zw-grey-500">{t.service.location}</dt>
            <dd>
              {r.district} / {r.city}
            </dd>
          </dl>
          <p className="mt-3 whitespace-pre-line text-sm text-zw-grey-600">{r.complaint}</p>
        </div>
      ))}
    </div>
  );
}

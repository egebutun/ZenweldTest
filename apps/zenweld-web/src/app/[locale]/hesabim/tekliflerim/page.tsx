"use client";

import { useAuth } from "@zenweld/auth";
import { quotesForUser, useDatabase } from "@zenweld/store";
import { Badge, EmptyState } from "@zenweld/ui";
import { FileText } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n-client";
import { formatDate } from "@/lib/format";

const STATUS_TONE = {
  new: "amber",
  reviewing: "grey",
  sent: "green",
  won: "green",
  lost: "outline",
} as const;

const STATUS_LABEL = {
  new: "Yeni",
  reviewing: "İnceleniyor",
  sent: "Teklif Gönderildi",
  won: "Kazanıldı",
  lost: "Kapandı",
};

export default function MyQuotesPage() {
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();
  const db = useDatabase();

  if (!user) return null;
  const quotes = quotesForUser(user.id, db);

  if (quotes.length === 0) {
    return <EmptyState icon={<FileText size={38} />} title={t.account.noQuotes} />;
  }

  return (
    <div className="space-y-4">
      {quotes.map((q) => (
        <div key={q.id} className="rounded-[4px] border border-zw-grey-200 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-bold">{q.code}</span>
            <Badge tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</Badge>
            <span className="ml-auto text-sm text-zw-grey-500">
              {formatDate(q.createdAt, locale)}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-zw-grey-700">
            {q.items.map((item, i) => (
              <li key={i}>
                {item.quantity} × {item.productName}
              </li>
            ))}
          </ul>
          {q.message && <p className="mt-3 text-sm text-zw-grey-500">{q.message}</p>}
        </div>
      ))}
    </div>
  );
}

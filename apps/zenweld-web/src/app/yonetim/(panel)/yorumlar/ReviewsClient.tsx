"use client";

import { useMemo, useState } from "react";
import { Check, Search, Star, Trash2, X } from "lucide-react";
import { FEATURED_REVIEW_LIMIT, featuredReviewCount, listAllReviews, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Input, StarRating } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { useRequestActions, type PanelAnswer } from "@/lib/admin-requests";
import { formatDate } from "@zenweld/utils";

/**
 * YORUM YONETIMI
 *
 * Yeni yorumlar once onay bekler; onaylananlar urun sayfasinda gorunur.
 * "Anasayfada goster" isaretlenen en fazla 10 yorum anasayfadaki kayan
 * seritte cikar. Veritabani modunda degisiklik sunucuya yazilir ve sitenin
 * yorumlari hemen yenilenir (lib/admin-requests.ts).
 */
export function ReviewsClient() {
  const db = useDatabase();
  const actions = useRequestActions();
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reviews = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return listAllReviews(db).filter((r) => {
      if (onlyPending && r.approved) return false;
      if (!q) return true;
      return (
        r.authorName.toLocaleLowerCase("tr").includes(q) ||
        r.body.toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [db, query, onlyPending]);

  const featuredCount = featuredReviewCount(db);
  const pendingCount = db.reviews.filter((r) => !r.approved).length;
  const productName = (id: string) => db.products.find((p) => p.id === id)?.name ?? id;
  const run = async (action: Promise<PanelAnswer>) => {
    setNotice(null);
    const answer = await action;
    if (!answer.ok) setNotice(answer.error);
  };

  return (
    <>
      <AdminPageHeader
        title="Yorumlar"
        description={`${reviews.length} yorum · ${pendingCount} onay bekliyor · anasayfada ${featuredCount}/${FEATURED_REVIEW_LIMIT}`}
      />

      {notice && (
        <div className="mb-4">
          <Alert tone="danger">{notice}</Alert>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            className="pl-9"
            placeholder="Yorum veya kişi ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          variant={onlyPending ? "primary" : "outline"}
          onClick={() => setOnlyPending((v) => !v)}
        >
          Onay bekleyenler
        </Button>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className={`rounded-[6px] border p-4 ${
              r.approved ? "border-zw-grey-200 bg-white" : "border-amber-300 bg-amber-50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <StarRating value={r.rating} size={15} />
              <span className="font-semibold text-zw-ink">{r.authorName}</span>
              <span className="text-sm text-zw-grey-500">{productName(r.productId)}</span>
              <span className="text-xs text-zw-grey-400">{formatDate(r.createdAt)}</span>
              {!r.approved && <Badge tone="outline">Onay bekliyor</Badge>}
              {r.featured && <Badge tone="red">Anasayfada</Badge>}
              {r.verifiedPurchase && <Badge tone="grey">Doğrulanmış alıcı</Badge>}
            </div>

            {r.title && <h3 className="mt-2 font-semibold">{r.title}</h3>}
            <p className="mt-1 whitespace-pre-line text-sm text-zw-grey-700">{r.body}</p>

            {r.media.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.media.map((m, i) =>
                  m.kind === "video" ? (
                    <video key={i} src={m.url} controls className="h-20 rounded-[4px]" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={m.url} alt="" className="h-20 rounded-[4px] object-cover" />
                  ),
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={r.approved ? "outline" : "primary"}
                leftIcon={r.approved ? <X size={14} /> : <Check size={14} />}
                disabled={actions.pending}
                onClick={() => void run(actions.setReviewApproved(r, !r.approved))}
              >
                {r.approved ? "Yayından kaldır" : "Onayla"}
              </Button>

              <Button
                size="sm"
                variant={r.featured ? "primary" : "outline"}
                disabled={!r.approved || actions.pending}
                leftIcon={<Star size={14} />}
                onClick={() => void run(actions.setReviewFeatured(r, !r.featured))}
              >
                {r.featured ? "Anasayfadan çıkar" : "Anasayfada göster"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<Trash2 size={14} />}
                disabled={actions.pending}
                onClick={() => {
                  if (window.confirm(`${r.authorName} adlı kişinin yorumu silinsin mi? Bu işlem geri alınamaz.`)) {
                    void run(actions.deleteReview(r));
                  }
                }}
              >
                Sil
              </Button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-10 text-center text-sm text-zw-grey-500">
            Yorum bulunamadı.
          </p>
        )}
      </div>
    </>
  );
}

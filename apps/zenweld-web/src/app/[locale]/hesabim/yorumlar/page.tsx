"use client";

import { useMemo, useState } from "react";
import { Check, Search, Star, Trash2, X } from "lucide-react";
import {
  FEATURED_REVIEW_LIMIT,
  deleteReview,
  listAllReviews,
  saveReview,
  toggleFeaturedReview,
  useDatabase,
} from "@zenweld/store";
import { Alert, Badge, Button, Input, StarRating } from "@zenweld/ui";
import { useAuth } from "@zenweld/auth";

import { formatDate } from "@/lib/format";

/**
 * BAYI — KENDI MAGAZASININ YORUMLARI
 *
 * Bayi sahibi ANA SITEDEN giris yapar, Hesabim > Yorumlar'dan kendi
 * magazasinda (bayi sitesinde) gorunecek yorumlari yonetir. Baska bir
 * bayinin yorumlarini goremez: liste kullanicinin retailerId'sine gore
 * filtrelenir.
 *
 * Yeni yorumlar once onay bekler; onaylananlar bayi sitesindeki urun
 * sayfasinda gorunur. "Anasayfada goster" isaretlenenler ise bayi
 * sitesinin anasayfasindaki kayan seritte cikar (en fazla 10).
 */
export default function AccountReviewsPage() {
  const db = useDatabase();
  const { user } = useAuth();
  const retailerId = user?.retailerId;
  const [query, setQuery] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reviews = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!retailerId) return [];
    return listAllReviews("bayi", db, retailerId).filter((r) => {
      if (onlyPending && r.approved) return false;
      if (!q) return true;
      return (
        r.authorName.toLocaleLowerCase("tr").includes(q) ||
        r.body.toLocaleLowerCase("tr").includes(q)
      );
    });
  }, [db, query, onlyPending, retailerId]);

  const featuredCount = db.reviews.filter(
    (r) => r.site === "bayi" && r.retailerId === retailerId && r.featured,
  ).length;
  const pendingCount = db.reviews.filter(
    (r) => r.site === "bayi" && r.retailerId === retailerId && !r.approved,
  ).length;
  const productName = (id: string) => db.products.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold uppercase">Mağazamdaki Yorumlar</h2>
        <p className="mt-1 text-sm text-zw-grey-600">
          {retailerId
            ? `${reviews.length} yorum · ${pendingCount} onay bekliyor · mağaza anasayfasında ${featuredCount}/${FEATURED_REVIEW_LIMIT}`
            : "Hesabınıza bağlı bir online mağaza bulunmuyor."}
        </p>
      </div>

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
              <span className="text-xs text-zw-grey-400">{formatDate(r.createdAt, "tr")}</span>
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
                onClick={() => saveReview({ ...r, approved: !r.approved, featured: r.approved ? false : r.featured })}
              >
                {r.approved ? "Yayından kaldır" : "Onayla"}
              </Button>

              <Button
                size="sm"
                variant={r.featured ? "primary" : "outline"}
                disabled={!r.approved}
                leftIcon={<Star size={14} />}
                onClick={() => {
                  setNotice(null);
                  if (!toggleFeaturedReview(r.id)) {
                    setNotice(
                      `Anasayfada en fazla ${FEATURED_REVIEW_LIMIT} yorum gösterilebilir. Önce birini çıkarın.`,
                    );
                  }
                }}
              >
                {r.featured ? "Anasayfadan çıkar" : "Anasayfada göster"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                leftIcon={<Trash2 size={14} />}
                onClick={() => deleteReview(r.id)}
              >
                Sil
              </Button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-10 text-center text-sm text-zw-grey-500">
            Henüz yorum yok.
          </p>
        )}
      </div>
    </>
  );
}

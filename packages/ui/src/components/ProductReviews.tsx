"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ImagePlus, Trash2 } from "lucide-react";
import { StarRating } from "./StarRating";
import { Button } from "./Button";

/**
 * URUN DEGERLENDIRMELERI
 *
 * Iki sitede de ayni bilesen kullanilir; site farkini cagiran taraf
 * `site` propuyla verir. Veri erisimi disaridan gelir (props), boylece
 * paket katmani store'a bagimli kalmaz.
 *
 * Yorum gonderildiginde dogrudan yayinlanmaz; ana sitede yonetim
 * panelinde, bayi magazasinda ise bayinin Hesabim > Yorumlar sayfasinda
 * onaylanmasi gerekir. Amac, gercek bir markanin sayfasinda denetimsiz
 * icerik yayinlanmamasi.
 */

export interface ReviewMediaInput {
  url: string;
  kind: "image" | "video";
}

export interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  media: ReviewMediaInput[];
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface ReviewsTexts {
  heading: string;
  empty: string;
  writeCta: string;
  formTitle: string;
  yourRating: string;
  yourName: string;
  reviewTitle: string;
  reviewBody: string;
  addMedia: string;
  mediaHint: string;
  submit: string;
  sending: string;
  pending: string;
  verified: string;
  averageOf: string;
  errorRating: string;
  errorBody: string;
  errorName: string;
}

export function ProductReviews({
  items,
  average,
  texts,
  locale,
  defaultName = "",
  onSubmit,
  onPickMedia,
}: {
  items: ReviewItem[];
  average: number;
  texts: ReviewsTexts;
  locale: string;
  defaultName?: string;
  onSubmit: (input: {
    authorName: string;
    rating: number;
    title: string;
    body: string;
    media: ReviewMediaInput[];
  }) => void;
  /** Dosya secildiginde cagrilir; kucultme/donusturme cagiranda yapilir. */
  onPickMedia?: (files: FileList | null, add: (m: ReviewMediaInput) => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(defaultName);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<ReviewMediaInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const fmt = useMemo(
    () => new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", { dateStyle: "medium" }),
    [locale],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rating < 1) return setError(texts.errorRating);
    if (!name.trim()) return setError(texts.errorName);
    if (!body.trim()) return setError(texts.errorBody);

    onSubmit({ authorName: name.trim(), rating, title: title.trim(), body: body.trim(), media });
    setSent(true);
    setOpen(false);
    setRating(0);
    setTitle("");
    setBody("");
    setMedia([]);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold uppercase">{texts.heading}</h2>
          {items.length > 0 && (
            <span className="flex items-center gap-2 text-sm text-zw-grey-600">
              <StarRating value={average} />
              {average.toFixed(1)} · {texts.averageOf.replace("{count}", String(items.length))}
            </span>
          )}
        </div>
        {!open && (
          <Button variant="outline" onClick={() => setOpen(true)}>
            {texts.writeCta}
          </Button>
        )}
      </div>

      {sent && (
        <p className="mb-5 rounded-[4px] border border-zw-grey-200 bg-zw-grey-50 px-4 py-3 text-sm text-zw-grey-700">
          {texts.pending}
        </p>
      )}

      {open && (
        <form
          onSubmit={submit}
          className="mb-6 space-y-4 rounded-[6px] border border-zw-grey-200 bg-white p-5"
        >
          <h3 className="font-display text-lg font-bold uppercase">{texts.formTitle}</h3>

          {error && (
            <p className="rounded-[4px] bg-zw-red-50 px-3 py-2 text-sm font-semibold text-zw-red-700">
              {error}
            </p>
          )}

          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              {texts.yourRating}
            </div>
            <StarRating value={rating} onChange={setRating} size={26} label={texts.yourRating} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                {texts.yourName}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-[4px] border border-zw-grey-300 px-3 text-sm zw-focus"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                {texts.reviewTitle}
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 w-full rounded-[4px] border border-zw-grey-300 px-3 text-sm zw-focus"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              {texts.reviewBody}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-28 w-full rounded-[4px] border border-zw-grey-300 p-3 text-sm zw-focus"
            />
          </label>

          {onPickMedia && (
            <div>
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink">
                <ImagePlus size={16} />
                {texts.addMedia}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onPickMedia(e.target.files, (m) => setMedia((list) => [...list, m]));
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="mt-1.5 text-xs text-zw-grey-500">{texts.mediaHint}</p>

              {media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {media.map((m, i) => (
                    <div
                      key={i}
                      className="relative h-20 w-20 overflow-hidden rounded-[4px] border border-zw-grey-200"
                    >
                      {m.kind === "video" ? (
                        <video src={m.url} className="h-full w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setMedia((list) => list.filter((_, x) => x !== i))}
                        className="absolute right-0.5 top-0.5 rounded-[3px] bg-white/90 p-1 text-zw-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit">{texts.submit}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ✕
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-8 text-center text-sm text-zw-grey-500">
          {texts.empty}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((r) => (
            <div key={r.id} className="rounded-[6px] border border-zw-grey-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={r.rating} size={16} />
                <span className="font-semibold text-zw-ink">{r.authorName}</span>
                {r.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zw-red-600">
                    <BadgeCheck size={14} />
                    {texts.verified}
                  </span>
                )}
                <span className="text-xs text-zw-grey-500">{fmt.format(new Date(r.createdAt))}</span>
              </div>
              {r.title && <h3 className="mt-2 font-semibold text-zw-ink">{r.title}</h3>}
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-zw-grey-700">
                {r.body}
              </p>
              {r.media.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.media.map((m, i) =>
                    m.kind === "video" ? (
                      <video
                        key={i}
                        src={m.url}
                        controls
                        className="h-28 rounded-[4px] border border-zw-grey-200"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={m.url}
                        alt=""
                        className="h-28 rounded-[4px] border border-zw-grey-200 object-cover"
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

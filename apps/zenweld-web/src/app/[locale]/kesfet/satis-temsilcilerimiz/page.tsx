"use client";

import { useMemo, useState } from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { listSalesReps, useDatabase } from "@zenweld/store";
import { EmptyState } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { ProductImage } from "@/components/common/ProductImage";
import { useT, useText } from "@/lib/i18n-client";

/** "Murat Kapucu" -> "MK" (fotograf yoksa gosterilen bas harfler) */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toLocaleUpperCase("tr");
}

/** tel: ve WhatsApp baglantilari icin yalnizca rakamlar (ulke kodu dahil) */
const digits = (phone: string) => phone.replace(/\D/g, "");

/**
 * KESFET > SATIS TEMSILCILERIMIZ
 *
 * Liste yonetim panelinden (/yonetim/satis-temsilcileri) gelir. Bolge
 * dugmeleri listedeki bolgelerden kendiliginden olusur.
 */
export default function SalesRepsPage() {
  const t = useT();
  const text = useText();
  const db = useDatabase();
  const reps = useMemo(() => listSalesReps(db), [db]);
  const [region, setRegion] = useState("");

  // Bolgeler listedeki siraya gore, tekrarsiz
  const regions = useMemo(
    () => Array.from(new Set(reps.map((r) => text(r.region)))),
    [reps, text],
  );
  const shown = region ? reps.filter((r) => text(r.region) === region) : reps;

  return (
    <>
      <PageHero title={t.explore.salesReps} subtitle={t.explore.salesRepsIntro} />

      <div className="zw-container py-10">
        {regions.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {["", ...regions].map((r) => (
              <button
                key={r || "all"}
                type="button"
                onClick={() => setRegion(r)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  region === r
                    ? "bg-zw-ink text-white"
                    : "bg-zw-grey-100 text-zw-grey-700 hover:bg-zw-grey-200"
                }`}
              >
                {r || t.explore.salesRepsAllRegions}
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <EmptyState title={t.explore.salesRepsEmpty} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((rep) => (
              <article
                key={rep.id}
                className="flex flex-col rounded-[4px] border border-zw-grey-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {rep.photoUrl ? (
                    <ProductImage
                      src={rep.photoUrl}
                      alt={rep.name}
                      label={rep.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zw-ink font-display text-xl font-bold text-white"
                    >
                      {initials(rep.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold uppercase leading-tight">
                      {rep.name}
                    </h2>
                    <p className="mt-0.5 text-sm font-semibold text-zw-red-600">
                      {text(rep.region)}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="shrink-0 text-zw-grey-400" />
                    <a href={`tel:+${digits(rep.phone)}`} className="hover:text-zw-red-600">
                      {rep.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="shrink-0 text-zw-grey-400" />
                    <a href={`mailto:${rep.email}`} className="truncate hover:text-zw-red-600">
                      {rep.email}
                    </a>
                  </div>
                </dl>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                  <a
                    href={`tel:+${digits(rep.phone)}`}
                    className="flex items-center justify-center gap-1.5 rounded-[4px] bg-zw-ink py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-zw-red-600"
                  >
                    <Phone size={14} /> {t.explore.salesRepsCall}
                  </a>
                  <a
                    href={`https://wa.me/${digits(rep.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-[4px] border border-zw-grey-300 py-2.5 text-xs font-bold uppercase tracking-wide text-zw-ink transition-colors hover:border-[#25D366] hover:text-[#128C7E]"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

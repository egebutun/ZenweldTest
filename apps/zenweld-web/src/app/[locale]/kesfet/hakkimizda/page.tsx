"use client";

import { stockPhotos } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { LoremParagraphs, PageHero, Prose } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";

export default function AboutPage() {
  const t = useT();
  const db = useDatabase();

  const stats = [
    { value: `${db.dealers.length}+`, label: t.nav.findDealer },
    { value: `${db.products.filter((p) => p.active).length}+`, label: t.search.products },
    { value: "25+", label: "Yıllık Tecrübe" },
    { value: "%100", label: t.trust.local },
  ];

  return (
    <>
      <PageHero
        title={t.explore.about}
        subtitle={t.explore.aboutDesc}
        image={stockPhotos.industrialShop}
      />

      <div className="zw-container border-b border-zw-grey-200 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-4xl font-bold text-zw-red-600">{s.value}</div>
              <div className="mt-1 text-sm text-zw-grey-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Prose>
        <LoremParagraphs count={6} />
      </Prose>
    </>
  );
}

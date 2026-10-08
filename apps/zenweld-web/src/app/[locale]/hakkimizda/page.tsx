"use client";

import { about as defaultAbout } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { PageHero } from "@/components/common/PageShell";
import { ProductImage } from "@/components/common/ProductImage";
import { RichText } from "@/components/events/RichText";
import { useText } from "@/lib/i18n-client";

/**
 * HAKKIMIZDA
 *
 * Icerik yonetim panelinden (/yonetim/hakkimizda) gelir: ust baslik,
 * rakam kutulari ve sirali metin bolumleri. Gorseli olan bolumler metin
 * ve gorsel yan yana, sirayla sag/sol degisecek sekilde dizilir.
 */
export default function AboutPage() {
  const text = useText();
  const db = useDatabase();
  const about = db.about ?? defaultAbout;

  return (
    <>
      <PageHero
        title={text(about.heroTitle)}
        subtitle={text(about.heroSubtitle) || undefined}
        image={about.heroImage || undefined}
      />

      {about.stats.length > 0 && (
        <div className="zw-container border-b border-zw-grey-200 py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {about.stats.map((s) => (
              <div key={s.id}>
                <div className="font-display text-4xl font-bold text-zw-red-600">{s.value}</div>
                <div className="mt-1 text-sm text-zw-grey-600">{text(s.label)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="zw-container space-y-14 py-12">
        {about.sections.map((section, i) => (
          <section
            key={section.id}
            className={
              section.imageUrl
                ? "grid items-center gap-8 lg:grid-cols-2"
                : "max-w-3xl"
            }
          >
            <div className={section.imageUrl && i % 2 === 1 ? "lg:order-2" : ""}>
              {text(section.title) && (
                <h2 className="font-display text-3xl font-bold uppercase leading-tight">
                  {text(section.title)}
                </h2>
              )}
              <RichText source={text(section.body)} lead={false} className="mt-4" />
            </div>
            {section.imageUrl && (
              <div className="overflow-hidden rounded-[4px] bg-zw-grey-100">
                <ProductImage
                  src={section.imageUrl}
                  alt={text(section.title)}
                  label={text(section.title)}
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

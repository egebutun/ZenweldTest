import { Suspense } from "react";
import { isLocale, getDictionary, type Locale } from "@zenweld/i18n";
import { PageHero } from "@/components/common/PageShell";
import { WarrantyChooser } from "@/components/warranty/WarrantyChooser";

/**
 * GARANTI
 *
 * Garanti Kaydi ve Garanti Sorgulama tek basligin altinda toplandi;
 * menude de tek "Garanti" ogesi var. Secim bu sayfada yapilir.
 */
export default async function WarrantyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const t = getDictionary(lang);

  return (
    <>
      <PageHero title={t.explore.warranty} subtitle={t.explore.warrantyDesc} />
      {/* useSearchParams kullanildigi icin Suspense sinir gerekiyor. */}
      <Suspense>
        <WarrantyChooser />
      </Suspense>
    </>
  );
}

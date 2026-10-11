import { isLocale, getDictionary } from "@zenweld/i18n";
import { PageHero } from "@/components/common/PageShell";
import { WarrantyChooser, type WarrantyAction } from "./WarrantyChooser";

/**
 * GARANTI SAYFALARI
 *
 *   /garanti            secim ekrani
 *   /garanti/kayit      Garanti Kaydi formu acik
 *   /garanti/sorgulama  Garanti Sorgulama formu acik
 *
 * Kayit ve sorgulama ayri adreslerdir; her biri kendi basligi ve
 * aciklamasiyla aramada listelenebilir (bkz. lib/page-meta.ts).
 */
export function WarrantyPage({ action, locale }: { action: WarrantyAction | null; locale: string }) {
  const t = getDictionary(isLocale(locale) ? locale : "tr");
  const title =
    action === "kayit"
      ? t.nav.warrantyRegister
      : action === "sorgula"
        ? t.nav.warrantyCheck
        : t.explore.warranty;

  return (
    <>
      <PageHero title={title} subtitle={t.explore.warrantyDesc} />
      <WarrantyChooser selected={action} />
    </>
  );
}

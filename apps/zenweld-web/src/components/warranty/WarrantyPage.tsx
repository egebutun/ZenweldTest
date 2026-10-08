import type { Metadata } from "next";
import { isLocale, getDictionary, type Locale } from "@zenweld/i18n";
import { PageHero } from "@/components/common/PageShell";
import { languageAlternates, ogUrl } from "@/lib/seo";
import { WarrantyChooser, type WarrantyAction } from "./WarrantyChooser";

/**
 * GARANTI SAYFALARI
 *
 *   /garanti            secim ekrani
 *   /garanti/kayit      Garanti Kaydi formu acik
 *   /garanti/sorgulama  Garanti Sorgulama formu acik
 *
 * Kayit ve sorgulama ayri adreslerdir (onceden ?islem=kayit sorgusuydu);
 * boylece her biri kendi basligi ve aciklamasiyla aramada listelenebilir.
 */
type Key = WarrantyAction | "secim";

const PATHS: Record<Key, string> = {
  secim: "/garanti",
  kayit: "/garanti/kayit",
  sorgula: "/garanti/sorgulama",
};

const META: Record<Key, Record<Locale, { title: string; description: string }>> = {
  secim: {
    tr: {
      title: "Garanti",
      description:
        "Zenweld makinenizin garantisini online kaydedin ya da seri numaranızla mevcut garantinizi sorgulayın.",
    },
    en: {
      title: "Warranty",
      description:
        "Register your Zenweld machine's warranty online or look up an existing warranty by serial number.",
    },
  },
  kayit: {
    tr: {
      title: "Garanti Kaydı",
      description:
        "Zenweld makinenizin garantisini seri numarasıyla online kaydedin ve garanti sürenizi uzatın.",
    },
    en: {
      title: "Warranty Registration",
      description:
        "Register your Zenweld machine's warranty online with its serial number and extend your warranty period.",
    },
  },
  sorgula: {
    tr: {
      title: "Garanti Sorgulama",
      description:
        "Zenweld makinenizin garanti durumunu ve bitiş tarihini seri numarasıyla sorgulayın.",
    },
    en: {
      title: "Warranty Check",
      description: "Check your Zenweld machine's warranty status and expiry date by serial number.",
    },
  },
};

const toLang = (locale: string) => (isLocale(locale) ? locale : "tr") as Locale;

export function warrantyMetadata(action: WarrantyAction | null, locale: string): Metadata {
  const lang = toLang(locale);
  const key = action ?? "secim";
  const { title, description } = META[key][lang];
  return {
    title,
    description,
    alternates: languageAlternates(PATHS[key], lang),
    openGraph: { title, description, url: ogUrl(PATHS[key], lang) },
  };
}

export function WarrantyPage({ action, locale }: { action: WarrantyAction | null; locale: string }) {
  const t = getDictionary(toLang(locale));
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

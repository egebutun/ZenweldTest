import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "MSDS — Malzeme Güvenlik Bilgi Formları" : "MSDS — Safety Data Sheets";
  const description =
    lang === "tr"
      ? "Zenweld ürünlerine ait malzeme güvenlik bilgi formlarını sorgulayın."
      : "Look up material safety data sheets for Zenweld products.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/msds", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/msds` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

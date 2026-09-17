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
  const title = lang === "tr" ? "Servis Ağı" : "Service Network";
  const description =
    lang === "tr"
      ? "Türkiye genelindeki Zenweld yetkili servis noktaları; bakım, onarım ve kalibrasyon."
      : "Zenweld authorised service points across Türkiye for maintenance, repair and calibration.";

  return {
    title,
    description,
    alternates: languageAlternates("/destek/servis-agi", lang),
    openGraph: { title, description, url: `/${lang}/destek/servis-agi` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

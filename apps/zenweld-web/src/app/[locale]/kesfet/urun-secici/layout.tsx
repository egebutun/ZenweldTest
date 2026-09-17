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
  const title = lang === "tr" ? "Ürün Seçici" : "Product Selector";
  const description =
    lang === "tr"
      ? "Üç soruda ihtiyacınıza uygun Zenweld kaynak makinesini bulun."
      : "Find the right Zenweld welding machine for your needs in three questions.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/urun-secici", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/urun-secici` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

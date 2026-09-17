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
  const title = lang === "tr" ? "Hakkımızda" : "About Us";
  const description =
    lang === "tr"
      ? "ZENWELD-BAYİ-A hakkında: yetkili Zenweld bayisi olarak sunduğumuz ürünler ve hizmetler."
      : "About ZENWELD-BAYİ-A: the products and services we offer as an authorised Zenweld dealer.";

  return {
    title,
    description,
    alternates: languageAlternates("/hakkimizda", lang),
    openGraph: { title, description, url: `/${lang}/hakkimizda` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
      ? "Zenweld hakkında: kaynak teknolojileri, üretim yaklaşımımız ve Türkiye genelindeki bayi ağımız."
      : "About Zenweld: welding technologies, our approach to manufacturing and our dealer network across Türkiye.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/hakkimizda", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/hakkimizda` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

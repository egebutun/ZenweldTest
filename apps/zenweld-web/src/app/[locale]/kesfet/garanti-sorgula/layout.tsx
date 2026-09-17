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
  const title = lang === "tr" ? "Garanti Sorgula" : "Check Your Warranty";
  const description =
    lang === "tr"
      ? "Seri numaranızı girerek Zenweld ürününüzün garanti durumunu ve bitiş tarihini öğrenin."
      : "Enter your serial number to see your Zenweld product's warranty status and expiry date.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/garanti-sorgula", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/garanti-sorgula` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  const title = lang === "tr" ? "Garanti Kaydı" : "Register Your Warranty";
  const description =
    lang === "tr"
      ? "Zenweld makinenizi online kaydedin, garanti sürenize 12 ay ücretsiz uzatma kazanın."
      : "Register your Zenweld machine online and get 12 extra months of warranty for free.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/garanti-kayit", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/garanti-kayit` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

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
  const title = lang === "tr" ? "Garanti" : "Warranty";
  const description =
    lang === "tr"
      ? "Zenweld makinenizin garantisini online kaydedin ya da seri numaranızla mevcut garantinizi sorgulayın."
      : "Register your Zenweld machine's warranty online or look up an existing warranty by serial number.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/garanti", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/garanti` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

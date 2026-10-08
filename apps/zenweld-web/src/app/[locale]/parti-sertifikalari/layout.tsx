import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { languageAlternates, ogUrl } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Parti Sertifikaları" : "Batch Certificates";
  const description =
    lang === "tr"
      ? "Zenweld ürün uygunluk ve parti sertifikalarını indirin."
      : "Download Zenweld product compliance and batch certificates.";

  return {
    title,
    description,
    alternates: languageAlternates("/parti-sertifikalari", lang),
    openGraph: { title, description, url: ogUrl(`/parti-sertifikalari`, lang) },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

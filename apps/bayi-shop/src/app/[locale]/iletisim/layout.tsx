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
  const title = lang === "tr" ? "İletişim" : "Contact Us";
  const description =
    lang === "tr"
      ? "ZENWELD-BAYİ-A iletişim bilgileri: telefon, e-posta, adres ve çalışma saatleri."
      : "ZENWELD-BAYİ-A contact details: phone, email, address and opening hours.";

  return {
    title,
    description,
    alternates: languageAlternates("/iletisim", lang),
    openGraph: { title, description, url: `/${lang}/iletisim` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

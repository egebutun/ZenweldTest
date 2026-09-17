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
      ? "Zenweld ile iletişime geçin: telefon, e-posta ve adres bilgileri."
      : "Get in touch with Zenweld: phone, email and address.";

  return {
    title,
    description,
    alternates: languageAlternates("/destek/iletisim", lang),
    openGraph: { title, description, url: `/${lang}/destek/iletisim` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

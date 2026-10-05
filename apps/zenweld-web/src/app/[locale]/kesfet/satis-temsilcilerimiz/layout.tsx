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
  const title = lang === "tr" ? "Satış Temsilcilerimiz" : "Our Sales Representatives";
  const description =
    lang === "tr"
      ? "Zenweld satış temsilcileri: İstanbul, Ege, Akdeniz, Bursa ve İç Anadolu bölgelerinde telefon, WhatsApp ve e-posta ile doğrudan iletişim."
      : "Zenweld sales representatives: contact our team in Istanbul, the Aegean, Mediterranean, Bursa and Central Anatolia regions by phone, WhatsApp or e-mail.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/satis-temsilcilerimiz", lang),
    openGraph: { title, description, url: ogUrl("/kesfet/satis-temsilcilerimiz", lang) },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

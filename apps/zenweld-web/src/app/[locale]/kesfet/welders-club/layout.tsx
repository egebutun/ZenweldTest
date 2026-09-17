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
  const title = lang === "tr" ? "Welders Club" : "Welders Club";
  const description =
    lang === "tr"
      ? "Binlerce kaynakçının buluştuğu Zenweld topluluğuna katılın; üyelere özel indirimler, eğitim içerikleri ve etkinlik davetiyeleri."
      : "Join the Zenweld community of thousands of welders — member discounts, training content and event invitations.";

  return {
    title,
    description,
    alternates: languageAlternates("/kesfet/welders-club", lang),
    openGraph: { title, description, url: `/${lang}/kesfet/welders-club` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

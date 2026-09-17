import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";
import { SITE_NAME, languageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Destek" : "Support";
  const description =
    lang === "tr"
      ? "Zenweld teknik destek, servis ağı, sık sorulan sorular ve iletişim bilgileri."
      : "Zenweld technical support, service network, FAQ and contact details.";

  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    alternates: languageAlternates("/destek", lang),
    openGraph: { title, description, url: `/${lang}/destek` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

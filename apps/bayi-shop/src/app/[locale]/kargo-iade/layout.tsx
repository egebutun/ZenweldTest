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
  const title = lang === "tr" ? "Kargo ve İade" : "Shipping and Returns";
  const description =
    lang === "tr"
      ? "Kargo süreleri, ücretsiz kargo limiti ve iade koşulları."
      : "Shipping times, free shipping threshold and return conditions.";

  return {
    title,
    description,
    alternates: languageAlternates("/kargo-iade", lang),
    openGraph: { title, description, url: `/${lang}/kargo-iade` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

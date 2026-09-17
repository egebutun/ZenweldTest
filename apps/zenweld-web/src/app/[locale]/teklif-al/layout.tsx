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
  const title = lang === "tr" ? "Teklif Al" : "Request a Quote";
  const description =
    lang === "tr"
      ? "Kurumsal müşterilerimize vadeli ödeme ve çek ile ödeme seçenekleri sunuyoruz. Formu doldurun, satış ekibimiz sizinle iletişime geçsin."
      : "We offer deferred payment and payment by cheque for corporate customers. Fill in the form and our sales team will contact you.";

  return {
    title,
    description,
    alternates: languageAlternates("/teklif-al", lang),
    openGraph: { title, description, url: `/${lang}/teklif-al` },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

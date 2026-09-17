import type { Metadata } from "next";
import { isLocale, type Locale } from "@zenweld/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const lang = (isLocale(locale) ? locale : "tr") as Locale;
  const title = lang === "tr" ? "Üye Ol" : "Create an Account";
  const description =
    lang === "tr"
      ? "Zenweld hesabı oluşturun."
      : "Create a Zenweld account.";

  return {
    title,
    description,
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { DealerFinder } from "@/components/dealers/DealerFinder";
import { absoluteUrl, canonical } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Nereden Alabilirim — Bayi Bul";
  const description =
    "Size en yakın Zenweld yetkili bayisini haritada bulun; ürünleri yerinde inceleyin ve satın alın.";

  return {
    title,
    description,
    alternates: canonical("/yetkili-bayi-ve-servis-agi"),
    openGraph: { title, description, url: absoluteUrl(`/yetkili-bayi-ve-servis-agi`) },
  };
}

export default function WhereToBuyPage() {
  return <DealerFinder />;
}

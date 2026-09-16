"use client";

import { use } from "react";
import { CategoryListing } from "@/components/product/CategoryListing";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; kategori: string }>;
}) {
  const { kategori } = use(params);
  return <CategoryListing section="guvenlik" categorySlug={kategori} />;
}

"use client";

import { Heart } from "lucide-react";
import { useDatabase, visibleProducts } from "@zenweld/store";
import { EmptyState } from "@zenweld/ui";
import { ProductGrid } from "@/components/product/ProductGrid";
import { useFavourites } from "@/lib/favourites";
import { useT } from "@/lib/i18n-client";

export default function FavouritesPage() {
  const t = useT();
  const db = useDatabase();
  const favourites = useFavourites();
  // Yayindan kaldirilan urun favorilerde de gorunmez.
  const products = visibleProducts(favourites.ids, db);

  if (products.length === 0) {
    return <EmptyState icon={<Heart size={38} />} title={t.account.noFavourites} />;
  }

  return <ProductGrid products={products} />;
}

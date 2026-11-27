"use client";

import type { Product } from "@zenweld/data";
import { EmptyState } from "@zenweld/ui";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { useT } from "@/lib/i18n-client";

export function ProductGrid({ products }: { products: Product[] }) {
  const t = useT();

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<PackageSearch size={40} />}
        title={t.search.noResultsTitle}
        text={t.search.noResultsText}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Ilk kartin fotografi ilk ekranda: oncelikli (Ölçüm 16). */}
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i === 0} />
      ))}
    </div>
  );
}

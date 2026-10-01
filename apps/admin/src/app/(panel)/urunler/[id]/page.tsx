"use client";

import { use } from "react";
import { findProductById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/AdminShell";
import { ProductForm } from "@/components/ProductForm";
import { siteUrl } from "@/lib/links";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const db = useDatabase();
  const product = findProductById(id, db);

  if (!product) {
    return <Alert tone="danger">Ürün bulunamadı.</Alert>;
  }

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
        action={
          <a
            href={siteUrl(`/urun/${product.slug}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Ürün sayfasını gör ↗
          </a>
        }
      />
      <ProductForm product={product} />
    </>
  );
}

"use client";

import { use } from "react";
import { findProductById, useDatabase } from "@zenweld/store";
import { Alert } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { LocaleLink } from "@/components/common/LocaleLink";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
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
          <LocaleLink
            href={`/urun/${product.slug}`}
            className="text-sm font-semibold text-zw-red-600 hover:underline"
          >
            Ürün sayfasını gör →
          </LocaleLink>
        }
      />
      <ProductForm product={product} />
    </>
  );
}

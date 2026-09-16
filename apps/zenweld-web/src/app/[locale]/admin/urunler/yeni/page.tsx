"use client";

import { AdminPageHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <>
      <AdminPageHeader
        title="Yeni Ürün"
        description="Kataloğa yeni bir ürün ekleyin. Kaydettikten sonra stok matrisinden satıcı stoklarını işaretleyebilirsiniz."
      />
      <ProductForm />
    </>
  );
}

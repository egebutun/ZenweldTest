"use client";

import { useRouter } from "next/navigation";
import { validateDiscount, type Product } from "@zenweld/data";
import { createProduct, saveProduct, useDatabase } from "@zenweld/store";
import { slugify } from "@zenweld/utils";
import { ContentFormShell, useContentForm } from "./content-form";
import { BasicsTab } from "./product/BasicsTab";
import { DescriptionTab } from "./product/DescriptionTab";
import { ImagesTab } from "./product/ImagesTab";
import { InTheBoxTab, SpecsTab } from "./product/ListTabs";
import { SeoPanel } from "./SeoPanel";
import { productSeo } from "@/lib/seo";

/**
 * URUN FORMU
 *
 * Durum ve kayit kurallari burada; her sekme components/admin/product/
 * altinda kendi dosyasindadir. Cerceve (uyarilar, sekmeler, Kaydet/Vazgec)
 * icerik formlariyla ortaktir.
 */
export function ProductForm({ product }: { product?: Product }) {
  const db = useDatabase();
  const router = useRouter();
  const isNew = !product;
  const form = useContentForm<Product>(
    product ?? {
      id: "",
      slug: "",
      sku: "",
      name: "",
      section: "ekipmanlar",
      categorySlug: db.categories[0]?.slug ?? "",
      processes: [],
      shortDescription: "",
      description: "",
      priceExVat: 0,
      vatRate: 20,
      currency: "TRY",
      images: [],
      specs: [],
      inTheBox: [],
      highlights: [],
      quotable: true,
      featured: false,
      isNew: true,
      warrantyMonths: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
    },
  );
  const { draft } = form;
  const tabProps = { draft, set: form.set, setDraft: form.setDraft };

  const submit = () => {
    form.setError(null);
    if (!draft.name.trim()) return form.fail("Ürün adı zorunludur.");

    const slug = draft.slug.trim() || slugify(draft.name);
    if (db.products.some((p) => p.slug === slug && p.id !== draft.id)) {
      return form.fail(`"${slug}" adresi başka bir üründe kullanılıyor.`);
    }

    const discountError = draft.discount ? validateDiscount(draft.discount) : null;
    if (discountError) return form.fail(discountError);

    if (isNew) {
      router.push(`/yonetim/urunler/${createProduct({ ...draft, slug }).id}`);
    } else {
      saveProduct({ ...draft, slug });
      form.flashSaved();
    }
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
      savedText="Ürün kaydedildi."
      submitLabel={isNew ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "aciklama", label: "Açıklamalar" },
        { id: "gorseller", label: "Görseller", badge: draft.images.length },
        { id: "teknik", label: "Teknik Özellikler", badge: draft.specs.length },
        { id: "kutu", label: "Kutu İçeriği", badge: draft.inTheBox.length },
        { id: "seo", label: "SEO" },
      ]}
    >
      {form.tab === "temel" && <BasicsTab {...tabProps} isNew={isNew} />}
      {form.tab === "aciklama" && <DescriptionTab {...tabProps} />}
      {form.tab === "gorseller" && <ImagesTab {...tabProps} onError={form.setError} />}
      {form.tab === "teknik" && <SpecsTab {...tabProps} />}
      {form.tab === "kutu" && <InTheBoxTab {...tabProps} />}
      {form.tab === "seo" && (
        <SeoPanel
          noun="Ürün"
          path="/urun"
          slug={draft.slug}
          onSlugChange={(v) => form.set("slug", v)}
          stored={product && db.products.find((p) => p.id === product.id)}
          value={draft.seo}
          onChange={(seo) => form.set("seo", seo)}
          compute={(seo) => productSeo({ ...draft, seo }, db.categories.find((c) => c.slug === draft.categorySlug))}
          descriptionFallback="ürünün kısa açıklaması"
        />
      )}
    </ContentFormShell>
  );
}

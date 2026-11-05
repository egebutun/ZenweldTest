"use client";

import { useRouter } from "next/navigation";
import {
  optionsError,
  productCodeError,
  productSlugTakenText,
  tidyFilterValues,
  tidyOptions,
  validateDiscount,
  type Product,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { useDatabase } from "@zenweld/store";
import { ContentFormShell, EMPTY_SLUG_ERROR, findSlugClash, resolveSlug, useContentForm } from "./content-form";
import { BasicsTab } from "./product/BasicsTab";
import { DescriptionTab } from "./product/DescriptionTab";
import { ImagesTab } from "./product/ImagesTab";
import { InTheBoxTab, SpecsTab } from "./product/ListTabs";
import { FiltersTab } from "./product/FiltersTab";
import { OptionsTab } from "./product/OptionsTab";
import { SeoPanel, storedLinks } from "./SeoPanel";
import { productSeo } from "@/lib/seo";
import { useCatalogActions } from "@/lib/admin-catalog";

/**
 * URUN FORMU
 *
 * Durum ve kayit kurallari burada; her sekme components/admin/product/
 * altinda kendi dosyasindadir. Cerceve (uyarilar, sekmeler, Kaydet/Vazgec)
 * icerik formlariyla ortaktir. Kurallar packages/data › catalog-rules.ts;
 * veritabani modunda kayit sunucuya gider (lib/admin-catalog.ts) ve sunucu
 * ayni kurallari yeniden dener.
 */

/** Sunucunun reddettigi kaydin hangi sekmede duzeltilecegi. */
function errorTab(error: string): string {
  if (error.startsWith("Ürün kodu")) return "temel";
  if (error.includes(" adresi ")) return "seo";
  if (/kombinasyon|seçenek/.test(error)) return "secenekler";
  if (error === tr.panel.uploadDisabled) return "gorseller";
  return "temel";
}
export function ProductForm({ product }: { product?: Product }) {
  const db = useDatabase();
  const router = useRouter();
  const actions = useCatalogActions();
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
      isNew: true,
      warrantyMonths: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
    },
  );
  const { draft } = form;
  const tabProps = { draft, set: form.set, setDraft: form.setDraft };

  const submit = async () => {
    form.setError(null);
    if (!draft.name.trim()) return form.fail("Ürün adı zorunludur.");

    const codeProblem = productCodeError(draft, db.products);
    if (codeProblem) return form.fail(codeProblem);

    const slug = resolveSlug(draft.slug, draft.name);
    if (!slug) return form.fail(EMPTY_SLUG_ERROR, "seo");
    const clash = findSlugClash(db.products, draft.id, slug);
    if (clash) return form.fail(productSlugTakenText(slug, clash.name), "seo");

    const discountError = draft.discount ? validateDiscount(draft.discount) : null;
    if (discountError) return form.fail(discountError);

    const optionsProblem = optionsError(draft, db.optionDefinitions, db.products);
    if (optionsProblem) return form.fail(optionsProblem, "secenekler");

    // Yalnizca kategorinin bugunku filtrelerine ait degerler kaydedilir.
    const category = db.categories.find((c) => c.slug === draft.categorySlug);
    const record = {
      ...draft,
      slug,
      options: tidyOptions(draft),
      filterValues: tidyFilterValues(draft.filterValues, category?.filters),
    };
    const stored = product && db.products.find((p) => p.id === product.id);
    const answer = await actions.saveProduct(record, stored);
    if (!answer.ok) return form.fail(answer.error, errorTab(answer.error));
    if (isNew && answer.id) router.push(`/yonetim/urunler/${answer.id}`);
    else form.flashSaved();
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={() => void submit()}
      pending={actions.pending}
      savedText="Ürün kaydedildi."
      submitLabel={isNew ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "aciklama", label: "Açıklamalar" },
        { id: "gorseller", label: "Görseller", badge: draft.images.length },
        { id: "teknik", label: "Teknik Özellikler", badge: draft.specs.length },
        { id: "kutu", label: "Kutu İçeriği", badge: draft.inTheBox.length },
        { id: "secenekler", label: "Seçenekler", badge: draft.options?.variants.length ?? 0 },
        { id: "filtreler", label: "Filtreler", badge: Object.values(draft.filterValues ?? {}).filter((v) => v.length).length },
        { id: "seo", label: "SEO" },
      ]}
    >
      {form.tab === "temel" && <BasicsTab {...tabProps} isNew={isNew} />}
      {form.tab === "aciklama" && <DescriptionTab {...tabProps} />}
      {form.tab === "gorseller" && <ImagesTab {...tabProps} onError={form.setError} uploadNote={actions.uploadNote} />}
      {form.tab === "teknik" && <SpecsTab {...tabProps} />}
      {form.tab === "kutu" && <InTheBoxTab {...tabProps} />}
      {form.tab === "secenekler" && <OptionsTab {...tabProps} />}
      {form.tab === "filtreler" && <FiltersTab {...tabProps} />}
      {form.tab === "seo" && (
        <SeoPanel
          noun="Ürün"
          path="/urun"
          slug={draft.slug}
          onSlugChange={(v) => form.set("slug", v)}
          {...storedLinks("/urun", product && db.products.find((x) => x.id === product.id))}
          value={draft.seo}
          onChange={(seo) => form.set("seo", seo)}
          compute={(seo) => productSeo({ ...draft, seo })}
          descriptionFallback="ürünün kısa açıklaması"
        />
      )}
    </ContentFormShell>
  );
}

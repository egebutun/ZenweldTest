"use client";

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { findMovedProduct, findProductBySlug, listProducts, useDatabase } from "@zenweld/store";
import { Accordion, Tabs } from "@zenweld/ui";
import Link from "next/link";
import { OnlineRetailers } from "@/components/product/OnlineRetailers";
import {
  AddToCart,
  InTheBoxList,
  PriceBlock,
  ProductGallery,
  ProductHighlights,
  ProductMeta,
  SpecTable,
  SupportCta,
  TrustBadges,
  WhereToBuyButton,
} from "@/components/product/ProductDetailParts";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductSupportChat } from "@/components/support/ProductSupportChat";
import { VariantPicker } from "@/components/product/VariantPicker";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";
import { resolveVariant, type VariantSelection } from "@/lib/variants";
import { useT } from "@/lib/i18n-client";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { catalogTrail } from "@/lib/catalog";
import { productSeo } from "@/lib/seo";
import { useMovedRedirect, useSeoTitle } from "@/lib/page-seo-client";

export function ProductPageClient({ slug }: { slug: string }) {
  const t = useT();
  const db = useDatabase();
  const [tab, setTab] = useState("specs");
  const [selection, setSelection] = useState<VariantSelection>({});

  const product = useMemo(() => findProductBySlug(slug, db), [slug, db]);
  const moved = useMemo(() => (product ? undefined : findMovedProduct(slug, db)), [product, slug, db]);
  useMovedRedirect(moved, "/urun");
  useSeoTitle(
    product && productSeo(product, db.categories.find((c) => c.slug === product.categorySlug)).title,
  );

  const related = useMemo(() => {
    if (!product) return [];
    return listProducts(db)
      .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
      .slice(0, 4);
  }, [product, db]);

  if (!product) {
    if (moved) return null;
    notFound();
  }

  // Secilen secenek fiyati, urun kodunu ve teknik ozellikleri
  // degistirir. Alt bilesenlerin imzasini degistirmemek icin
  // secimi uygulanmis bir urun nesnesi turetiyoruz. priceExVat secenegin
  // NORMAL fiyatidir; kampanya indirimi gosterimde uygulanir.
  const variant = resolveVariant(product, selection);
  const shown: typeof product = {
    ...product,
    priceExVat: variant.priceExVat,
    specs: variant.specs,
    sku: variant.sku,
  };

  const tabs = [
    { id: "specs", label: t.product.specs },
    { id: "description", label: t.product.description },
    ...(product.inTheBox.length > 0 ? [{ id: "box", label: t.product.inTheBox }] : []),
    { id: "warranty", label: t.product.warranty },
    { id: "faq", label: t.product.faqShort },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container py-3">
          <Breadcrumbs
            trail={catalogTrail(
              product.section,
              { categorySlug: product.categorySlug },
              { categories: db.categories, groups: db.categoryGroups },
            )}
            current={product.name}
          />
        </div>
      </div>

      <div className="zw-container py-6 lg:py-10">
        {/* Masaustunde: solda fotograf ve altinda sekmeler, sagda urun bilgisi.
            Telefonda sira: fotograf, urun bilgisi, sekmeler. Ikinci satir (1fr)
            sag kolon uzun oldugunda fotografin altinda bosluk kalmasini onler. */}
        <div className="grid gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8">
          <div className="lg:col-start-1 lg:row-start-1">
            <ProductGallery product={product} />
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            {/* Urun adi ozel isim: CSS uppercase Turkce yerelde i -> İ cevirir */}
            <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zw-grey-600 sm:text-base">
              {product.shortDescription}
            </p>

            <div className="mt-4">
              <ProductMeta product={shown} />
            </div>

            <VariantPicker
              product={product}
              selection={selection}
              onChange={(groupId, optionId) =>
                setSelection((sel) => ({ ...sel, [groupId]: optionId }))
              }
            />

            <PriceBlock product={shown} />
            <ProductHighlights product={product} />

            <div className="mt-6 space-y-3">
              <AddToCart product={product} selection={selection} />
              <WhereToBuyButton product={shown} variantId={variant.variantId} />
            </div>

            <OnlineRetailers product={shown} />
            <TrustBadges />
            <SupportCta />
          </div>

          {/* Sekmeler: Teknik Ozellikler, Aciklama, Kutu Icerigi, Garanti, SSS */}
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <Tabs tabs={tabs} active={tab} onChange={setTab} size="sm" />
          <div className="py-6">
            {tab === "specs" && <SpecTable product={shown} />}

            {tab === "box" && <InTheBoxList product={product} />}

            {tab === "description" && (
              <div className="space-y-4 text-sm leading-relaxed text-zw-grey-700">
                <p>{product.description}</p>
                {product.manualUrl && (
                  <a
                    href={product.manualUrl}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    <FileText size={16} />
                    {t.product.manual} (PDF)
                  </a>
                )}
              </div>
            )}

            {tab === "warranty" && (
              <div className="space-y-4 text-sm leading-relaxed text-zw-grey-700">
                <p>
                  <strong>
                    {t.product.warrantyMonths.replace(
                      "{months}",
                      String(product.warrantyMonths),
                    )}
                  </strong>
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                  nostrud exercitation ullamco laboris.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/garanti/kayit"
                    className="text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    {t.explore.registerWarranty} →
                  </Link>
                  <Link
                    href="/garanti/sorgulama"
                    className="text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    {t.explore.checkWarranty} →
                  </Link>
                </div>
              </div>
            )}

            {tab === "faq" && (
              <div>
                <Accordion
                  // Tum sorular gosteriliyor; onceden ilk 6 ile sinirliydi.
                  items={db.faqs.map((f) => ({
                    id: f.id,
                    title: f.question,
                    content: f.answer,
                  }))}
                />
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="mt-12">
          <ProductReviewsSection product={product} />
        </div>

        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-6 font-display text-3xl font-bold uppercase">
              {t.product.related}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Destek sohbeti yalnizca urun sayfalarinda gosteriliyor. */}
      <ProductSupportChat product={shown} />
    </>
  );
}

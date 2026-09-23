"use client";

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { findProductBySlug, useDatabase } from "@zenweld/store";
import { Accordion, Tabs } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { OnlineRetailers } from "@/components/product/OnlineRetailers";
import {
  AddToQuoteButton,
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
import { useLocale, useT, useText } from "@/lib/i18n-client";

export function ProductPageClient({ slug }: { slug: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();
  const [tab, setTab] = useState("specs");

  const product = useMemo(() => findProductBySlug(slug, db), [slug, db]);

  const related = useMemo(() => {
    if (!product) return [];
    return db.products
      .filter((p) => p.active && p.id !== product.id && p.categorySlug === product.categorySlug)
      .slice(0, 4);
  }, [product, db]);

  const category = useMemo(
    () => db.categories.find((c) => c.slug === product?.categorySlug),
    [product, db],
  );

  if (!product) notFound();

  const tabs = [
    { id: "specs", label: t.product.specs },
    { id: "description", label: t.product.description },
    { id: "warranty", label: t.product.warranty },
    { id: "faq", label: t.product.faq },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container flex items-center gap-1.5 overflow-x-auto py-3 text-xs text-zw-grey-500">
          <LocaleLink href="/" className="shrink-0 hover:text-zw-ink">
            {t.common.brand}
          </LocaleLink>
          <ChevronRight size={13} className="shrink-0" />
          <LocaleLink href={`/${product.section}`} className="shrink-0 capitalize hover:text-zw-ink">
            {product.section.replace("-", " ")}
          </LocaleLink>
          {category && (
            <>
              <ChevronRight size={13} className="shrink-0" />
              <LocaleLink
                href={`/${product.section}/${category.slug}`}
                className="shrink-0 hover:text-zw-ink"
              >
                {category.name[locale]}
              </LocaleLink>
            </>
          )}
          <ChevronRight size={13} className="shrink-0" />
          <span className="shrink-0 font-semibold text-zw-ink">{product.name}</span>
        </div>
      </div>

      <div className="zw-container py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery product={product} />

          <div>
            {/* Urun adi ozel isim: CSS uppercase Turkce yerelde i -> İ cevirir */}
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-zw-grey-600">{text(product.shortDescription)}</p>

            <div className="mt-4">
              <ProductMeta product={product} />
            </div>

            <PriceBlock product={product} />
            <ProductHighlights product={product} />
            <InTheBoxList product={product} />

            <div className="mt-8">
              <WhereToBuyButton product={product} />
              <AddToQuoteButton product={product} />
            </div>

            <OnlineRetailers product={product} />
            <TrustBadges />
            <SupportCta />
          </div>
        </div>

        {/* Sekmeler */}
        <div className="mt-14">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
          <div className="py-8">
            {tab === "specs" && <SpecTable product={product} />}

            {tab === "description" && (
              <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-zw-grey-700">
                <p>{text(product.description)}</p>
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
              <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-zw-grey-700">
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
                  <LocaleLink
                    href="/kesfet/garanti-kayit"
                    className="text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    {t.explore.registerWarranty} →
                  </LocaleLink>
                  <LocaleLink
                    href="/kesfet/garanti-sorgula"
                    className="text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    {t.explore.checkWarranty} →
                  </LocaleLink>
                </div>
              </div>
            )}

            {tab === "faq" && (
              <div className="max-w-3xl">
                <Accordion
                  items={db.faqs.slice(0, 6).map((f) => ({
                    id: f.id,
                    title: text(f.question),
                    content: text(f.answer),
                  }))}
                />
              </div>
            )}
          </div>
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
    </>
  );
}

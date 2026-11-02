"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { byProductOrder, isQuotable, productOptionsView, type Product } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Button, ProductImage } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { resolveVariant } from "@/lib/variants";
import { VariantPicker } from "@/components/product/VariantPicker";

/**
 * TEKLIF AL URUN LISTESI (Teklif Al'in 2. adimi). Ana sayfadaki "Ürün
 * Seçici" testiyle (/urun-secici) ilgisi yoktur.
 *
 * Ekipmanlar'in gruplari (Lazer Makineleri, Kaynak Makineleri) sekme, alt
 * kategorileri cip olarak gorunur; secili alt kategorinin modelleri
 * fotografli kutucuklardir. Model secilince altinda secim paneli acilir:
 * seceneklerin (Soğutma, Torç Uzunluğu ...) dugmeleri urun sayfasindakiyle
 * aynidir; secime gore fotograf ve urun kodu degisir. Listede yalnizca
 * teklife acik urunler (isQuotable) vardir.
 */
export function QuoteProductPicker({
  onAdd,
  inList,
}: {
  onAdd: (product: Product, variantId: string | undefined, quantity: number) => void;
  /** Bu urunun herhangi bir secenegi listede mi (kutucuktaki "Listede" isareti) */
  inList: (productId: string) => boolean;
}) {
  const t = useT();
  const db = useDatabase();

  // Grup › alt kategori › model agaci; urunu olmayan kategori ve grup gorunmez.
  const tree = useMemo(() => {
    const products = db.products.filter(isQuotable);
    return db.categoryGroups
      .filter((g) => g.section === "ekipmanlar")
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        group,
        categories: db.categories
          .filter((c) => c.section === "ekipmanlar" && c.group === group.slug)
          .sort((a, b) => a.order - b.order)
          .map((category) => ({
            category,
            products: products.filter((p) => p.categorySlug === category.slug).sort(byProductOrder),
          }))
          .filter((c) => c.products.length > 0),
      }))
      .filter((g) => g.categories.length > 0);
  }, [db]);

  const [groupSlug, setGroupSlug] = useState<string>();
  const [categorySlug, setCategorySlug] = useState<string>();
  const [productId, setProductId] = useState<string>();
  const [variantId, setVariantId] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const group = tree.find((g) => g.group.slug === groupSlug) ?? tree[0];
  const category = group?.categories.find((c) => c.category.slug === categorySlug) ?? group?.categories[0];
  const product = category?.products.find((p) => p.id === productId);
  const view = product ? productOptionsView(product, db.optionDefinitions) : undefined;
  const selection = product ? resolveVariant(product, view, variantId) : undefined;
  const image = selection?.image ?? product?.images[0]?.url;

  // Model secilince panel ekrana kaydirilir (telefonda kutucuklarin altinda kalir).
  useEffect(() => {
    if (productId) panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [productId]);

  const chooseProduct = (id: string | undefined) => {
    setProductId(id);
    setVariantId(undefined);
    setQuantity(1);
    setAdded(false);
  };

  if (!group || !category) return null;

  return (
    <div className="space-y-4">
      {/* Gruplar */}
      <div role="tablist" className="grid grid-cols-2 gap-2">
        {tree.map(({ group: g, categories }) => {
          const active = g.slug === group.group.slug;
          const count = categories.reduce((n, c) => n + c.products.length, 0);
          return (
            <button
              key={g.slug}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setGroupSlug(g.slug);
                setCategorySlug(undefined);
                chooseProduct(undefined);
              }}
              className={`rounded-[4px] border-2 px-4 py-3 text-left transition-colors ${
                active ? "border-zw-red-600 bg-zw-red-50" : "border-zw-grey-200 hover:border-zw-grey-400"
              }`}
            >
              <div className="font-display text-lg font-bold uppercase leading-tight">{g.name}</div>
              <div className="mt-0.5 text-xs text-zw-grey-500">{t.quote.models.replace("{n}", String(count))}</div>
            </button>
          );
        })}
      </div>

      {/* Alt kategoriler: telefonda yana kayar */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {group.categories.map(({ category: c, products }) => {
          const active = c.slug === category.category.slug;
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCategorySlug(c.slug);
                chooseProduct(undefined);
              }}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-zw-ink bg-zw-ink text-white"
                  : "border-zw-grey-300 text-zw-grey-700 hover:border-zw-grey-500"
              }`}
            >
              {c.name} <span className={active ? "text-white/60" : "text-zw-grey-400"}>{products.length}</span>
            </button>
          );
        })}
      </div>

      {/* Modeller */}
      <div className="grid gap-2 sm:grid-cols-2">
        {category.products.map((p) => {
          const selected = p.id === product?.id;
          const hasOptions = Boolean(p.options?.variants.length);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={selected}
              onClick={() => chooseProduct(selected ? undefined : p.id)}
              className={`flex items-center gap-3 rounded-[4px] border-2 bg-white p-2 pr-3 text-left transition-colors ${
                selected ? "border-zw-red-600 bg-zw-red-50" : "border-zw-grey-200 hover:border-zw-grey-400"
              }`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[3px] bg-zw-grey-50">
                <ProductImage
                  src={p.images[0]?.url}
                  alt={p.images[0]?.alt || p.name}
                  label={p.name}
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-zw-grey-500">
                  {hasOptions ? t.quote.withOptions : p.sku}
                  {inList(p.id) && (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700">
                      <Check size={12} /> {t.quote.inList}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Secilen model: secenekler, fotograf, adet */}
      {product && selection && (
        <div
          ref={panel}
          role="region"
          aria-label={t.quote.selectedModel}
          className="scroll-mt-24 rounded-[4px] border-2 border-zw-red-600 bg-white p-4 sm:p-5"
        >
          <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
            <div className="aspect-square overflow-hidden rounded-[4px] bg-zw-grey-50">
              <ProductImage
                key={image}
                src={image}
                alt={product.name}
                label={product.name}
                className="h-full w-full object-contain p-3"
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                {category.category.name}
              </div>
              <h3 className="mt-1 font-display text-xl font-bold uppercase leading-tight">{product.name}</h3>
              <div className="mt-1 text-sm text-zw-grey-500">
                {t.quote.productCode}: <span className="font-semibold text-zw-ink">{selection.sku}</span>
              </div>

              <VariantPicker
                view={view}
                active={selection.variant}
                onChange={(id) => {
                  setVariantId(id);
                  setAdded(false);
                }}
              />

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-[4px] border border-zw-grey-300">
                  <button
                    type="button"
                    aria-label="Azalt"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-zw-grey-600 hover:text-zw-ink"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    aria-label={t.quote.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-12 border-x border-zw-grey-300 py-2 text-center font-semibold"
                  />
                  <button
                    type="button"
                    aria-label="Artır"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-2.5 text-zw-grey-600 hover:text-zw-ink"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <Button
                  leftIcon={<Plus size={16} />}
                  onClick={() => {
                    onAdd(product, selection.variantId, quantity);
                    setAdded(true);
                  }}
                >
                  {t.quote.addToList}
                </Button>
              </div>
              {added && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                  <Check size={16} /> {t.quote.added}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

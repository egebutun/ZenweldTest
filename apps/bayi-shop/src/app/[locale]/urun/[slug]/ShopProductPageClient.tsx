"use client";

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { Check, ChevronRight, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { findProductBySlug, getRetailerStock, stockForRetailer, useDatabase } from "@zenweld/store";
import { Badge, Button, Tabs } from "@zenweld/ui";
import { LocaleLink } from "@/components/LocaleLink";
import { ProductImage } from "@/components/ProductImage";
import { ShopProductCard } from "@/components/ShopProductCard";
import { useLocale, useT, useText } from "@/lib/i18n-client";
import { formatPrice, priceWithVat } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { STORE } from "@/lib/store-config";

export function ShopProductPageClient({ slug }: { slug: string }) {
  const t = useT();
  const locale = useLocale();
  const text = useText();
  const db = useDatabase();
  const cart = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("specs");

  const product = useMemo(() => findProductBySlug(slug, db), [slug, db]);
  const stock = product ? getRetailerStock(product.id, STORE.retailerId, db) : undefined;

  const related = useMemo(() => {
    if (!product) return [];
    const stockMap = new Map(stockForRetailer(STORE.retailerId, db).map((s) => [s.productId, s]));
    return db.products
      .filter(
        (p) =>
          p.active &&
          p.id !== product.id &&
          p.categorySlug === product.categorySlug &&
          stockMap.get(p.id)?.inStock,
      )
      .slice(0, 4)
      .map((p) => ({ product: p, stock: stockMap.get(p.id) }));
  }, [product, db]);

  if (!product) notFound();

  const price = stock?.price ?? priceWithVat(product.priceExVat, product.vatRate);
  const available = stock?.inStock ?? false;
  const images = product.images.length > 0 ? product.images : [{ url: "", alt: { tr: product.name, en: product.name } }];

  return (
    <>
      <div className="border-b border-zw-grey-200 bg-zw-grey-50">
        <div className="zw-container flex items-center gap-1.5 overflow-x-auto py-3 text-xs text-zw-grey-500">
          <LocaleLink href="/" className="shrink-0 hover:text-zw-ink">
            {STORE.name}
          </LocaleLink>
          <ChevronRight size={13} />
          <LocaleLink href="/magaza" className="shrink-0 hover:text-zw-ink">
            Tüm Ürünler
          </LocaleLink>
          <ChevronRight size={13} />
          <span className="shrink-0 font-semibold text-zw-ink">{product.name}</span>
        </div>
      </div>

      <div className="zw-container py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="grid gap-3">
            <div className="aspect-square overflow-hidden rounded-[4px] bg-zw-grey-50">
              <ProductImage
                src={images[activeImage]?.url}
                alt={text(images[activeImage]?.alt) || product.name}
                label={product.name}
                priority
                className="h-full w-full object-contain p-6"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square overflow-hidden rounded-[4px] border-2 bg-zw-grey-50 ${
                      i === activeImage ? "border-zw-red-600" : "border-transparent"
                    }`}
                  >
                    <ProductImage
                      src={img.url}
                      alt={text(img.alt)}
                      label={product.name}
                      className="h-full w-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {/* Urun adi ozel isim: CSS uppercase Turkce yerelde i -> İ cevirir */}
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-zw-grey-600">{text(product.shortDescription)}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone={available ? "green" : "outline"}>
                {available ? t.product.inStock : t.product.outOfStock}
              </Badge>
              {stock?.quantity != null && available && (
                <Badge tone="grey">{stock.quantity} adet</Badge>
              )}
              <Badge tone="grey">
                <ShieldCheck size={11} />
                {t.product.warrantyMonths.replace("{months}", String(product.warrantyMonths))}
              </Badge>
              <span className="text-xs text-zw-grey-500">
                {t.product.sku}: <strong>{product.sku}</strong>
              </span>
            </div>

            <div className="mt-6 border-y border-zw-grey-200 py-5">
              <div className="font-display text-4xl font-bold">{formatPrice(price, locale)}</div>
              <div className="mt-1 text-sm text-zw-grey-500">{t.product.priceIncVat}</div>
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                <Truck size={17} />
                {formatPrice(STORE.freeShippingOver, locale)} ve üzeri kargo ücretsiz
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex h-14 items-center rounded-[4px] border border-zw-grey-300">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-zw-grey-600 hover:text-zw-ink"
                  aria-label="Azalt"
                >
                  <Minus size={17} />
                </button>
                <span className="w-10 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-3 text-zw-grey-600 hover:text-zw-ink"
                  aria-label="Artır"
                >
                  <Plus size={17} />
                </button>
              </div>

              <Button
                size="lg"
                className="flex-1"
                disabled={!available}
                leftIcon={added ? <Check size={20} /> : <ShoppingCart size={20} />}
                onClick={() => {
                  cart.add(
                    {
                      productId: product.id,
                      name: product.name,
                      slug: product.slug,
                      image: product.images[0]?.url,
                      unitPrice: price,
                    },
                    quantity,
                  );
                  setAdded(true);
                  setTimeout(() => setAdded(false), 2000);
                }}
              >
                {!available ? t.product.outOfStock : added ? t.shop.addedToCart : t.shop.addToCart}
              </Button>
            </div>

            {added && (
              <LocaleLink
                href="/sepet"
                className="mt-3 block text-center text-sm font-semibold text-zw-red-600 hover:underline"
              >
                Sepete git →
              </LocaleLink>
            )}

            {product.inTheBox.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-2 text-sm font-semibold">{t.product.inTheBox}</h2>
                <ul className="space-y-1.5 text-sm text-zw-grey-700">
                  {product.inTheBox.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zw-grey-400" />
                      {text(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-14">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: "specs", label: t.product.specs },
              { id: "description", label: t.product.description },
              { id: "shipping", label: "Kargo & İade" },
            ]}
          />
          <div className="py-8">
            {tab === "specs" && (
              <table className="w-full max-w-3xl text-sm">
                <tbody>
                  {product.specs.map((row, i) => (
                    <tr key={i} className="border-b border-zw-grey-200 last:border-0">
                      <th className="w-2/5 py-3 pr-4 text-left font-semibold text-zw-grey-700">
                        {text(row.label)}
                      </th>
                      <td className="py-3 text-zw-grey-600">{text(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "description" && (
              <p className="max-w-3xl text-sm leading-relaxed text-zw-grey-700">
                {text(product.description)}
              </p>
            )}
            {tab === "shipping" && (
              <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-zw-grey-700">
                <p>
                  {formatPrice(STORE.freeShippingOver, locale)} ve üzeri siparişlerde kargo
                  ücretsizdir. Altındaki siparişlerde{" "}
                  {formatPrice(STORE.shippingFee, locale)} kargo bedeli uygulanır.
                </p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
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
              {related.map(({ product: p, stock: s }) => (
                <ShopProductCard key={p.id} product={p} stock={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingCart } from "lucide-react";
import { productOptionsView, type Product } from "@zenweld/data";
import { isProductInStock, useDatabase } from "@zenweld/store";
import { Button, Modal, ProductImage } from "@zenweld/ui";
import { PriceBlock, QuantityStepper } from "@/components/product/ProductDetailParts";
import { VariantPicker } from "@/components/product/VariantPicker";
import { useCart } from "@/lib/cart";
import { useT } from "@/lib/i18n-client";
import { resolveVariant } from "@/lib/variants";

/**
 * HIZLI SECIM PENCERESI (KARARLAR K-126)
 *
 * Secenekli urunun kartinda "Sepete Ekle"ye basilinca acilir; ziyaretci
 * urun sayfasina gitmeden secenegi ve adedi secip sepete ekler. Kurallar
 * urun sayfasiyla aynidir: ilk kombinasyon secili gelir, satilmayan deger
 * soluk gorunur (VariantPicker); fotograf, urun kodu ve fiyat secime gore
 * degisir; secilen kombinasyon depoda yoksa eklenmez (K-82). Adet karttan
 * gelir, burada degistirilebilir (1-99).
 *
 * "Sepete Ekle" secilen kombinasyonu ve adedi sepete ekler, pencere kapanir
 * (onAdded). Pencere sayfanin en ustune acilir (createPortal): kart kayan
 * seritte ya da tabloda olsa da ekranin ortasinda durur.
 */
export function QuickAddPanel({
  product,
  quantity: initialQuantity,
  onClose,
  onAdded,
}: {
  product: Product;
  /** Kartta secilen adet */
  quantity: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const t = useT();
  const db = useDatabase();
  const cart = useCart();
  const view = useMemo(() => productOptionsView(product, db.optionDefinitions), [product, db.optionDefinitions]);
  const [variantId, setVariantId] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(initialQuantity);

  const variant = resolveVariant(product, view, variantId);
  const shown: Product = { ...product, priceExVat: variant.priceExVat, sku: variant.sku };
  const inStock = isProductInStock(product, variant.variantId, db);
  const image = variant.image ?? product.images[0]?.url;

  return createPortal(
    <Modal open onClose={onClose} title={t.cart.quickAdd} size="md">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[4px] bg-zw-grey-50 sm:h-28 sm:w-28">
          <ProductImage src={image} alt="" label={product.name} className="h-full w-full object-contain p-1.5" />
        </div>
        <div className="min-w-0">
          {/* Urun adi ozel isim: buyuk harfe cevrilmez (Turkce i -> İ) */}
          <p className="font-display text-lg font-semibold leading-tight text-zw-ink">{product.name}</p>
          <p className="mt-1 text-xs text-zw-grey-500">
            {t.product.sku}: <strong className="text-zw-grey-700">{variant.sku}</strong>
          </p>
        </div>
      </div>

      <VariantPicker view={view} active={variant.variant} onChange={setVariantId} />
      <PriceBlock product={shown} />

      <div className="mt-5 flex gap-2 sm:gap-3">
        {inStock ? (
          <>
            <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
            <Button
              size="lg"
              fullWidth
              className="max-sm:px-3 max-sm:text-sm"
              leftIcon={<ShoppingCart size={20} className="max-[389px]:hidden" />}
              onClick={() => {
                cart.add(product.id, variant.variantId, quantity);
                onAdded();
              }}
            >
              {t.cart.addToCart}
            </Button>
          </>
        ) : (
          <Button size="lg" fullWidth disabled>
            {t.product.outOfStock}
          </Button>
        )}
      </div>
    </Modal>,
    document.body,
  );
}

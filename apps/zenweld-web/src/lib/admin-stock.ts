"use client";

import type { StockRow, StockSettings } from "@zenweld/data";
import { deleteStockLevel, saveStockSettings, setStockLevel, type StockSource } from "@zenweld/store";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/** Satirin anahtari: kaynak, urun ve secenek. label: gecmiste gorunecek urun adi. */
export interface StockTarget {
  source: StockSource;
  productId: string;
  variantId?: string;
  label: string;
  /** Islemi yapan yoneticinin adi (demo modunda gecmise yazilir; veritabaninda sunucu yazar). */
  by?: string;
}

type Patch = Partial<Pick<StockRow, "quantity" | "price" | "url">>;

/**
 * PANEL › STOK MATRISI ISLEMLERI: elle duzeltme, satir ekleme ve silme,
 * "kac gunden eski stok gosterilmez" ayari.
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/stok; Asama 5,
 * 4. alan, KARARLAR K-99, K-103; ortak akis lib/admin-panel.ts). Demo
 * modunda tarayicidaki veriye yazilir (packages/store › repo/stock.ts).
 * Dosya yukleme, kod eslestirme ve geri alma veritabani modunda adim 4.3'te
 * gelir.
 */
export function useStockActions() {
  const { server, pending, call } = usePanelCall("stok");
  const kind = (t: StockTarget) => `${t.source.type}_stock`;
  const key = (t: StockTarget) => `${t.source.id}/${t.productId}|${t.variantId ?? ""}`;
  const body = (t: StockTarget) => ({
    sourceType: t.source.type,
    sourceId: t.source.id,
    productId: t.productId,
    variantId: t.variantId ?? "",
    label: t.label,
  });

  return {
    server,
    pending,

    /** Satiri duzeltir; satir yoksa (stored yok) ekler. Bos fiyat/link: undefined ile silinir. */
    setStockLevel: (t: StockTarget, patch: Patch, stored?: StockRow): Promise<PanelAnswer> => {
      if (server) {
        const sent = {
          ...(patch.quantity !== undefined && { quantity: patch.quantity }),
          ...("price" in patch && { price: patch.price ?? null }),
          ...("url" in patch && { url: patch.url ?? null }),
        };
        const ref = stored ? recordRef(kind(t), { id: key(t), updatedAt: stored.updatedAt }) : undefined;
        return call("satir", { ...body(t), patch: sent, ...(ref && { updatedAt: ref.updatedAt }), id: key(t) }, kind(t));
      }
      setStockLevel({ sourceType: t.source.type, sourceId: t.source.id, productId: t.productId, variantId: t.variantId, patch, by: t.by, label: t.label });
      return localAnswer();
    },
    deleteStockLevel: (t: StockTarget, stored: StockRow): Promise<PanelAnswer> => {
      if (server) {
        const ref = recordRef(kind(t), { id: key(t), updatedAt: stored.updatedAt });
        return call("satir-sil", { ...body(t), updatedAt: ref.updatedAt });
      }
      deleteStockLevel({ sourceType: t.source.type, sourceId: t.source.id, productId: t.productId, variantId: t.variantId, by: t.by, label: t.label });
      return localAnswer();
    },
    saveStockSettings: (staleDays: number, stored: StockSettings): Promise<PanelAnswer> => {
      if (server) {
        const ref = recordRef("settings", { id: "stock", updatedAt: stored.updatedAt });
        return call("ayar", { staleDays, ...(ref.updatedAt && { updatedAt: ref.updatedAt }), id: "stock" }, "settings");
      }
      saveStockSettings({ staleDays });
      return localAnswer();
    },
  };
}

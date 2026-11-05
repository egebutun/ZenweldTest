"use client";

import type { MatchedStockFile, StockImport, StockImportSummary, StockRow, StockSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  applyStockImport,
  deleteStockLevel,
  revertStockImport,
  saveSkuAlias,
  saveStockSettings,
  setStockLevel,
  type StockSource,
} from "@zenweld/store";
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
 * "kac gunden eski stok gosterilmez" ayari, dosya yukleme, kod eslestirme
 * ve son yuklemenin geri alinmasi.
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/stok; Asama 5,
 * 4. alan, KARARLAR K-99, K-103; ortak akis lib/admin-panel.ts). Demo
 * modunda tarayicidaki veriye yazilir (packages/store › repo/stock.ts).
 * Dosyayi her iki modda tarayici okur ve onizler; veritabani modunda okunan
 * tablo sunucuya gider, sunucu yeniden eslestirip uygular.
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

    /**
     * Dosyayi uygular. table: dosyadan okunan tablo (sunucuya gider); file:
     * onizlemedeki eslesmis hali (demo modunda uygulanir); version: onizlemenin
     * dayandigi stok (packages/data › stockVersion).
     */
    applyStockImport: (args: {
      source: StockSource;
      fileName: string;
      table: unknown[][];
      file: MatchedStockFile;
      version: string;
      confirmTruncated: boolean;
      by?: string;
    }): Promise<PanelAnswer & { summary?: StockImportSummary }> => {
      if (server) {
        return call("dosya", {
          sourceType: args.source.type,
          sourceId: args.source.id,
          fileName: args.fileName,
          table: args.table,
          version: args.version,
          confirmTruncated: args.confirmTruncated,
        });
      }
      const record = applyStockImport({ sourceType: args.source.type, sourceId: args.source.id, fileName: args.fileName, file: args.file, by: args.by });
      return Promise.resolve(
        record ? { ok: true, summary: record.summary } : { ok: false, error: "Stok güncellenemedi: tarayıcı deposu dolu. Değişiklik uygulanmadı." },
      );
    },
    revertStockImport: (record: StockImport, by?: string): Promise<PanelAnswer> =>
      server ? call("geri-al", { id: record.id }) : Promise.resolve(revertStockImport(record.id, by) ? { ok: true } : { ok: false, error: tr.panel.failed }),
    /** Bayinin kendi kodunu bizim urunumuze baglar; sonraki dosyalarda kendiliginden taninir. */
    saveSkuAlias: (source: StockSource, code: string, { productId, variantId }: { productId: string; variantId?: string }): Promise<PanelAnswer> => {
      if (server) return call("eslestir", { sourceType: source.type, sourceId: source.id, code, productId, variantId: variantId ?? "" });
      saveSkuAlias({ sourceId: source.id, code, productId, variantId });
      return localAnswer();
    },
  };
}

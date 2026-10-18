"use client";

import type { Product } from "@zenweld/data";
import { getSnapshot } from "./database";
import { setRetailerStocks } from "./repo";

/** Secili tabloyu CSV olarak indirir. */
export function downloadCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ].join("\n");
  triggerDownload(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface CsvStockRow {
  sku: string;
  inStock: boolean;
  quantity?: number;
  price?: number;
  matchedProduct?: Product;
}

/**
 * Bayiden gelen stok CSV'sini ayristirir.
 * Beklenen basliklar: sku;stok;adet;fiyat  (ayirac ; veya ,)
 */
export function parseStockCsv(text: string): CsvStockRow[] {
  const db = getSnapshot();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = lines[0].toLowerCase();
  const startIdx = /sku|stok|kod/.test(header) ? 1 : 0;

  return lines.slice(startIdx).map((line) => {
    const [sku = "", stok = "", adet = "", fiyat = ""] = line
      .split(delimiter)
      .map((c) => c.trim());
    const normalized = stok.toLowerCase();
    const inStock = ["1", "var", "evet", "true", "yes", "stokta"].includes(normalized);
    const matchedProduct = db.products.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase(),
    );
    return {
      sku,
      inStock,
      quantity: adet ? Number(adet.replace(",", ".")) : undefined,
      price: fiyat ? Number(fiyat.replace(/\./g, "").replace(",", ".")) : undefined,
      matchedProduct,
    };
  });
}

/** Ayristirilmis CSV satirlarini bir saticinin stogu olarak uygular. */
export function applyStockCsv(retailerId: string, rows: CsvStockRow[]): number {
  const updates = rows.flatMap((row) =>
    row.matchedProduct
      ? [
          {
            productId: row.matchedProduct.id,
            patch: { inStock: row.inStock, quantity: row.quantity, price: row.price },
          },
        ]
      : [],
  );
  setRetailerStocks(retailerId, updates);
  return updates.length;
}

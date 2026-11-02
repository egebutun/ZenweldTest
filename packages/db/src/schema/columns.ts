import { sql, type SQL } from "drizzle-orm";
import { numeric, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Tablolarda ortak kolon turleri ve kurallar (docs/VERITABANI.md › Genel
 * kurallar).
 */

/** Saat dilimli zaman (timestamptz). */
export const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/** TRY tutari: numeric(12,2); kurus kaymasi olmaz. */
export const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });

/** Oran (%): numeric(5,2). */
export const percent = (name: string) => numeric(name, { precision: 5, scale: 2, mode: "number" });

/** Olusturulma ve son degisiklik zamani. */
export const timestamps = () => ({
  createdAt: tstz("created_at").notNull().defaultNow(),
  updatedAt: tstz("updated_at").notNull().defaultNow(),
});

/** CHECK icin sabit deger listesi: kolon IN ('a', 'b'). */
export function oneOf(column: AnyPgColumn, values: readonly string[]): SQL {
  return sql`${column} IN (${sql.raw(values.map(quote).join(", "))})`;
}

/** CHECK icin dizi kolonu: her eleman listede olmali. */
export function subsetOf(column: AnyPgColumn, values: readonly string[]): SQL {
  return sql`${column} <@ ARRAY[${sql.raw(values.map(quote).join(", "))}]::text[]`;
}

/** Turkce buyuk/kucuk harf duyarsiz karsilastirma icin anahtar (I/ı, İ/i). */
export function trKey(column: AnyPgColumn): SQL {
  return sql`lower(${column} COLLATE "tr-x-icu")`;
}

function quote(value: string): string {
  if (!/^[a-z0-9_+-]+$/.test(value)) throw new Error(`Gecersiz sabit deger: ${value}`);
  return `'${value}'`;
}

/* Sabit deger listeleri (packages/data/src/types.ts ile ayni) */

export const SECTIONS = ["ekipmanlar", "guvenlik", "aksesuarlar", "dolgu-metalleri"] as const;
export const DOCUMENT_SECTIONS = ["msds", "kaynak-rehberi", "parti-sertifikalari"] as const;

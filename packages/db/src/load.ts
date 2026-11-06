import { getTableColumns, getTableName, sql, type SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn, type PgDatabase, type PgQueryResultHKT, type PgTable } from "drizzle-orm/pg-core";
import type { ZenweldDatabase } from "@zenweld/data";
import * as s from "./schema";
import { seedTables } from "./seed";

/**
 * VERI YUKLEME (npm run db:yukle; KARARLAR K-90, K-91; docs/SUNUCU.md › 5)
 *
 * Sitenin bugunku verisini (packages/data) canli ya da deneme veritabanina
 * yukler. db:seed'den farki:
 * - Satis hareketleri hic yuklenmez: demo hesaplar ve ornek uyeler, adresler,
 *   teklifler, siparisler, iadeler, kupon kullanimlari, servis talepleri,
 *   garantiler, kayit numarasi sayaclari.
 * - Ornek yorumlar, kuponlar ve bayi/satici stok listeleri yalnizca deneme
 *   veritabanina yuklenir.
 * - Tekrar calistirilabilir: kayit kimligiyle eslesir; olmayan eklenir, farkli
 *   olan guncellenir ("tam") ya da hic dokunulmaz ("eksikler"). Hicbir kayit
 *   silinmez; veride olmayan kayit veritabaninda kalir.
 * - Stok (depo stogu, bayi/satici stoklari ve yuklemeleri, kod eslemeleri)
 *   her iki sekilde de yalnizca eksikse eklenir: depo stogunu SAP, bayi
 *   stogunu bayinin dosyasi gunceller; yukleme bunlarin uzerine yazmaz.
 */

export type LoadTarget = "canli" | "deneme";
export type LoadMode = "tam" | "eksikler";

export interface LoadResult {
  table: string;
  added: number;
  updated: number;
  unchanged: number;
}

/** Yuklenen veri: hedefe gore ayiklanmis bugunku veri (veritabanina dokunmaz). */
export function loadableData(data: ZenweldDatabase, target: LoadTarget): ZenweldDatabase {
  const withoutActivity: ZenweldDatabase = {
    ...data,
    users: [],
    addresses: [],
    quotes: [],
    orders: [],
    returnRequests: [],
    couponRedemptions: [],
    serviceRequests: [],
    warranties: [],
    recordCounters: {},
  };
  if (target === "deneme") return withoutActivity;
  return {
    ...withoutActivity,
    reviews: [],
    coupons: [],
    dealerStock: [],
    retailerStock: [],
    stockImports: [],
    skuAliases: [],
  };
}

/** Uzerine yazilmayan, yalnizca eksikse eklenen tablolar. */
const STOCK_TABLES = new Set<PgTable>([s.warehouseStock, s.dealerStock, s.retailerStock, s.stockImports, s.skuAliases]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hem baglanti hem islem (transaction) kabul edilir
type Database = PgDatabase<PgQueryResultHKT, any>;

/** Bir seferde yazilan satir (PostgreSQL'in parametre sinirinin altinda kalir). */
const BATCH = 500;

const excluded = (column: PgColumn): SQL => sql.raw(`excluded."${column.name}"`);

function primaryKey(table: PgTable): PgColumn[] {
  const config = getTableConfig(table);
  return config.primaryKeys[0]?.columns ?? config.columns.filter((c) => c.primary);
}

async function write(db: Database, table: PgTable, rows: Record<string, unknown>[], onlyMissing: boolean): Promise<LoadResult> {
  const columns = getTableColumns(table) as Record<string, PgColumn>;
  const key = primaryKey(table);
  const keyNames = new Set(key.map((c) => c.name));
  const given = [...new Set(rows.flatMap((r) => Object.keys(r)))].map((name) => [name, columns[name]] as const);
  const keyGiven = key.every((k) => given.some(([, c]) => c.name === k.name));
  const updatable = given.filter(([, c]) => !keyNames.has(c.name));
  // Veride olmayan "son degisiklik" kolonu: satir degisince simdiki zaman yazilir.
  const touch = columns.updatedAt && !given.some(([name]) => name === "updatedAt") ? { updatedAt: sql`now()` } : {};

  let added = 0;
  let updated = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const insert = db.insert(table).values(rows.slice(i, i + BATCH));
    if (onlyMissing || !keyGiven || updatable.length === 0) {
      // Kimligi ya da benzersiz alani (kod, ad ...) var olan satir atlanir.
      added += (await insert.onConflictDoNothing().returning({ one: sql<number>`1` })).length;
      continue;
    }
    const written = await insert
      .onConflictDoUpdate({
        target: key,
        set: { ...Object.fromEntries(updatable.map(([name, c]) => [name, excluded(c)])), ...touch },
        // Yalnizca farkli olan satir yazilir; ayni olan "degismeyen" sayilir.
        setWhere: sql.join(
          updatable.map(([, c]) => sql`${c} IS DISTINCT FROM ${excluded(c)}`),
          sql` OR `,
        ),
      })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });
    for (const row of written) {
      if (row.inserted) added++;
      else updated++;
    }
  }
  return { table: getTableName(table), added, updated, unchanged: rows.length - added - updated };
}

/**
 * Veriyi yazar; tablo basina eklenen, guncellenen ve degismeyen satir
 * sayisini dondurur. Islemi (transaction) cagiran yonetir: yarida kalan
 * yukleme geri alinsin.
 */
export async function loadData(
  db: Database,
  data: ZenweldDatabase,
  options: { target: LoadTarget; mode: LoadMode },
): Promise<LoadResult[]> {
  const source = loadableData(data, options.target);
  const results: LoadResult[] = [];
  for (const { table, rows } of seedTables(source)) {
    if (rows.length === 0) continue;
    const onlyMissing = options.mode === "eksikler" || STOCK_TABLES.has(table);
    results.push(await write(db, table, rows as Record<string, unknown>[], onlyMissing));
  }
  // Zenweld depo stogu: SAP okumasi sayilmaz (sap_sync_runs'a yazilmaz).
  const warehouse = source.warehouseStock.map((r) => ({
    sapItemCode: r.sapItemCode,
    itemName: r.itemName,
    quantity: r.quantity,
    syncedAt: new Date(r.syncedAt),
  }));
  if (warehouse.length > 0) results.push(await write(db, s.warehouseStock, warehouse, true));
  return results;
}

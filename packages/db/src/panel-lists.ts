import { count, or, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { searchFold } from "@zenweld/utils";
import type { ReadDb } from "./read";

/**
 * PANEL LISTELERI SUNUCUDA (veritabani modu)
 *
 * Uzun listeler (siparisler, iade talepleri …) sayfa sayfa okunur: sunucu
 * yalnizca istenen sayfanin kayitlarini (50) ve toplam sayiyi gonderir;
 * arama, suzgec ve siralama veritabaninda yapilir. Kurallar demo
 * modundakiyle aynidir (apps/zenweld-web › lib/admin-lists.ts; sayfa
 * hesabi @zenweld/utils › paging.ts).
 */

/** LIKE icin: % ve _ harfiyen aranir. */
const escapeLike = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Alanlardan biri aranan metni iceriyor mu. Iki taraf da ayni bicime
 * getirilir (@zenweld/utils › searchFold): kucuk harf ve I / İ / ı / i ayni
 * harf. translate ı'yi i yapar ve bazi yerel ayarlarda lower('İ')'nin
 * birakabildigi birlesik noktayi (U+0307) siler; boylece sonuc
 * veritabaninin yerel ayarina bagli kalmaz.
 */
export function searchLike(columns: SQLWrapper[], query?: string): SQL | undefined {
  const q = searchFold(query?.trim().slice(0, 100) ?? "");
  if (!q) return undefined;
  const pattern = `%${escapeLike(q)}%`;
  return or(...columns.map((c) => sql`translate(lower(${c}), ${"ı̇"}, 'i') like ${pattern}`));
}

/** Suzgece uyan kayit sayisi. */
export async function countRows(db: ReadDb, table: PgTable, where?: SQL): Promise<number> {
  const [row] = await db.select({ n: count() }).from(table).where(where);
  return row?.n ?? 0;
}

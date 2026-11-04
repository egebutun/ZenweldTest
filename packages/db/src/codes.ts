import { sql } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgTable } from "drizzle-orm/pg-core";
import type * as s from "./schema";

/**
 * Kayit numarasi: onek basina sayac (record_counters) bir artar. Sayac
 * yoksa ya da tablodaki en buyuk numaranin gerisindeyse (or. ornek veriyle
 * yuklenmis siparisler) o numaradan devam eder; numara hic tekrar etmez.
 */
export async function nextRecordCode(
  db: PgDatabase<NodePgQueryResultHKT, typeof s>,
  table: PgTable,
  prefix: string,
  digits: number,
): Promise<string> {
  const from = prefix.length + 1;
  const result = await db.execute<{ last_number: number }>(sql`
    INSERT INTO record_counters AS r (prefix, last_number)
    SELECT ${prefix}::text, coalesce(max(substring(code from ${from}::int)::int), 0) + 1
      FROM ${table}
     WHERE starts_with(code, ${prefix}::text) AND substring(code from ${from}::int) ~ '^[0-9]+$'
    ON CONFLICT (prefix) DO UPDATE SET last_number = greatest(r.last_number, excluded.last_number - 1) + 1
    RETURNING last_number`);
  return `${prefix}${String(result.rows[0].last_number).padStart(digits, "0")}`;
}

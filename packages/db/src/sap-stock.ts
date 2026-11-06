import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { diffWarehouseStock, looksLikePartialSapRead, readSapStock, type SapStockLine } from "@zenweld/data";
import * as s from "./schema";

/**
 * SAP DEPO STOGU OKUMA ISI (KARARLAR K-82, K-84; docs/SUNUCU.md › 11,
 * IS-KURALLARI › 20)
 *
 * Her calismada stok kaynagi bir kez okunur:
 * 1. Okuma sap_sync_runs'a "running" olarak yazilir.
 * 2. Kaynak okunur ve kurallara gore donusturulur (readSapStock). Okuma
 *    gecersizse ya da kaynaga ulasilamazsa okuma "failed" olur, hata metni
 *    kaydedilir ve warehouse_stock'a dokunulmaz: son iyi stok kalir.
 * 3. Gecerli okuma warehouse_stock'u tek islemde yeniler: okumada olmayan
 *    kalem silinir, olan eklenir ya da guncellenir. Ayni anda iki okuma
 *    calisirsa ikincisi uygulanmaz (veritabani kilidi). Stoktaki kalem
 *    sayisi oncekinin yarisinin altina duserse okuma yarim sayilir ve
 *    uygulanmaz (K-93); dogruysa force ile uygulanir.
 * 4. Okuma "success" olur; donen fark (eklenen, cikan, degisen kalem)
 *    sayfalarin yenilenip yenilenmeyecegini belirler.
 *
 * Kaynak bugun deneme dosyasidir (SAP_STOK_DOSYASI); SAP baglanti bilgileri
 * gelince SAP'tan okuyan kaynak eklenir, gerisi degismez.
 */

/** Stogun okundugu yer. */
export interface StockSource {
  read(): Promise<SapStockLine[]>;
}

export type StockSyncResult =
  | { status: "success"; runId: number; rowsRead: number; added: string[]; removed: string[]; changed: string[] }
  | { status: "failed"; runId: number; error: string };

type Database = NodePgDatabase<typeof s>;

/** Ayni anda tek okuma uygulansin diye veritabani kilidinin numarasi. */
const LOCK_KEY = 82084;
/** Bu sureden uzun "running" kalan okuma yarida kalmis sayilir (dakika). */
const ABANDONED_MINUTES = 30;
const BATCH = 500;

export async function syncWarehouseStock(
  db: Database,
  source: StockSource,
  options: { force?: boolean } = {},
): Promise<StockSyncResult> {
  await db
    .update(s.sapSyncRuns)
    .set({ status: "failed", finishedAt: new Date(), error: "Yarıda kaldı (okuma tamamlanamadı)." })
    .where(
      and(
        eq(s.sapSyncRuns.kind, "stock"),
        eq(s.sapSyncRuns.status, "running"),
        lt(s.sapSyncRuns.startedAt, sql`now() - make_interval(mins => ${ABANDONED_MINUTES})`),
      ),
    );
  const [run] = await db.insert(s.sapSyncRuns).values({ kind: "stock" }).returning({ id: s.sapSyncRuns.id });
  const finish = (values: Partial<typeof s.sapSyncRuns.$inferInsert>) =>
    db
      .update(s.sapSyncRuns)
      .set({ finishedAt: new Date(), ...values })
      .where(eq(s.sapSyncRuns.id, run.id));

  try {
    const rows = readSapStock(await source.read());
    const diff = await db.transaction(async (tx) => {
      const lock = await tx.execute<{ locked: boolean }>(sql`SELECT pg_try_advisory_xact_lock(${LOCK_KEY}) AS locked`);
      if (!lock.rows[0].locked) throw new Error("Başka bir stok okuması sürüyor; bu okuma uygulanmadı.");
      const current = await tx
        .select({ sapItemCode: s.warehouseStock.sapItemCode, quantity: s.warehouseStock.quantity })
        .from(s.warehouseStock);
      const partial = options.force ? null : looksLikePartialSapRead(current, rows);
      if (partial) {
        throw new Error(
          `Yarım okuma olabilir: önceki okumada ${partial.before} kalem stoktaydı, bu okumada ${partial.after}. ` +
            "Okuma uygulanmadı; doğruysa elle zorla uygulanır (npm run sap:stok zorla).",
        );
      }
      const diff = diffWarehouseStock(current, rows);
      for (let i = 0; i < diff.removed.length; i += BATCH) {
        await tx.delete(s.warehouseStock).where(inArray(s.warehouseStock.sapItemCode, diff.removed.slice(i, i + BATCH)));
      }
      const syncedAt = new Date();
      for (let i = 0; i < rows.length; i += BATCH) {
        await tx
          .insert(s.warehouseStock)
          .values(rows.slice(i, i + BATCH).map((r) => ({ ...r, itemName: r.itemName ?? null, syncedAt, syncRunId: run.id })))
          .onConflictDoUpdate({
            target: s.warehouseStock.sapItemCode,
            set: {
              itemName: sql`excluded.item_name`,
              quantity: sql`excluded.quantity`,
              syncedAt: sql`excluded.synced_at`,
              syncRunId: sql`excluded.sync_run_id`,
            },
          });
      }
      return diff;
    });
    await finish({ status: "success", rowsRead: rows.length });
    return { status: "success", runId: run.id, rowsRead: rows.length, ...diff };
  } catch (error) {
    // Drizzle sorgu hatasini sarar; asil hata (PostgreSQL) cause'tadir.
    const cause = (error as { cause?: unknown }).cause ?? error;
    const message = cause instanceof Error ? cause.message : String(cause);
    await finish({ status: "failed", error: message });
    return { status: "failed", runId: run.id, error: message };
  }
}

/* ---------------------------- Deneme kaynagi ---------------------------- */

/**
 * Deneme dosyasi (SAP baglanmadan once): ilk satir baslik (kod, ad, miktar;
 * "ad" istege bagli), sonra kalem basina bir satir. Ayirac noktali virgul,
 * virgul ya da sekme; tirnak icindeki ayirac hucreye aittir. Excel'in
 * "CSV" olarak kaydettigi dosya okunur.
 */
export function parseStockCsv(text: string): SapStockLine[] {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];
  const delimiter = [";", "\t", ","].find((d) => lines[0].includes(d)) ?? ";";
  const header = splitCsvLine(lines[0], delimiter).map((h) =>
    h
      .toLocaleLowerCase("tr")
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9 ]/g, "")
      .trim(),
  );
  const column = (names: string[]) => header.findIndex((h) => names.includes(h));
  const code = column(["kod", "kalem kodu", "itemcode"]);
  const name = column(["ad", "kalem adi", "itemname"]);
  const quantity = column(["miktar", "kullanilabilir", "available", "quantity"]);
  if (code < 0 || quantity < 0) throw new Error("Deneme dosyasının ilk satırı başlık olmalı: kod;ad;miktar");
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    return { code: cells[code] ?? "", name: name >= 0 ? cells[name] : undefined, quantity: cells[quantity] };
  });
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === delimiter) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function fileStockSource(path: string): StockSource {
  return {
    async read() {
      let text: string;
      try {
        text = await readFile(path, "utf8");
      } catch (error) {
        throw new Error(`Deneme dosyası okunamadı: ${path} (${(error as NodeJS.ErrnoException).code ?? "hata"}).`);
      }
      return parseStockCsv(text);
    },
  };
}

/**
 * Ayarlardaki stok kaynagi; tanimli degilse null (okuma calismaz).
 * - SAP_STOK_DOSYASI: deneme dosyasi; goreli yol sitenin calistigi
 *   klasore (apps/zenweld-web) gore.
 * SAP baglantisi gelince onun ayarlari burada once denenir.
 */
export function stockSourceFromEnv(env: Record<string, string | undefined> = process.env): StockSource | null {
  if (env.SAP_STOK_DOSYASI) return fileStockSource(resolve(env.SAP_STOK_DOSYASI));
  return null;
}

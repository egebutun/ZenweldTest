/**
 * STOK DOSYASINI OKUMA (tarayici)
 *
 * Bayiden gelen .csv ya da .xlsx dosyasini satir x hucre tablosuna cevirir.
 * Tablonun yorumlanmasi (basliklar, adetler, eslestirme) @zenweld/data
 * icindeki readStockSheet() ile yapilir; backend'de ayni fonksiyon
 * sunucuda okunan tabloyla kullanilir.
 */

const MAX_BYTES = 5 * 1024 * 1024;

export class StockFileError extends Error {}

/** CSV metnini tabloya cevirir: ; , ya da sekme ayiraci, tirnakli hucreler. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const counts = [";", ",", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  const delimiter = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ";";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** UTF-8 degilse Turkce Windows kodlamasi (Excel'in eski CSV kaydi) denenir. */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1254").decode(buffer);
  }
}

export async function readStockFile(file: File): Promise<unknown[][]> {
  if (file.size > MAX_BYTES) throw new StockFileError("Dosya 5 MB'tan büyük.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".xls")) {
    throw new StockFileError("Eski Excel (.xls) biçimi okunamıyor. Dosyayı Excel'de .xlsx ya da .csv olarak kaydedip yükleyin.");
  }
  if (name.endsWith(".xlsx")) {
    // Kutuphane yalnizca Excel dosyasi secilince indirilir.
    const { readSheet } = await import("read-excel-file/browser");
    try {
      return (await readSheet(file)) as unknown[][];
    } catch {
      throw new StockFileError("Excel dosyası okunamadı. Dosyanın bozuk olmadığından emin olun.");
    }
  }
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseCsv(decodeText(await file.arrayBuffer()));
  }
  throw new StockFileError("Yalnızca .csv ve .xlsx dosyaları yüklenebilir.");
}

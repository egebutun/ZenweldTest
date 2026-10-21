"use client";

/**
 * Excel'de formul olarak calisabilecek hucreler duz yaziya cevrilir (basina
 * ' eklenir): ziyaretcinin forma yazdigi "=HYPERLINK(...)" panelden indirilen
 * dosyada calismasin. "+90 532 …" gibi telefon ve sayilara dokunulmaz.
 */
function neutralizeFormula(s: string): string {
  if (/^[=@\t\r]/.test(s)) return `'${s}`;
  if (/^[+-]/.test(s) && !/^[+-][\d\s().,/-]*$/.test(s)) return `'${s}`;
  return s;
}

const csvCell = (s: string) => {
  const safe = neutralizeFormula(s);
  return /[",;\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Secili tabloyu CSV olarak indirir. */
export function downloadCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => csvCell(v === undefined || v === null ? "" : String(v));
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

/** Satir x hucre tablosunu CSV olarak indirir (Excel icin ; ayirac, UTF-8 BOM). */
export function downloadCsvRows(rows: string[][], filename: string): void {
  const csv = rows.map((r) => r.map(csvCell).join(";")).join("\n");
  triggerDownload(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), filename);
}

"use client";

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

/** Satir x hucre tablosunu CSV olarak indirir (Excel icin ; ayirac, UTF-8 BOM). */
export function downloadCsvRows(rows: string[][], filename: string): void {
  const escape = (s: string) => (/[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");
  triggerDownload(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), filename);
}

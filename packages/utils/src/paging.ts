/**
 * PANEL LISTELERINDE SAYFALAMA (sayfa basina 50 kayit)
 *
 * Veritabani modunda sunucu yalnizca istenen sayfanin kayitlarini ve
 * toplam sayiyi okur (packages/db › panel-lists.ts); demo modunda ayni
 * hesap tarayicidaki kayitlarla yapilir (pageOf). Sayfa numarasi adreste
 * durur (?sayfa=2); son sayfadan buyukse son sayfa gosterilir.
 */
export const PANEL_PAGE_SIZE = 50;

export interface ListPage<T> {
  rows: T[];
  /** Suzgece uyan kayitlarin tamami */
  total: number;
  /** Gosterilen sayfa (1'den baslar) */
  page: number;
}

/** Istenen sayfa, toplam kayda gore 1 ile son sayfa arasina cekilir. */
export function pageWindow(total: number, page: number, size = PANEL_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  return { page: current, pageCount, offset: (current - 1) * size, limit: size };
}

/** Demo modu: suzulmus kayitlarin istenen sayfasi. */
export function pageOf<T>(rows: T[], page: number, size = PANEL_PAGE_SIZE): ListPage<T> {
  const w = pageWindow(rows.length, page, size);
  return { rows: rows.slice(w.offset, w.offset + w.limit), total: rows.length, page: w.page };
}

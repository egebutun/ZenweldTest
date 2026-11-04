"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ZenweldDatabase } from "@zenweld/data";

/**
 * SUNUCUDAN GELEN KATALOG (KARARLAR K-88)
 *
 * Veri kaynagi veritabani secilmisse (DATA_SOURCE=database) sitenin
 * katalogu sunucuda veritabanindan okunur ve bu saglayiciyla sayfaya
 * verilir. useDatabase() bu kayit turlerini tarayicidaki kopya yerine
 * buradan okur; uyeler, siparisler, teklifler gibi digerleri bu asamada
 * tarayicida kalir. Demo modunda saglayici kullanilmaz, site bugunku gibi
 * calisir.
 */
export type CatalogData = Pick<
  ZenweldDatabase,
  "products" | "categories" | "categoryGroups" | "optionDefinitions" | "warehouseStock" | "settings"
>;

const CatalogContext = createContext<CatalogData | null>(null);

export function CatalogProvider({ catalog, children }: { catalog: CatalogData | null; children: ReactNode }) {
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

/** Sunucudan gelen katalog; demo modunda null. */
export function useServerCatalog(): CatalogData | null {
  return useContext(CatalogContext);
}

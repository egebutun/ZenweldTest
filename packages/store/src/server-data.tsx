"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ZenweldDatabase } from "@zenweld/data";

/**
 * SUNUCUDAN GELEN VERI (KARARLAR K-88)
 *
 * Veri kaynagi veritabani secilmisse (DATA_SOURCE=database) bazi kayit
 * turleri sunucuda veritabanindan okunur ve bu saglayiciyla sayfaya
 * verilir; useDatabase() bunlari tarayicidaki kopya yerine buradan okur.
 *
 * - Sayfa cercevesi (site layout'u) katalogu verir: urunler, kategoriler,
 *   secenekler, depo stogu, magaza ayarlari.
 * - Agir ya da sayfaya ozel veri yalnizca gereken sayfaya gider: urun
 *   sayfasi o urunun bayi ve satici stogunu, bayileri ve yorumlarini;
 *   Bayi Bul bayileri; anasayfa bayileri ve one cikan yorumlari alir.
 *   Saglayici ic ice kullanilir: sayfanin verisi cercevenin verisinin
 *   ustune eklenir.
 * - Uyeler, siparisler, teklifler ve icerik bu asamada tarayicida kalir.
 *
 * Demo modunda veri null'dir; site bugunku gibi tarayicidaki veriyle
 * calisir.
 */
export type ServerData = Partial<ZenweldDatabase>;

/** Sayfa cercevesinin verdigi katalog. */
export type CatalogData = Pick<
  ZenweldDatabase,
  "products" | "categories" | "categoryGroups" | "optionDefinitions" | "warehouseStock" | "settings"
>;

const ServerDataContext = createContext<ServerData | null>(null);

export function ServerDataProvider({ data, children }: { data: ServerData | null; children: ReactNode }) {
  const parent = useContext(ServerDataContext);
  const value = useMemo(() => (data ? { ...parent, ...data } : parent), [parent, data]);
  return <ServerDataContext.Provider value={value}>{children}</ServerDataContext.Provider>;
}

/** Sunucudan gelen veri; demo modunda null. */
export function useServerData(): ServerData | null {
  return useContext(ServerDataContext);
}

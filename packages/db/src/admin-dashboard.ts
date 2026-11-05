import type { ZenweldDatabase } from "@zenweld/data";
import type { AuditDb } from "./audit";
import { readRetailersPanel } from "./admin-network";
import { cancelExpiredTransfers } from "./orders";
import { readCatalog, readContent, readOrders, readQuotes, readServiceRequests, readUsers, readWarranties } from "./read";

/**
 * PANEL ANA SAYFASI SUNUCUDA (veritabani modu; Asama 5, 6. alan, adim 6.3;
 * KARARLAR K-99)
 *
 * Ana sayfanin ozet kutulari, listeleri ve grafikleri demo modundakiyle
 * ayni kurallarla tarayicida hesaplanir (apps/zenweld-web › lib/admin-stats.ts);
 * veriyi buradan alir. Once suresi dolan havale siparisleri iptal edilir
 * (ciroda ve "islem bekliyor"da sayilmasin). Uyelerin sifre ozeti ve
 * adresleri gonderilmez.
 *
 * Bugun siparis, teklif, uye, servis ve garanti kayitlarinin tamami gider;
 * kayit sayisi buyuyunce ozet sunucuda hesaplanmali (YAPILACAKLAR).
 */
export async function readDashboardPanel(db: AuditDb, at: Date): Promise<Partial<ZenweldDatabase>> {
  await cancelExpiredTransfers(db, at);
  const catalog = await readCatalog(db);
  const network = await readRetailersPanel(db);
  const content = await readContent(db);
  const { users } = await readUsers(db);
  return {
    products: catalog.products,
    categories: catalog.categories,
    categoryGroups: catalog.categoryGroups,
    // Online satis stogu olmayan urunler icin (yalnizca sitede gorunebilecek satirlar).
    retailers: network.retailers,
    dealers: network.dealers,
    retailerStock: network.retailerStock,
    dealerStock: network.dealerStock,
    settings: network.settings,
    orders: await readOrders(db),
    quotes: await readQuotes(db),
    users: users.map((u) => ({ ...u, passwordHash: "" })),
    serviceRequests: await readServiceRequests(db),
    warranties: await readWarranties(db),
    events: content.events,
    news: content.news,
  };
}

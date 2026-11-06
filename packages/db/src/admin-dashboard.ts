import type { ZenweldDatabase } from "@zenweld/data";
import type { AuditDb } from "./audit";
import { readRetailersPanel } from "./admin-network";
import { cancelExpiredTransfers } from "./orders";
import { readCatalog, readContent, readOrders, readQuotes, readServiceRequests, readUsers, readWarranties } from "./read";

export type DashboardRecords = Pick<
  ZenweldDatabase,
  | "products"
  | "categories"
  | "categoryGroups"
  | "retailers"
  | "dealers"
  | "retailerStock"
  | "dealerStock"
  | "settings"
  | "orders"
  | "quotes"
  | "users"
  | "serviceRequests"
  | "warranties"
  | "events"
  | "news"
>;

/**
 * PANEL ANA SAYFASI SUNUCUDA (veritabani modu; KARARLAR K-99)
 *
 * Ana sayfanin hesabinda kullanilan kayitlar. Ozet, grafikler ve listeler
 * sunucuda hesaplanir (apps/zenweld-web › lib/admin-stats.ts ›
 * dashboardSummary); bu kayitlar tarayiciya gitmez, yalnizca sonuc gider.
 * Once suresi dolan havale siparisleri iptal edilir (ciroda ve "islem
 * bekliyor"da sayilmasin).
 */
export async function readDashboardPanel(db: AuditDb, at: Date): Promise<DashboardRecords> {
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
    // Sifre ozeti hesapta kullanilmaz.
    users: users.map((u) => ({ ...u, passwordHash: "" })),
    serviceRequests: await readServiceRequests(db),
    warranties: await readWarranties(db),
    events: content.events,
    news: content.news,
  };
}

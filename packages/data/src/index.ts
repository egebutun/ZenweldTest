export * from "./types";
export * from "./highlights";
export * from "./discount";
export * from "./checkout";
export * from "./legal";
export { categories, categoryGroups } from "./seed/categories.seed";
export { products } from "./seed/products.seed";
export { dealers } from "./seed/dealers.seed";
export { retailers } from "./seed/retailers.seed";
export { retailerStock, dealerStock } from "./seed/stock.seed";
export { users, addresses } from "./seed/users.seed";
export { blogPosts, faqs, quotes, warranties } from "./seed/content.seed";
export { orders } from "./seed/orders.seed";
export { reviews } from "./seed/reviews.seed";
export { events, news } from "./seed/events.seed";
export { stockPhotos } from "./seed/images";
export { defaultSettings } from "./seed/settings.seed";
export { about, salesReps } from "./seed/company.seed";
export { legalPages } from "./seed/legal.seed";

import type { ZenweldDatabase } from "./types";
import { categories, categoryGroups } from "./seed/categories.seed";
import { products } from "./seed/products.seed";
import { dealers } from "./seed/dealers.seed";
import { retailers } from "./seed/retailers.seed";
import { retailerStock, dealerStock } from "./seed/stock.seed";
import { users, addresses } from "./seed/users.seed";
import { blogPosts, faqs, quotes, warranties } from "./seed/content.seed";
import { orders } from "./seed/orders.seed";
import { reviews } from "./seed/reviews.seed";
import { events, news } from "./seed/events.seed";
import { defaultSettings } from "./seed/settings.seed";
import { about, salesReps } from "./seed/company.seed";
import { legalPages } from "./seed/legal.seed";
import { createSampleActivity } from "./seed/sample-activity.seed";

/** localStorage'a yuklenecek baslangic veritabani. */
export const DB_VERSION = 44;

export function createSeedDatabase(): ZenweldDatabase {
  // Panel grafikleri icin son 90 gunun ornek hareketleri (bkz. sample-activity.seed.ts)
  const sample = createSampleActivity();
  return JSON.parse(
    JSON.stringify({
      version: DB_VERSION,
      products,
      categories,
      categoryGroups,
      dealers,
      retailers,
      retailerStock,
      dealerStock,
      users: [...users, ...sample.users],
      addresses,
      quotes: [...quotes, ...sample.quotes],
      orders: [...orders, ...sample.orders],
      blogPosts,
      events,
      news,
      faqs,
      reviews,
      warranties: [...warranties, ...sample.warranties],
      about,
      salesReps,
      legalPages,
      serviceRequests: sample.serviceRequests,
      settings: defaultSettings,
    }),
  ) as ZenweldDatabase;
}

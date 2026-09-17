export * from "./types";
export { categories, categoryGroups } from "./seed/categories.seed";
export { products } from "./seed/products.seed";
export { dealers } from "./seed/dealers.seed";
export { retailers } from "./seed/retailers.seed";
export { retailerStock, dealerStock } from "./seed/stock.seed";
export { users, addresses, DEMO_PASSWORDS } from "./seed/users.seed";
export { blogPosts, faqs, quotes, orders, warranties } from "./seed/content.seed";
export { stockPhotos } from "./seed/images";

import type { ZenweldDatabase } from "./types";
import { categories, categoryGroups } from "./seed/categories.seed";
import { products } from "./seed/products.seed";
import { dealers } from "./seed/dealers.seed";
import { retailers } from "./seed/retailers.seed";
import { retailerStock, dealerStock } from "./seed/stock.seed";
import { users, addresses } from "./seed/users.seed";
import { blogPosts, faqs, quotes, orders, warranties } from "./seed/content.seed";

/** localStorage'a yuklenecek baslangic veritabani. */
export const DB_VERSION = 3;

export function createSeedDatabase(): ZenweldDatabase {
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
      users,
      addresses,
      quotes,
      orders,
      blogPosts,
      faqs,
      warranties,
    }),
  ) as ZenweldDatabase;
}

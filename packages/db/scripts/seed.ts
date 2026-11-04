import "./env";
import { sql } from "drizzle-orm";
import { createSeedDatabase } from "@zenweld/data";
import { createDb } from "../src/client";
import { seedDatabase } from "../src/seed";

/**
 * npm run db:seed — sitenin ornek verisini (packages/data) bilgisayardaki
 * bos veritabanina yukler. Ornek uyeler ve siparisler de yuklendigi icin
 * canli ya da deneme sunucusunda calistirilmaz; onlar icin: npm run db:yukle.
 */
const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
  console.error("db:seed yalnızca bilgisayardaki veritabanında çalışır (DATABASE_URL localhost olmalı).");
  process.exit(1);
}
const { db, pool } = createDb(url);
try {
  const { rows } = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM products`);
  if (rows[0].n > 0) {
    console.error("Veritabanında kayıt var; örnek veri yalnızca boş veritabanına yüklenir. Önce: npm run db:reset");
    process.exit(1);
  }
  const counts = await db.transaction((tx) => seedDatabase(tx, createSeedDatabase()));
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  console.log(`Örnek veri yüklendi: ${total} satır, ${Object.keys(counts).length} tablo.`);
  for (const [table, n] of Object.entries(counts)) if (n > 0) console.log(`  ${table}: ${n}`);
} finally {
  await pool.end();
}

import "./env";
import { createDb } from "../src/client";
import { resetDatabase } from "../src/migrate";

/**
 * npm run db:reset — bilgisayardaki veritabanini siler ve tablolari bastan
 * kurar. Canli ya da deneme sunucusunda calistirilmaz.
 */
const url = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) {
  console.error("db:reset yalnızca bilgisayardaki veritabanında çalışır (DATABASE_URL localhost olmalı).");
  process.exit(1);
}
const { pool } = createDb(url);
try {
  await resetDatabase(pool);
  console.log("Veritabanı sıfırlandı ve tablolar baştan kuruldu.");
} finally {
  await pool.end();
}

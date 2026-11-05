import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createSeedDatabase } from "@zenweld/data";
import { resetDatabase } from "../packages/db/src/migrate";
import * as schema from "../packages/db/src/schema";
import { seedDatabase } from "../packages/db/src/seed";

/**
 * npm run test:e2e:db [playwright secenekleri]
 *
 * VERITABANI MODUNUN TARAYICI TESTLERI (Asama 3.7, KARARLAR K-88)
 *
 * 1. Test veritabanini (TEST_DATABASE_URL) silip bastan kurar ve ornek
 *    veriyi yukler.
 * 2. Siteyi veritabani moduyla ayri bir klasore derler (.next-db; demo
 *    derlemesi .next bozulmaz).
 * 3. tests/e2e-db altindaki testleri bu siteyle calistirir (port 3100).
 *
 * Calisan PostgreSQL ve TEST_DATABASE_URL gerekir (README › Veritabani).
 * test:db ile ayni test veritabanini kullanir; ikisi ayni anda
 * calistirilmaz.
 */
const root = fileURLToPath(new URL("..", import.meta.url));
const app = `${root}apps/zenweld-web`;
const envFile = `${app}/.env.local`;
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.TEST_DATABASE_URL ?? "";
if (!url) fail("TEST_DATABASE_URL tanımlı değil (README › Veritabanı).");
if (url === process.env.DATABASE_URL) fail("TEST_DATABASE_URL, DATABASE_URL ile aynı olamaz: test veritabanı silinir.");
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) fail("Test veritabanı yalnızca bilgisayarda olabilir (localhost).");

console.log("1/3 Test veritabanı sıfırlanıp örnek veri yükleniyor…");
const pool = new Pool({ connectionString: url });
try {
  await resetDatabase(pool);
  await drizzle(pool, { schema }).transaction((tx) => seedDatabase(tx, createSeedDatabase()));
} finally {
  await pool.end();
}

// Testler yenileme ve SAP uclarini kullanir; her calistirmada yeni
// anahtarlar. SAP stogu testin yazdigi deneme dosyasindan okunur; SAP'a
// aktarilan siparisler deneme dosyasina, panelde yuklenen dosyalar gecici
// bir klasore (dosya deposu) yazilir.
const env = {
  ...process.env,
  DATA_SOURCE: "database",
  DATABASE_URL: url,
  TEST_DATABASE_URL: url,
  NEXT_DIST_DIR: ".next-db",
  REVALIDATE_SECRET: randomUUID(),
  CRON_SECRET: randomUUID(),
  SAP_STOK_DOSYASI: join(tmpdir(), `zenweld-e2e-sap-stok-${process.pid}.csv`),
  SAP_SIPARIS_DOSYASI: join(tmpdir(), `zenweld-e2e-sap-siparis-${process.pid}.jsonl`),
  DOSYA_KLASORU: join(tmpdir(), `zenweld-e2e-dosyalar-${process.pid}`),
};

console.log("2/3 Site veritabanı moduyla derleniyor (.next-db)…");
// Next ayri klasore derlerken bu iki dosyayi o klasore gore yeniden yazar;
// derlemeden sonra eski haline dondurulur (Git'te degisiklik gorunmesin).
const kept = ["tsconfig.json", "next-env.d.ts"].map((file) => [`${app}/${file}`, readFileSync(`${app}/${file}`, "utf8")]);
const build = spawnSync("npx", ["next", "build"], { cwd: app, env, stdio: "inherit" });
for (const [file, text] of kept) writeFileSync(file, text);
if (build.status !== 0) fail("Derleme başarısız.");

console.log("3/3 Tarayıcı testleri (veritabanı modu)…");
const run = spawnSync("npx", ["playwright", "test", "-c", "playwright.db.config.ts", ...process.argv.slice(2)], {
  cwd: root,
  env,
  stdio: "inherit",
});
rmSync(env.SAP_STOK_DOSYASI, { force: true });
rmSync(env.SAP_SIPARIS_DOSYASI, { force: true });
rmSync(env.DOSYA_KLASORU, { recursive: true, force: true });
process.exit(run.status ?? 1);

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

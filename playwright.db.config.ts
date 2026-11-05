import { defineConfig } from "@playwright/test";

/**
 * VERITABANI MODUNUN TARAYICI TESTLERI (Playwright)
 *
 * npm run test:e2e:db ile calistirilir (scripts/e2e-db.mts): test
 * veritabanini kurar, siteyi veritabani moduyla .next-db'ye derler ve bu
 * ayarla testleri calistirir. Site 3100 portunda acilir; demo sunucusu
 * (3000) ile karismaz. Testler tests/e2e-db altindadir.
 */
const PORT = 3100;
for (const name of ["TEST_DATABASE_URL", "REVALIDATE_SECRET", "CRON_SECRET", "SAP_STOK_DOSYASI", "SAP_SIPARIS_DOSYASI", "DOSYA_KLASORU"]) {
  if (!process.env[name]) throw new Error(`${name} tanımlı değil: bu testler npm run test:e2e:db ile çalıştırılır.`);
}

export default defineConfig({
  testDir: "tests/e2e-db",
  timeout: 60_000,
  retries: 0,
  // Testler ayni veritabanini degistirip geri aldigi icin sirayla calisir.
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chromium",
    viewport: { width: 1366, height: 900 },
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run start --workspace apps/zenweld-web -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATA_SOURCE: "database",
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
      NEXT_DIST_DIR: ".next-db",
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET!,
      CRON_SECRET: process.env.CRON_SECRET!,
      SAP_STOK_DOSYASI: process.env.SAP_STOK_DOSYASI!,
      SAP_SIPARIS_DOSYASI: process.env.SAP_SIPARIS_DOSYASI!,
      DOSYA_KLASORU: process.env.DOSYA_KLASORU!,
    },
  },
});

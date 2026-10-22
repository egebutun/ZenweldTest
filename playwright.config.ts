import { defineConfig } from "@playwright/test";

/**
 * TARAYICI TESTLERI (Playwright)
 *
 * Sitenin ve panelin gercek tarayicida calistigini dener. Once derleme
 * gerekir: npm run build && npm run test:e2e. Sunucu (localhost:3000)
 * aciksa o kullanilir, degilse burada baslatilir. Testler tests/e2e
 * altindadir; giris bilgileri README'deki Demo Hesaplar tablosundan okunur.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  // Bir hata tekrar denenerek gizlenmesin.
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    // Tam Chromium (PDF goruntuleyici dahil), yeni headless modunda.
    channel: "chromium",
    viewport: { width: 1366, height: 900 },
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "giris", testMatch: /giris\.kurulum\.ts/ },
    { name: "testler", testMatch: /\.spec\.ts/, dependencies: ["giris"] },
  ],
  webServer: {
    command: "npm run start --workspace apps/zenweld-web",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

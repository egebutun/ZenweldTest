import { defineConfig } from "vitest/config";

/**
 * VERITABANI TESTLERI (Vitest + PostgreSQL)
 *
 * Tablolarin ve veritabanindaki kurallarin dogru kuruldugunu dener
 * (docs/VERITABANI.md). Calistirma: npm run test:db. Calisan bir PostgreSQL
 * ve TEST_DATABASE_URL gerekir (README › Veritabani); test veritabani her
 * calistirmada silinip bastan kurulur.
 */
export default defineConfig({
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/db/kurulum.ts"],
    // Testler ayni veritabanini kullanir; sirayla calisir.
    fileParallelism: false,
  },
});

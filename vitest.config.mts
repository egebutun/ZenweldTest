import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * KURAL TESTLERI (Vitest)
 *
 * docs/IS-KURALLARI.md'deki hesaplari tarayicisiz dener. Calistirma:
 * npm test. Testler tests/unit altindadir.
 */
export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./apps/zenweld-web/src/", import.meta.url)) }],
  },
  // Uygulamanin tsconfig'i JSX'i Next.js'e birakir (preserve); testte
  // bilesen dosyalari (or. OptionsTab'deki dogrulamalar) cevrilmeli.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});

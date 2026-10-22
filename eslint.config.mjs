import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * KOD DENETIMI (ESLint)
 *
 * Next.js'in onerdigi kurallar (core-web-vitals + typescript) butun projeye,
 * site ve ortak paketlere birlikte uygulanir. Calistirma: npm run lint.
 * next build de calistirir; hata varsa derleme durur.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: { next: { rootDir: "apps/zenweld-web/" } },
    rules: {
      // Turkce metinlerde kesme isareti cok sik gecer (Kaydet'e, POS'un);
      // metin icinde ' serbest, digerleri yasak kalir.
      "react/no-unescaped-entities": ["error", { forbid: [">", '"', "}"] }],
      // Yalnizca eski pages/ klasoru icindir; bu projede pages/ yok (app/ kullanilir).
      // Acik kalinca kokten calistirmada uyari verir, derlemede calismaz.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;

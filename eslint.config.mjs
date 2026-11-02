import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * KOD DENETIMI (ESLint)
 *
 * Next.js'in onerdigi kurallar (core-web-vitals + typescript) butun projeye,
 * site ve ortak paketlere birlikte uygulanir. Calistirma: npm run lint.
 * npm run build de once bunu calistirir; hata varsa derleme durur.
 */
const config = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/next-env.d.ts"],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    settings: { next: { rootDir: "apps/zenweld-web/" } },
    rules: {
      // Turkce metinlerde kesme isareti cok sik gecer (Kaydet'e, POS'un);
      // metin icinde ' serbest, digerleri yasak kalir.
      "react/no-unescaped-entities": ["error", { forbid: [">", '"', "}"] }],
      // Yalnizca eski pages/ klasoru icindir; bu projede pages/ yok (app/ kullanilir).
      // Acik kalinca kokten calistirmada uyari verir, derlemede calismaz.
      "@next/next/no-html-link-for-pages": "off",
      // Next 16 ile gelen kural: efekt icinde setState. Bu projede bilerek
      // kullanilir: sepet, favoriler, teklif listesi, oturum ve cerez tercihi
      // tarayici deposundan sayfa acildiktan SONRA okunur (sunucu ciktisi ile
      // ilk cizim ayni kalsin). Bu bilesenler veri sunucuya tasinirken yeniden
      // yazilacak (docs/YAPILACAKLAR.md › Next.js 16).
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;

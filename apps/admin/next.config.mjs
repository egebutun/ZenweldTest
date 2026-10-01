/** @type {import('next').NextConfig} */

/**
 * ZENWELD YONETIM PANELI
 *
 * Ana siteden AYRI bir uygulama. Ziyaretci onu ana sitenin adresi altinda
 * gorur (zenweld.com/yonetim): ana site /yonetim isteklerini bu uygulamaya
 * iletir (bkz. apps/zenweld-web/next.config.mjs, ADMIN_URL).
 *
 * basePath "/yonetim": panelin tum sayfalari VE dosyalari (/_next/...) bu
 * on ekle sunulur; boylece ana site yalnizca /yonetim ile baslayan
 * istekleri iletir ve iki uygulamanin dosyalari karismaz.
 *
 * Neden ana sitenin adresi altinda? Backend yokken veri tarayici
 * deposunda tutuluyor ve tarayici depoyu ADRESE gore ayirir. Panel ayni
 * adreste oldugu icin paneldeki degisiklik ana sitede aninda gorunur.
 * Backend geldiginde panel admin.zenweld.com gibi ayri bir alt alan
 * adina tasinabilir; bu bir dagitim ayaridir, yeniden yazim gerektirmez.
 */
const nextConfig = {
  basePath: "/yonetim",
  reactStrictMode: true,
  transpilePackages: [
    "@zenweld/data",
    "@zenweld/store",
    "@zenweld/auth",
    "@zenweld/ui",
    "@zenweld/i18n",
    "@zenweld/utils",
  ],
  env: {
    // Kampanya tarihleri icin (bkz. packages/store/src/hooks.ts useNow).
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // Panel arama motorlarinda asla cikmasin: her yanita noindex basligi.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;

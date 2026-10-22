/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === "development";

/**
 * ICERIK GUVENLIK POLITIKASI (CSP)
 *
 * Tarayiciya sayfanin hangi kaynaklardan kod, gorsel, cerceve
 * yukleyebilecegini soyler. Siteye yeni bir dis servis (analiz kodu,
 * video, harita, odeme sayfasi) eklenirse adresi buraya da yazilmalidir;
 * yazilmazsa tarayici o servisi engeller (bkz. docs/ENTEGRASYONLAR.md).
 *
 * - script-src: Next.js sayfa verisini satir ici <script> ile yazar;
 *   sayfalar onceden uretildigi (SSG) icin her istege ozel anahtar (nonce)
 *   verilemez, bu yuzden 'unsafe-inline' acik. Gelistirme sunucusu ayrica
 *   eval kullanir.
 * - img-src https: panelden herhangi bir https gorsel adresi girilebiliyor.
 * - data:/blob: panelde yuklenen gorseller, yorum videolari ve belgeler
 *   tarayicida bu bicimde tutulur.
 * - frame-src: iletisim sayfasindaki Google Haritalar.
 * - frame-ancestors 'none': site baska bir sitenin icinde (cerceve)
 *   acilamaz.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-src https://maps.google.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Butun yanitlara eklenen guvenlik basliklari. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Tarayici siteye bir yil boyunca yalnizca https ile baglanir.
  // Alt alan adlarini kapsamasi (includeSubDomains) canliya cikarken BT ile
  // kararlastirilacak (docs/YAPILACAKLAR.md).
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  // Eski tarayicilar icin frame-ancestors'in karsiligi.
  { key: "X-Frame-Options", value: "DENY" },
  // Dosya turu tahmin edilmez; yuklenen dosya kod gibi calistirilamaz.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Dis sitelere yalnizca alan adi gider, sayfa yolu ve arama gitmez.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Konum yalnizca bayi ve servis agi sayfasindaki "Konumumu Kullan" icin.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()" },
];

const nextConfig = {
  reactStrictMode: true,
  env: {
    // Kampanya tarihleri icin: sunucu ciktisi ile tarayicinin ilk cizimi
    // ayni ana gore hesaplansin (bkz. packages/store/src/hooks.ts useNow).
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  transpilePackages: [
    "@zenweld/data",
    "@zenweld/store",
    "@zenweld/auth",
    "@zenweld/ui",
    "@zenweld/i18n",
    "@zenweld/utils",
  ],
  /**
   * YONETIM PANELI (/yonetim)
   *
   * Panel bu sitenin icinde calisir (src/app/yonetim). Arama motorlarina
   * her zaman kapali: bu baslik ve panelin meta etiketi. Baslik, sayfa
   * olmayan yanitlari da (gorsel vb.) kapsar.
   */
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/yonetim", headers: noindex },
      { source: "/yonetim/:path*", headers: noindex },
    ];
  },
  images: {
    // hostname: "**" acikti; bu, /_next/image ucunu herkesin kullanabilecegi
    // bir gorsel vekiline cevirir (baskasinin dosyasi bizim sunucumuzdan
    // servis edilir). Uygulamada next/image kullanilmadigi icin genis izne
    // gerek yok. Yeni bir kaynak gerekirse buraya acikca eklenir.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;

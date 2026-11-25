/** @type {import('next').NextConfig} */
import oldSiteRedirects from "./eski-site-yonlendirmeleri.json" with { type: "json" };

const isDev = process.env.NODE_ENV === "development";

/**
 * ICERIK GUVENLIK POLITIKASI (CSP)
 *
 * Tarayiciya sayfanin hangi kaynaklardan kod, gorsel, cerceve
 * yukleyebilecegini soyler. Siteye yeni bir dis servis (analiz kodu,
 * video, harita, odeme sayfasi) eklenirse adresi buraya da yazilmalidir;
 * yazilmazsa tarayici o servisi engeller (bkz. docs/SUNUCU.md).
 *
 * - script-src: Next.js sayfa verisini satir ici <script> ile yazar;
 *   sayfalar onceden uretildigi (SSG) icin her istege ozel anahtar (nonce)
 *   verilemez, bu yuzden 'unsafe-inline' acik. Gelistirme sunucusu ayrica
 *   eval kullanir.
 * - img-src https: panelden herhangi bir https gorsel adresi girilebiliyor.
 * - data:/blob: panelde yuklenen gorseller, yorum videolari ve belgeler
 *   tarayicida bu bicimde tutulur.
 * - frame-src: iletisim sayfasindaki Google Haritalar; anasayfa videolari
 *   (cerezsiz YouTube, yalnizca Oynat'a basilinca; KARARLAR K-125); 'self':
 *   panelin Anasayfa Tanıtım ekranindaki onizleme cercevesi.
 * - frame-ancestors 'none': site baska bir sitenin icinde (cerceve)
 *   acilamaz. Tek istisna onizleme sayfasi (asagida PREVIEW): yalnizca ayni
 *   sitenin icinde cerceveye girer.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-src 'self' https://maps.google.com https://www.google.com https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * Panelin onizleme sayfalari (/yonetim/onizleme/...): yalnizca ayni sitenin
 * icinde cerceveye girebilir (Anasayfa Tanıtım ekrani masaustu ve telefon
 * genisligini cercevede gosterir).
 */
const previewHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

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
  // Derleme klasoru. Veritabani modunun tarayici testleri (npm run
  // test:e2e:db) ayri klasore derler; demo derlemesi (.next) bozulmaz.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: {
    // Kampanya tarihleri icin: sunucu ciktisi ile tarayicinin ilk cizimi
    // ayni ana gore hesaplansin (bkz. packages/store/src/hooks.ts useNow).
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    // Veri kaynagi tarayici paketine de derlemede yazilir: veritabani
    // modunda ornek veri pakete girmez (bkz. packages/store/src/database.ts).
    NEXT_PUBLIC_DATA_SOURCE: process.env.DATA_SOURCE === "database" ? "database" : "demo",
  },
  transpilePackages: [
    "@zenweld/data",
    "@zenweld/db",
    "@zenweld/store",
    "@zenweld/auth",
    "@zenweld/ui",
    "@zenweld/i18n",
    "@zenweld/utils",
  ],
  // Posta kutusu okuma (packages/db › mailbox.ts) yalnizca sunucuda calisir;
  // bu paketler derlemeye katilmaz, Node'dan oldugu gibi yuklenir.
  serverExternalPackages: ["imapflow", "mailparser"],
  /**
   * YONETIM PANELI (/yonetim)
   *
   * Panel bu sitenin icinde calisir (src/app/yonetim). Arama motorlarina
   * her zaman kapali: bu baslik ve panelin meta etiketi. Baslik, sayfa
   * olmayan yanitlari da (gorsel vb.) kapsar.
   */
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    // Sitenin kendi gorselleri ve simgeleri (public/images, public/icons;
    // docs/YAPILACAKLAR.md › Ölçüm (hız) 3): tarayici 7 gun saklar, suresi
    // dolunca bir gun daha eskisini gosterip arkada yeniler. Next.js bu
    // dosyalari varsayilan olarak her acilista sunucuya sordurur. Ayni adla
    // degistirilen dosya en gec 7 gunde gorunur; hemen gorunmesi gerekirse
    // dosyanin adi degistirilir. Dosya deposundakiler (/dosya) 1 yil,
    // derlenen dosyalar (/_next/static) kalici saklanir.
    const siteFiles = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: siteFiles },
      { source: "/icons/:path*", headers: siteFiles },
      // Ayni baslik iki kurala uyarsa sonraki gecerlidir.
      { source: "/yonetim/onizleme/:path*", headers: previewHeaders },
      { source: "/yonetim", headers: noindex },
      { source: "/yonetim/:path*", headers: noindex },
    ];
  },
  /**
   * ESKI SITENIN ADRESLERI (KARARLAR K-121, docs/SEO.md › 15)
   *
   * Eski zenweld.com'un adresleri (/urunler/..., /kurumsal/...) yeni
   * sitedeki karsiliklarina 301 (kalici) ile gider; Google eski sonucu yeni
   * adresle degistirir. Liste eski-site-yonlendirmeleri.json'dadir;
   * docs/seo/yonlendirme-listesi.csv ile ayni olmasini ve her hedefin yeni
   * sitede bulunmasini tests/unit/eski-site-yonlendirmeleri.test.ts denetler.
   * Bu kurallar sayfadan ve istek kontrolunden (proxy.ts) once calisir; iki
   * modda da aynidir.
   */
  async redirects() {
    return [
      ...oldSiteRedirects.map(({ eski, yeni }) => ({ source: eski, destination: yeni, statusCode: 301 })),
      // Sayfali listenin 1. sayfasi listenin kendi adresidir (KARARLAR K-124).
      { source: "/:path*/sayfa/1", destination: "/:path*", statusCode: 301 },
    ];
  },
};

export default nextConfig;

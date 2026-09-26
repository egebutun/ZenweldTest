/**
 * ESKI ADRESLER — KALICI YONLENDIRME (HTTP 308)
 *
 * Bunlar sayfa DEGIL, sunucu duzeyinde yonlendirme kuralidir: istek
 * uygulamaya hic girmeden yeni adrese cevrilir, dosya sisteminde bos bir
 * sayfa durmaz.
 *
 * Neden 308: 307 "gecici" demektir; arama motoru eski adresi indekste
 * tutar ve siralama degerini yeni adrese aktarmaz. 308 "kalici" der,
 * eski adres indeksten dusurulup yerine yenisi konur. Onceki surum
 * sayfa icinden redirect() cagiriyordu ve 307 donuyordu.
 *
 * Her ciftin TR ve EN karsiligi ayri yazilir; yonlendirmeler
 * middleware'den once islenir.
 */
const LEGACY_PATHS = [
  // Sayfa yalnizca bayileri degil yetkili servisleri de listeliyor
  ["/tr/nereden-alabilirim", "/tr/yetkili-bayi-ve-servis-agi"],
  ["/en/where-to-buy", "/en/authorised-dealer-service-network"],
  ["/tr/bayi-ve-servis-agi", "/tr/yetkili-bayi-ve-servis-agi"],
  ["/en/dealer-service-network", "/en/authorised-dealer-service-network"],
  // Servis agi sayfasi bayi bulucuyla birlestirildi
  ["/tr/destek/servis-agi", "/tr/yetkili-bayi-ve-servis-agi"],
  ["/en/support/service-network", "/en/authorised-dealer-service-network"],
  // Kurumsal tanitim sayfasi ust seviyeye tasindi
  ["/tr/kesfet/hakkimizda", "/tr/hakkimizda"],
  ["/en/explore/about", "/en/about"],
  // "rehber" neyin rehberi oldugunu soylemiyordu
  ["/tr/kesfet/rehber", "/tr/kesfet/kaynak-rehberi"],
];

/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@zenweld/data",
    "@zenweld/store",
    "@zenweld/auth",
    "@zenweld/ui",
    "@zenweld/i18n",
  ],
  async redirects() {
    return LEGACY_PATHS.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
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

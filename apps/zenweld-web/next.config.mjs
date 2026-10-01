/** @type {import('next').NextConfig} */

/**
 * YONETIM PANELI ADRESI
 *
 * Panel ayri bir uygulamadir (apps/admin) ama ziyaretci onu bu sitenin
 * adresi altinda gorur: zenweld.com/yonetim. Bu site /yonetim ile
 * baslayan istekleri panele iletir (adres cubugu degismez).
 *
 *   Gelistirme: panel http://localhost:3002 uzerinde calisir (npm run dev:admin).
 *   Vercel    : panel ayri bir Vercel projesidir; bu projede ADMIN_URL
 *               ortam degiskeni o projenin adresi olarak tanimlanir.
 *               Tanimli degilse /yonetim 404 doner.
 */
const ADMIN_URL = (
  process.env.ADMIN_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3002")
).replace(/\/$/, "");

if (!ADMIN_URL) {
  console.warn("[zenweld] ADMIN_URL tanimli degil: /yonetim (yonetim paneli) acilmayacak.");
}

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
  async rewrites() {
    if (!ADMIN_URL) return { beforeFiles: [] };
    return {
      // Sitenin [locale] rotasindan ONCE calismali; yoksa "yonetim" bir
      // dil kodu sanilir.
      beforeFiles: [
        { source: "/yonetim", destination: `${ADMIN_URL}/yonetim` },
        { source: "/yonetim/:path+", destination: `${ADMIN_URL}/yonetim/:path+` },
      ],
    };
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

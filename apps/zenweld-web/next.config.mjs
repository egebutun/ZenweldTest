/** @type {import('next').NextConfig} */

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
   * kapali: bu baslik, panelin meta etiketi ve robots.txt.
   */
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    return [
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

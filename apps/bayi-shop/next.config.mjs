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
  images: {
    // hostname: "**" acikti; bu, /_next/image ucunu herkesin kullanabilecegi
    // bir gorsel vekiline cevirir (baskasinin dosyasi bizim sunucumuzdan
    // servis edilir). Uygulamada next/image kullanilmadigi icin genis izne
    // gerek yok. Yeni bir kaynak gerekirse buraya acikca eklenir.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;

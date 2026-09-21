import type { MetadataRoute } from "next";

/**
 * Web App Manifest — /manifest.webmanifest
 *
 * Android Chrome bu dosyayi "ana ekrana ekle", uygulama gecis ekrani ve
 * acilis (splash) ekrani icin kullanir. iOS ise apple-icon.png dosyasini
 * kullandigi icin iki platform da kapsanmis olur.
 *
 * purpose: "maskable" — Android ikonu daire/kare/squircle olarak kirpar;
 * isaretimiz tam zeminli ve ortada oldugu icin her maskede duzgun gorunur.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZENWELD-BAYİ-A — Yetkili Zenweld Bayisi",
    short_name: "ZENWELD-BAYİ-A",
    description:
      "Yetkili Zenweld bayisi. Kaynak makineleri ve ekipmanlarını online satın alın.",
    start_url: "/tr",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141619",
    theme_color: "#b82429",
    lang: "tr",
    dir: "ltr",
    categories: ["business", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

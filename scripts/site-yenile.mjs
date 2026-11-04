import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * npm run site:yenile [kayit turleri]
 *
 * Veritabaninda (ornegin db:studio'da) yapilan degisiklikten sonra siteyi
 * beklemeden yeniler; degisiklik sayfa bir sonraki acilista gorunur.
 *   npm run site:yenile                  butun turler
 *   npm run site:yenile -- katalog icerik
 * Turler: katalog, depo-stogu, stok, bayiler, yorumlar, icerik.
 *
 * Ayarlar apps/zenweld-web/.env.local'dan okunur: REVALIDATE_SECRET (sitenin
 * calistigi sunucudakiyle ayni) ve SITE_URL (bossa NEXT_PUBLIC_SITE_URL,
 * o da bossa http://localhost:3000).
 */
const envFile = fileURLToPath(new URL("../apps/zenweld-web/.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const secret = process.env.REVALIDATE_SECRET;
const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
if (!secret) {
  console.error("REVALIDATE_SECRET tanımlı değil (apps/zenweld-web/.env.local; README › Veritabanı).");
  process.exit(1);
}

const kinds = process.argv.slice(2);
try {
  const response = await fetch(`${site}/api/yenile`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(kinds.length ? { kayitlar: kinds } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reasons = {
      404: "Yenileme ucu kapalı: sitenin çalıştığı sunucuda REVALIDATE_SECRET tanımlı değil (tanımlayıp siteyi yeniden başlatın).",
      401: "Anahtar uyuşmuyor: buradaki REVALIDATE_SECRET sitenin sunucusundakiyle aynı olmalı.",
      400: "Bilinmeyen kayıt türü. Geçerli türler: katalog, depo-stogu, stok, bayiler, yorumlar, icerik.",
    };
    console.error(reasons[response.status] ?? `Yenileme başarısız (HTTP ${response.status}).`);
    process.exit(1);
  }
  console.log(`Yenilendi: ${result.yenilenen.join(", ")}. Değişiklik sayfa bir sonraki açılışta görünür (${site}).`);
} catch {
  console.error(`Siteye ulaşılamadı: ${site} (site çalışıyor mu?)`);
  process.exit(1);
}

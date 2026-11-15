import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * npm run posta:oku
 *
 * Sitenin posta kutularini beklemeden bir kez okutur (zamanlanmis isin
 * yaptigini elle yapar): sitenin /api/posta/oku ucunu cagirir. Site
 * veritabani modunda calisiyor olmali. Sitenin e-postasina yanit olan ya da
 * kayit numarasi tasiyan e-postalar Panel › E-posta'ya alinir (KARARLAR
 * K-116).
 *
 * Ayarlar apps/zenweld-web/.env.local'dan okunur: CRON_SECRET (sitenin
 * calistigi sunucudakiyle ayni) ve SITE_URL (bossa NEXT_PUBLIC_SITE_URL,
 * o da bossa http://localhost:3000).
 */
const envFile = fileURLToPath(new URL("../apps/zenweld-web/.env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

const secret = process.env.CRON_SECRET;
const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
if (!secret) {
  console.error("CRON_SECRET tanımlı değil (apps/zenweld-web/.env.local; README › Posta kutusu).");
  process.exit(1);
}
if (process.argv.length > 2) {
  console.error("Kullanım: npm run posta:oku");
  process.exit(1);
}

try {
  const response = await fetch(`${site}/api/posta/oku`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
  const result = await response.json().catch(() => ({}));
  const boxes = Array.isArray(result.kutular) ? result.kutular : [];
  for (const box of boxes) {
    console.log(`${box.kutu}: ${box.okunan} e-posta okundu, ${box.alinan} panele alındı${box.hata ? ` — okunamadı: ${box.hata}` : ""}.`);
  }
  if (!response.ok) {
    const reasons = {
      404: "Okuma ucu kapalı: sitenin çalıştığı sunucuda CRON_SECRET tanımlı değil (tanımlayıp siteyi yeniden başlatın).",
      401: "Anahtar uyuşmuyor: buradaki CRON_SECRET sitenin sunucusundakiyle aynı olmalı.",
      409: "Site veritabanı modunda değil (DATA_SOURCE=database).",
      503: "Posta kutusu tanımlı değil: sunucuda IMAP_HOST, IMAP_USER, IMAP_PASSWORD (ya da denemek için POSTA_KLASORU) yok (README › Posta kutusu).",
      502: "Posta kutularından en az biri okunamadı (yukarıdaki hata).",
    };
    console.error(reasons[response.status] ?? `Okuma başarısız (HTTP ${response.status}).`);
    process.exit(1);
  }
} catch {
  console.error(`Siteye ulaşılamadı: ${site} (site çalışıyor mu?)`);
  process.exit(1);
}

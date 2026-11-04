import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * npm run sap:stok
 *
 * SAP depo stogunu beklemeden bir kez okutur (zamanlanmis isin yaptigini
 * elle yapar): sitenin /api/sap/stok ucunu cagirir. Site veritabani
 * modunda calisiyor olmali.
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
  console.error("CRON_SECRET tanımlı değil (apps/zenweld-web/.env.local; README › SAP stok okuma).");
  process.exit(1);
}

try {
  const response = await fetch(`${site}/api/sap/stok`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reasons = {
      404: "SAP okuma ucu kapalı: sitenin çalıştığı sunucuda CRON_SECRET tanımlı değil (tanımlayıp siteyi yeniden başlatın).",
      401: "Anahtar uyuşmuyor: buradaki CRON_SECRET sitenin sunucusundakiyle aynı olmalı.",
      409: "Site veritabanı modunda değil (DATA_SOURCE=database).",
      503: "Stok kaynağı tanımlı değil: SAP bağlantısı henüz yok; denemek için SAP_STOK_DOSYASI (README › SAP stok okuma).",
      502: `Stok okunamadı, son stok korundu (okuma ${result.okuma}): ${result.error}`,
    };
    console.error(reasons[response.status] ?? `Okuma başarısız (HTTP ${response.status}).`);
    process.exit(1);
  }
  console.log(
    `Stok okundu (okuma ${result.okuma}): ${result.kalem} kalem, ${result.degisen} değişti.` +
      (result.yenilendi ? " Sayfalar yenilendi." : " Değişiklik yok; sayfalar yenilenmedi."),
  );
} catch {
  console.error(`Siteye ulaşılamadı: ${site} (site çalışıyor mu?)`);
  process.exit(1);
}

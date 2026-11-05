import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * npm run sap:siparis
 *
 * Siradaki siparisleri beklemeden SAP'a gonderir (zamanlanmis isin
 * yaptigini elle yapar): sitenin /api/sap/siparis ucunu cagirir. Site
 * veritabani modunda calisiyor olmali (KARARLAR K-108).
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
  console.error("CRON_SECRET tanımlı değil (apps/zenweld-web/.env.local; README › SAP sipariş aktarımı).");
  process.exit(1);
}
if (process.argv.length > 2) {
  console.error("Kullanım: npm run sap:siparis");
  process.exit(1);
}

try {
  const response = await fetch(`${site}/api/sap/siparis`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reasons = {
      404: "SAP sipariş ucu kapalı: sitenin çalıştığı sunucuda CRON_SECRET tanımlı değil (tanımlayıp siteyi yeniden başlatın).",
      401: "Anahtar uyuşmuyor: buradaki CRON_SECRET sitenin sunucusundakiyle aynı olmalı.",
      409: "Site veritabanı modunda değil (DATA_SOURCE=database).",
      503: "Sipariş aktarıcısı tanımlı değil: SAP bağlantısı henüz yok; denemek için SAP_SIPARIS_DOSYASI (README › SAP sipariş aktarımı).",
    };
    console.error(reasons[response.status] ?? `Aktarım başarısız (HTTP ${response.status}).`);
    process.exit(1);
  }
  const list = (codes) => (codes.length ? ` (${codes.join(", ")})` : "");
  console.log(
    `Sipariş aktarımı (${result.aktarici}): ${result.gonderildi.length} gönderildi${list(result.gonderildi)}, ` +
      `${result.yenidenDenenecek.length} yeniden denenecek${list(result.yenidenDenenecek)}, ` +
      `${result.basarisiz.length} başarısız${list(result.basarisiz)}, ${result.atlandi.length} atlandı${list(result.atlandi)}.`,
  );
} catch {
  console.error(`Siteye ulaşılamadı: ${site} (site çalışıyor mu?)`);
  process.exit(1);
}

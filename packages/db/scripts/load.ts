import "./env";
import { readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { createSeedDatabase } from "@zenweld/data";
import { createDb } from "../src/client";
import { fileStorageFromEnv } from "../src/file-storage";
import { loadData, type LoadMode, type LoadTarget } from "../src/load";
import { storeSiteImages } from "../src/site-images";

/**
 * npm run db:yukle <canli|deneme> [guncelle] — sitenin bugunku verisini
 * DATABASE_URL'deki veritabanina yukler (src/load.ts; KARARLAR K-91).
 * Varsayilan yalnizca eksik kayitlari eklemektir: panel veritabanina
 * yazdigi icin (Asama 5) panelde yapilan degisikliklerin uzerine yazilmaz.
 * Bilgisayar disindaki bir veritabanina yuklemeden once veritabaninin adi
 * yazilarak onay verilir.
 *
 * Urun, haber, etkinlik ve anasayfa gorselleri once dosya deposuna
 * kopyalanir, kayitlara depo adresi yazilir (src/site-images.ts); depo
 * tanimli degilse (DOSYA_KLASORU) hicbir sey yuklenmez.
 */
const USAGE = `Kullanım: npm run db:yukle <canli|deneme> [guncelle]
  canli     katalog, içerik, mağaza ayarları, bayiler, satıcılar
            (depo stoğu canlıda yalnızca SAP okumasından gelir)
  deneme    bunlara ek olarak örnek yorumlar, kuponlar, depo stoğu ve bayi
            stok listeleri
  guncelle  veritabanında olup farklı olan kayıtları da bugünkü veriyle
            değiştirir: panelde yapılan değişiklikler kaybolur
            (verilmezse yalnızca olmayan kayıtlar eklenir, var olana dokunulmaz)
Ürün, haber, etkinlik ve anasayfa görselleri dosya deposuna kopyalanır;
dosya deposu tanımlı olmalı (DOSYA_KLASORU).`;

const args = process.argv.slice(2);
const target = args[0] as LoadTarget;
const mode: LoadMode = args.includes("guncelle") ? "tam" : "eksikler";
if (!["canli", "deneme"].includes(target) || args.slice(1).some((a) => a !== "guncelle")) {
  console.error(USAGE);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tanımlı değil (README › Veritabanı).");
  process.exit(1);
}
// Dosya deposu: goreli klasor sitenin klasorune (apps/zenweld-web) gore (sitedeki gibi).
const site = fileURLToPath(new URL("../../../apps/zenweld-web/", import.meta.url));
const folder = process.env.DOSYA_KLASORU;
const storage = fileStorageFromEnv({ DOSYA_KLASORU: folder && (isAbsolute(folder) ? folder : resolve(site, folder)) });
if (!storage) {
  console.error("Dosya deposu tanımlı değil (DOSYA_KLASORU): görseller depoya kopyalanamaz; hiçbir şey yüklenmedi (docs/SUNUCU.md › Dosya deposu).");
  process.exit(1);
}

const { hostname } = new URL(url);
const name = decodeURIComponent(new URL(url).pathname.slice(1));
const local = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

console.log(`Veritabanı: ${name} (${hostname})`);
console.log(
  `Yüklenecek: ${target === "canli" ? "canlı" : "deneme"} verisi · ${
    mode === "tam" ? "farklı olan kayıtlar güncellenir (panelde yapılan değişiklikler kaybolur)" : "yalnızca eksik kayıtlar eklenir"
  }`,
);
console.log(
  `Yüklenmeyecek: üyeler, siparişler, teklifler, iadeler, servis talepleri, garantiler${
    target === "canli" ? "; örnek yorumlar, kuponlar ve bayi stok listeleri" : ""
  }. Hiçbir kayıt silinmez.`,
);

if (!local) {
  if (!process.stdin.isTTY) {
    console.error("Bilgisayar dışındaki bir veritabanına yükleme onay ister; komutu bir terminalde çalıştırın.");
    process.exit(1);
  }
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`Onaylamak için veritabanının adını yazın (${name}): `);
  prompt.close();
  if (answer.trim() !== name) {
    console.error("Onaylanmadı; hiçbir şey yüklenmedi.");
    process.exit(1);
  }
}

// Gorseller once depoya; veritabani yuklemesi sonra (yarida kalirsa depoda fazladan dosya kalir, kayit degismez).
const images = await storeSiteImages(createSeedDatabase(), storage, (path) => readFile(join(site, "public", path)));
console.log(`Görseller: ${images.copied} dosya depoya kopyalandı, ${images.existing} dosya zaten depodaydı.`);

const { db, pool } = createDb(url);
try {
  const results = await db.transaction((tx) => loadData(tx, images.data, { target, mode }));
  const third = mode === "tam" ? "Değişmeyen" : "Zaten var";
  const width = Math.max(...results.map((r) => r.table.length), 5);
  const row = (cells: (string | number)[]) =>
    console.log(`  ${String(cells[0]).padEnd(width)}  ${cells.slice(1).map((c) => String(c).padStart(11)).join("  ")}`);
  console.log("");
  row(["Tablo", "Eklenen", "Güncellenen", third]);
  for (const r of results) row([r.table, r.added, r.updated, r.unchanged]);
  const total = (key: "added" | "updated" | "unchanged") => results.reduce((sum, r) => sum + r[key], 0);
  console.log(`\nYüklendi: ${total("added")} eklendi, ${total("updated")} güncellendi, ${total("unchanged")} ${third.toLocaleLowerCase("tr")}.`);
  console.log("Site değişikliği en geç 60 saniyede gösterir; hemen görmek için: npm run site:yenile");
} catch (error) {
  // Drizzle sorgu hatasini sarar; asil hata (PostgreSQL) cause'tadir.
  const cause = ((error as { cause?: unknown }).cause ?? error) as { code?: string; message?: string; constraint?: string };
  if (cause.code === "42P01") {
    console.error("Tablolar kurulmamış. Önce: npm run db:migrate");
  } else {
    console.error("Yükleme yarıda kaldı; veritabanında hiçbir şey değişmedi.");
    console.error(`  Hata: ${cause.message}${cause.constraint ? ` (${cause.constraint})` : ""}`);
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}

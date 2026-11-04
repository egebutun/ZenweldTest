import "./env";
import { createInterface } from "node:readline/promises";
import { createSeedDatabase } from "@zenweld/data";
import { createDb } from "../src/client";
import { loadData, type LoadMode, type LoadTarget } from "../src/load";

/**
 * npm run db:yukle <canli|deneme> [eksikler] — sitenin bugunku verisini
 * DATABASE_URL'deki veritabanina yukler (src/load.ts; KARARLAR K-91).
 * Bilgisayar disindaki bir veritabanina yuklemeden once veritabaninin adi
 * yazilarak onay verilir.
 */
const USAGE = `Kullanım: npm run db:yukle <canli|deneme> [eksikler]
  canli     katalog, içerik, mağaza ayarları, bayiler, satıcılar, depo stoğu
  deneme    bunlara ek olarak örnek yorumlar, kuponlar ve bayi stok listeleri
  eksikler  yalnızca veritabanında olmayan kayıtları ekler, var olana dokunmaz
            (verilmezse farklı olan kayıtlar da güncellenir)`;

const args = process.argv.slice(2);
const target = args[0] as LoadTarget;
const mode: LoadMode = args.includes("eksikler") ? "eksikler" : "tam";
if (!["canli", "deneme"].includes(target) || args.slice(1).some((a) => a !== "eksikler")) {
  console.error(USAGE);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL tanımlı değil (README › Veritabanı).");
  process.exit(1);
}
const { hostname } = new URL(url);
const name = decodeURIComponent(new URL(url).pathname.slice(1));
const local = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

console.log(`Veritabanı: ${name} (${hostname})`);
console.log(
  `Yüklenecek: ${target === "canli" ? "canlı" : "deneme"} verisi · ${
    mode === "tam" ? "farklı olan kayıtlar güncellenir" : "yalnızca eksik kayıtlar eklenir"
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

const { db, pool } = createDb(url);
try {
  const results = await db.transaction((tx) => loadData(tx, createSeedDatabase(), { target, mode }));
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

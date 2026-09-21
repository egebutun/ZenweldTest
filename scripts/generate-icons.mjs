/**
 * Favicon ve uygulama ikonlarini uretir.
 *
 * Kaynak: assets/brand-mark.svg (kare Zenweld isareti)
 * Cikti:  her iki uygulamanin src/app/ klasorune
 *           favicon.ico    (16/32/48 px — Safari dahil tum tarayicilar)
 *           icon.svg       (modern tarayicilar, her boyutta net)
 *           icon.png       (180 px yedek)
 *           apple-icon.png (180 px — iOS ana ekran)
 *
 * Calistirmak icin: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = dirname(new URL(import.meta.url).pathname).replace(/\/scripts$/, "");
const SOURCE = join(ROOT, "assets/brand-mark.svg");
const APPS = ["apps/zenweld-web/src/app", "apps/bayi-shop/src/app"];

const svg = readFileSync(SOURCE);

/** PNG bufferlarindan .ico dosyasi olusturur (ICO, PNG gomulmesini destekler). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // tip: ikon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, data } of entries) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palet yok
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // duzlem
    entry.writeUInt16LE(32, 6); // bit derinligi
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    dir.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

const png = (size) => sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const icoSizes = [16, 32, 48];
const icoEntries = [];
for (const size of icoSizes) {
  icoEntries.push({ size, data: await png(size) });
}
const ico = buildIco(icoEntries);
const icon180 = await png(180);

for (const appDir of APPS) {
  const target = join(ROOT, appDir);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, "favicon.ico"), ico);
  copyFileSync(SOURCE, join(target, "icon.svg"));
  writeFileSync(join(target, "icon.png"), icon180);
  writeFileSync(join(target, "apple-icon.png"), icon180);
  console.log("yazıldı:", appDir, "→ favicon.ico, icon.svg, icon.png, apple-icon.png");
}

console.log(`favicon.ico boyutu: ${ico.length} bayt (${icoSizes.join("/")} px)`);

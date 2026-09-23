/**
 * Public klasorundeki buyuk gorselleri web icin optimize eder.
 *
 *   node scripts/optimize-images.mjs
 *
 * Orijinal dosyalar silinmez; yaninda .webp surumu uretilir. Kod webp
 * surumunu kullanir, desteklemeyen tarayici otomatik olarak orijinale
 * duser (bkz. ProductImage).
 */
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";

/** Kart ve tablolarda en fazla ~300 px gosterildigi icin 800 px yeterli. */
const MAX_WIDTH = 800;
const QUALITY = 80;

const roots = [
  "apps/zenweld-web/public/images",
  "apps/bayi-shop/public/images",
];

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if ([".png", ".jpg", ".jpeg"].includes(extname(full).toLowerCase())) out.push(full);
  }
  return out;
}

let saved = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    const before = statSync(file).size;
    if (before < 40_000) continue; // kucuk dosyalar zaten sorun degil
    const target = join(dirname(file), `${basename(file, extname(file))}.webp`);
    const meta = await sharp(file).metadata();
    await sharp(file)
      .resize({ width: Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH), withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(target);
    const after = statSync(target).size;
    saved += before - after;
    console.log(
      `${file}\n  ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB  (${target})`,
    );
  }
}
console.log(`\nToplam kazanç: ${(saved / 1024).toFixed(0)} KB`);

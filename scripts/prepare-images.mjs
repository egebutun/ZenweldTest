/**
 * GORSELLERI YAYINA HAZIRLAR — ELLE CALISTIRMAYA GEREK YOK
 *
 * Bu betik "npm run build" oncesinde kendiliginden calisir (package.json
 * icindeki prebuild kancasi), dolayisiyla Vercel her dagitimda otomatik
 * uygular. GitHub'a yeni bir logo yuklediginizde ek bir islem gerekmez.
 *
 * Ne yapar: etkinlik logolarinin cevresindeki BOS kenari keser.
 *
 * Neden gerekli: logo dosyalarinin cogunda asil logonun etrafinda genis
 * bir bosluk var. Hepsi ayni olculu kutuya konunca, bosluk fazla olan
 * logolar ekranda kucuk goruluyor.
 *
 * ONEMLI KURAL — markanin kendi zemini kesilmez:
 * Yalnizca dort kosesi de BEYAZ ya da SEFFAF olan dosyalar kesilir.
 * Kosesi renkli olan (WIN Eurasia kirmizi, Riyadh koyu gri) dosyalara
 * dokunulmaz. Daha once bu ayrim yoktu ve WIN Eurasia'nin kendi kirmizi
 * zemini kirpilip yalnizca yazisi kaliyordu.
 *
 * Betik tekrar calistirilabilir: kesilecek bosluk kalmadiginda dosyaya
 * dokunmaz.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// sharp bulunamazsa dagitimi ASLA dusurme: gorseller depoda zaten
// hazirlanmis halde duruyor, betik yalnizca YENI eklenenler icin gerekli.
let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.log("sharp bulunamadi; gorsel hazirlama atlandi (yayin etkilenmez).");
  process.exit(0);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = [join(ROOT, "apps/zenweld-web/public/images/events")];

/** Piksel beyaz mi? */
const isWhite = (r, g, b) => r > 240 && g > 240 && b > 240;

/**
 * Dosyanin kenarinin kesilebilir olup olmadigini soyler.
 * Donen deger trim()'e verilecek arka plan, ya da kesilmeyecekse null.
 */
async function blankBackground(file) {
  const { width, height } = await sharp(file).metadata();
  if (!width || !height) return null;

  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  let transparent = false;

  for (const [left, top] of corners) {
    const { data } = await sharp(file)
      .ensureAlpha()
      .extract({ left, top, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const [r, g, b, a] = data;
    if (a < 10) {
      transparent = true;
      continue;
    }
    // Kose renkliyse bu logonun kendi zeminidir; dokunma.
    if (!isWhite(r, g, b)) return null;
  }

  return transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : "#ffffff";
}

let changed = 0;

for (const dir of DIRS) {
  let files;
  try {
    files = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  } catch {
    continue; // klasor yoksa sessizce gec
  }

  for (const file of files) {
    const path = join(dir, file);
    const before = await sharp(path).metadata();

    const background = await blankBackground(path);
    if (!background) {
      console.log(`  ${file}: kenari renkli, dokunulmadi`);
      continue;
    }

    let out;
    try {
      out = await sharp(path)
        .trim({ background, threshold: 18 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      console.log(`  ${file}: kesilecek bosluk yok`);
      continue;
    }

    const shrink = 1 - (out.info.width * out.info.height) / (before.width * before.height);
    if (shrink < 0.02) {
      console.log(`  ${file}: zaten kirpilmis`);
      continue;
    }

    const sizeBefore = statSync(path).size;
    writeFileSync(path, out.data);
    changed++;
    console.log(
      `  ${file}: ${before.width}x${before.height} -> ${out.info.width}x${out.info.height}` +
        ` (%${(shrink * 100).toFixed(0)} bosluk atildi, ` +
        `${(sizeBefore / 1024).toFixed(0)} KB -> ${(statSync(path).size / 1024).toFixed(0)} KB)`,
    );
  }
}

console.log(changed === 0 ? "Gorseller zaten hazir." : `${changed} dosya hazirlandi.`);

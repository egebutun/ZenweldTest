/**
 * ETKINLIK LOGOLARINDAKI BOS KENARLARI KESER
 *
 * Sorun: logo dosyalarinin cogunda, asil logonun etrafinda genis beyaz
 * bosluk var (WIN Eurasia'da dosyanin %86'si, Big 5'te %71'i bos).
 * Bu yuzden logolar ayni olculu kutuya konsa bile ekranda cok farkli
 * buyukluklerde gorunuyordu.
 *
 * Bu betik her logonun cevresindeki tek renk kenari kesip dosyayi
 * yeniden yazar. Boylece asil logo kutuyu doldurur ve hepsi ayni
 * agirlikta gorunur. Kutunun kendi ic boslugu (p-4) CSS'te duruyor.
 *
 * Calistirma:  node scripts/trim-event-logos.mjs
 * Yeni logo yuklendiginde tekrar calistirin.
 */
import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "apps/zenweld-web/public/images/events";
const files = readdirSync(DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

let changed = 0;

for (const file of files) {
  const path = join(DIR, file);
  const before = await sharp(path).metadata();

  let out;
  try {
    // threshold: kenardaki rengin ne kadar oynayabilecegi (jpg
    // sikistirmasi beyazi tam beyaz birakmiyor).
    out = await sharp(path).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
  } catch {
    console.log(`  ${file}: kesilecek kenar yok`);
    continue;
  }

  const shrink = 1 - (out.info.width * out.info.height) / (before.width * before.height);
  if (shrink < 0.02) {
    console.log(`  ${file}: zaten sinirina kadar kirpilmis`);
    continue;
  }

  const sizeBefore = statSync(path).size;
  writeFileSync(path, out.data);
  changed++;
  console.log(
    `  ${file}\n     ${before.width}x${before.height} -> ${out.info.width}x${out.info.height}` +
      `  (%${(shrink * 100).toFixed(0)} bosluk atildi, ` +
      `${(sizeBefore / 1024).toFixed(0)} KB -> ${(statSync(path).size / 1024).toFixed(0)} KB)`,
  );
}

console.log(`\n${changed} dosya guncellendi.`);

/**
 * MARKA GORSELLERI URETICI
 *
 * Bu betik iki sey uretir ve her iki uygulamanin public klasorune yazar:
 *
 *   1. /images/brand/og-cover.png   1200x630  — WhatsApp, LinkedIn, X, Slack
 *      onizleme karti. Baglanti paylasildiginda gorunen gorsel budur.
 *      Onceden portre formatinda bir urun fotografi kullaniliyordu; bu
 *      olcude her platform gorseli kirpiyor ve marka gorunmuyordu.
 *
 *   2. /images/brand/zenweld-logo.png  512px genislik — yapisal veride
 *      (schema.org Organization.logo) kullanilir. Arama motorlari ve
 *      paylasim onizlemeleri raster bicimi her zaman destekler.
 *
 * Calistirma:  node scripts/make-brand-images.mjs
 *
 * NOT: Bu ortamda Barlow Condensed yalnizca woff2 olarak var, librsvg ise
 * ttf/otf ister. Bu yuzden kart yazisi Liberation Sans ile cizilir. Marka
 * yazisi logo dosyasindan geldigi icin kartin kimligi dogru kalir.
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const APPS = ["zenweld-web", "bayi-shop"];

const INK = "#141619";
const RED = "#b82429";
const W = 1200;
const H = 630;

/** Logoyu istenen genislikte PNG'ye cevirir. */
async function renderLogo(width) {
  const svg = join(ROOT, "apps/zenweld-web/public/images/brand/zenweld-logo-light.svg");
  return sharp(svg, { density: 400 }).resize({ width }).png().toBuffer();
}

/** Kartin zemini: koyu yuzey + sol kenarda marka rengi serit + ince doku. */
function backgroundSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1b1e22"/>
      <stop offset="100%" stop-color="${INK}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`);
}

/**
 * Bayi kartindaki "BAYİ-A" eki.
 *
 * Ana sitede hicbir yazi yok, yalnizca logo var. Bayi sitesinin ana
 * sayfadaki logosu da logo + bayi adi seklinde oldugu icin kartta yalnizca
 * bu ek duruyor; aciklama satiri kaldirildi.
 */
function suffixSvg(suffix) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="80">
  <text x="0" y="52" font-family="Liberation Sans, DejaVu Sans, sans-serif"
        font-size="46" font-weight="bold" fill="#ffffff" letter-spacing="4">${suffix}</text>
</svg>`);
}

/**
 * Paylasim karti: koyu zemin uzerinde ortalanmis Zenweld logosu.
 * Sitenin ana sayfasindaki logonun aynisi kullanilir.
 */
async function buildCard({ app, logoWidth, suffix }) {
  const logo = await renderLogo(logoWidth);
  const { width: lw, height: lh } = await sharp(logo).metadata();

  const gap = 26;

  // Ek yaziyi once kirp, GERCEK yuksekligini olc; blok yuksekligini ona
  // gore hesapla. Sabit bir yukseklik varsaymak bloku yukari kaydiriyordu.
  const sx = suffix ? await sharp(suffixSvg(suffix)).trim().toBuffer() : null;
  const sm = sx ? await sharp(sx).metadata() : null;

  const blockH = lh + (sm ? gap + sm.height : 0);
  const top = Math.round((H - blockH) / 2);

  const layers = [{ input: logo, left: Math.round((W - lw) / 2), top }];

  if (sx && sm) {
    layers.push({
      input: sx,
      left: Math.round((W - sm.width) / 2),
      top: top + lh + gap,
    });
  }

  const image = await sharp(backgroundSvg())
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const out = join(ROOT, "apps", app, "public/images/brand/og-cover.png");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, image);
  console.log(`  og-cover.png  ${app}  ${(image.length / 1024).toFixed(0)} KB`);
}

/** Yapisal veri icin raster logo (koyu yazili, seffaf zemin). */
async function buildLogoPng() {
  const svg = join(ROOT, "apps/zenweld-web/public/images/brand/zenweld-logo.svg");
  const png = await sharp(svg, { density: 400 }).resize({ width: 512 }).png().toBuffer();
  for (const app of APPS) {
    const out = join(ROOT, "apps", app, "public/images/brand/zenweld-logo.png");
    await writeFile(out, png);
    console.log(`  zenweld-logo.png  ${app}  ${(png.length / 1024).toFixed(0)} KB`);
  }
}

console.log("Marka gorselleri uretiliyor...");
await buildCard({ app: "zenweld-web", logoWidth: 720 });
await buildCard({ app: "bayi-shop", logoWidth: 620, suffix: "BAYİ-A" });
await buildLogoPng();
console.log("Bitti.");

/* ------------------------------------------------------------------ */
/* Uygulama ikonlari (sekme, telefon ana ekrani, Apple)                */
/* ------------------------------------------------------------------ */

/**
 * Bu ikonlar onceden elle cizilmis bir "Z" isaretiydi — gercek Zenweld
 * logosuyla ilgisi yoktu. Artik gercek logodaki TAC isareti kirmizi
 * zemine yerlestirilerek uretiliyor.
 *
 * Neden tac: kare ikonda "zenweld" kelimesi 16 pikselde okunmuyor; tac
 * her olcude taninabiliyor ve gercek logonun parcasi.
 *
 * Tac, logo dosyasi icinde su kutuda: x 243-616, y 0-178 (1890x417 icinde).
 */
const CROWN = { left: 243, top: 0, width: 374, height: 179 };

async function crownOnRed(size) {
  const pad = Math.round(size * 0.18);
  const inner = size - pad * 2;

  // Once logoyu sabit olcude PNG'ye cevir, sonra tac kutusunu kes.
  // Tek zincirde resize+extract yapmak sharp'ta "bad extract area" veriyor.
  const flat = await sharp(
    join(ROOT, "apps/zenweld-web/public/images/brand/zenweld-logo-light.svg"),
    { density: 600 },
  )
    .resize({ width: 1890 })
    .png()
    .toBuffer();

  const crown = await sharp(flat)
    .extract(CROWN)
    .resize({ width: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const crownMeta = await sharp(crown).metadata();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0xb8, g: 0x24, b: 0x29, alpha: 1 },
    },
  })
    .composite([
      {
        input: crown,
        left: Math.round((size - crownMeta.width) / 2),
        top: Math.round((size - crownMeta.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** PNG tasiyan ICO kabi — tum modern tarayicilar destekler. */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // ayrilmis
  header.writeUInt16LE(1, 2); // tip: ikon
  header.writeUInt16LE(1, 4); // ikon sayisi

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // genislik
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // yukseklik
  entry.writeUInt8(0, 2); // palet yok
  entry.writeUInt8(0, 3); // ayrilmis
  entry.writeUInt16LE(1, 4); // renk duzlemi
  entry.writeUInt16LE(32, 6); // bit/piksel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

async function buildIcons() {
  const png512 = await crownOnRed(512);
  const png192 = await crownOnRed(192);
  const png180 = await crownOnRed(180); // Apple touch icon
  const png64 = await crownOnRed(64);

  for (const app of APPS) {
    const base = join(ROOT, "apps", app);
    await writeFile(join(base, "src/app/icon.png"), png512);
    await writeFile(join(base, "src/app/apple-icon.png"), png180);
    await writeFile(join(base, "src/app/favicon.ico"), pngToIco(png64, 64));
    await mkdir(join(base, "public/icons"), { recursive: true });
    await writeFile(join(base, "public/icons/icon-192.png"), png192);
    await writeFile(join(base, "public/icons/icon-512.png"), png512);
    console.log(`  ikonlar  ${app}  (icon.png, apple-icon.png, favicon.ico, 192, 512)`);
  }
}

await buildIcons();
console.log("Ikonlar bitti.");

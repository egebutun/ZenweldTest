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
  <rect x="0" y="0" width="14" height="${H}" fill="${RED}"/>
  <path d="M${W - 420} ${H} L${W} ${H - 300} L${W} ${H} Z" fill="${RED}" opacity="0.10"/>
  <path d="M${W - 250} ${H} L${W} ${H - 180} L${W} ${H} Z" fill="${RED}" opacity="0.14"/>
</svg>`);
}

/** Logonun altindaki aciklama satiri. */
function taglineSvg(text, suffix) {
  const suffixBlock = suffix
    ? `<text x="0" y="34" font-family="Liberation Sans, DejaVu Sans, sans-serif"
             font-size="40" font-weight="bold" fill="#ffffff" letter-spacing="3">${suffix}</text>
       <rect x="0" y="56" width="70" height="4" fill="${RED}"/>`
    : `<rect x="0" y="0" width="70" height="4" fill="${RED}"/>`;

  const y = suffix ? 104 : 44;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="140">
  ${suffixBlock}
  <text x="0" y="${y}" font-family="Liberation Sans, DejaVu Sans, sans-serif"
        font-size="27" fill="#c8cbd0" letter-spacing="0.6">${text}</text>
</svg>`);
}

async function buildCard({ app, logoWidth, tagline, suffix }) {
  const logo = await renderLogo(logoWidth);
  const logoMeta = await sharp(logo).metadata();

  const left = 96;
  const logoTop = suffix ? 196 : 232;

  const image = await sharp(backgroundSvg())
    .composite([
      { input: logo, left, top: logoTop },
      {
        input: taglineSvg(tagline, suffix),
        left,
        top: logoTop + logoMeta.height + 34,
      },
    ])
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
await buildCard({
  app: "zenweld-web",
  logoWidth: 620,
  tagline: "KAYNAK MAKİNELERİ  ·  PLAZMA KESME  ·  KAYNAK EKİPMANLARI",
});
await buildCard({
  app: "bayi-shop",
  logoWidth: 520,
  suffix: "BAYİ-A",
  tagline: "YETKİLİ ZENWELD BAYİSİ  ·  ONLINE SATIŞ",
});
await buildLogoPng();
console.log("Bitti.");

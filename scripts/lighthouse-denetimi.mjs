import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { PAGES } from "./olcum-sayfalari.mjs";

/**
 * LIGHTHOUSE DENETIMI (docs/YAPILACAKLAR.md › Ölçüm (hız) 11)
 *
 *   node scripts/lighthouse-denetimi.mjs <site adresi> [--telefon | --masaustu] [--sayfa /yol …]
 *   ornek: node scripts/lighthouse-denetimi.mjs http://localhost:3000
 *
 * Google'in denetim araci Lighthouse ile sitenin butun sayfa turleri
 * (olcum-sayfalari.mjs) telefon ve masaustu kosullarinda dort baslikta
 * puanlanir: performans, erisilebilirlik, en iyi uygulamalar, SEO. Altinda
 * gecemeyen denetimler ve hangi sayfalarda gecemedikleri yazar.
 *
 * Lighthouse ilk kez gelen ziyaretci gibi acar (cerez bandi ve karsilama
 * penceresi gorunur). Tarayici: CHROME_PATH (yoksa Playwright'in Chromium'u).
 * Raporlarin tamami (JSON) gecici klasore yazilir; yolu en sonda yazar.
 */
const LIGHTHOUSE = "lighthouse@13.5.0";
const CATEGORIES = { performance: "Performans", accessibility: "Erişilebilirlik", "best-practices": "En iyi uygulamalar", seo: "SEO" };

const args = process.argv.slice(2);
const site = args.find((a) => /^https?:\/\//.test(a))?.replace(/\/$/, "");
const chosen = args.flatMap((a, i) => (args[i - 1] === "--sayfa" ? [a] : []));
if (!site) {
  console.error("Kullanım: node scripts/lighthouse-denetimi.mjs <site adresi> [--telefon | --masaustu] [--sayfa /yol …]");
  process.exit(1);
}
const devices = [
  ["telefon", "Telefon", []],
  ["masaustu", "Masaüstü", ["--preset=desktop"]],
].filter(([key]) => (args.includes("--telefon") ? key === "telefon" : args.includes("--masaustu") ? key === "masaustu" : true));
const pages = chosen.length ? PAGES.filter(([, path]) => chosen.includes(path)) : PAGES;

const folder = join(tmpdir(), `lighthouse-${Date.now()}`);
mkdirSync(folder, { recursive: true });
const chrome = process.env.CHROME_PATH || chromium.executablePath();

/** Gecemeyen denetim: puani 0,9'un altinda olan (bilgi ve elle kontrol denetimleri haric). */
const failed = (audit) => audit.score !== null && audit.score < 0.9 && !["notApplicable", "manual", "informative"].includes(audit.scoreDisplayMode);

for (const [key, label, flags] of devices) {
  const problems = new Map();
  console.log(`\n### ${label}\n`);
  console.log(`| Sayfa | ${Object.values(CATEGORIES).join(" | ")} |`);
  console.log(`|---|${Object.values(CATEGORIES).map(() => "---").join("|")}|`);
  for (const [name, path] of pages) {
    const file = join(folder, `${key}-${path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "anasayfa"}.json`);
    process.stderr.write(`${label} · ${name}\n`);
    execFileSync(
      "npx",
      [
        "-y",
        LIGHTHOUSE,
        site + path,
        "--output=json",
        `--output-path=${file}`,
        "--quiet",
        "--locale=tr",
        "--chrome-flags=--headless=new --no-sandbox",
        `--only-categories=${Object.keys(CATEGORIES).join(",")}`,
        ...flags,
      ],
      { env: { ...process.env, CHROME_PATH: chrome }, stdio: ["ignore", "ignore", "inherit"] },
    );
    const report = JSON.parse(readFileSync(file, "utf8"));
    const scores = Object.keys(CATEGORIES).map((id) => {
      const score = Math.round((report.categories[id]?.score ?? 0) * 100);
      return score < 90 ? `**${score}**` : String(score);
    });
    console.log(`| ${name} | ${scores.join(" | ")} |`);
    for (const [id, category] of Object.entries(report.categories)) {
      for (const ref of category.auditRefs) {
        const audit = report.audits[ref.id];
        if (!audit || !failed(audit)) continue;
        const entry = problems.get(ref.id) ?? { title: audit.title, category: CATEGORIES[id], pages: [], detail: audit.displayValue ?? "" };
        entry.pages.push(name);
        problems.set(ref.id, entry);
      }
    }
  }
  console.log(`\nGeçemeyen denetimler (${label}):\n`);
  console.log("| Başlık | Denetim | Sayfalar |");
  console.log("|---|---|---|");
  for (const entry of [...problems.values()].sort((a, b) => b.pages.length - a.pages.length)) {
    console.log(`| ${entry.category} | ${entry.title} | ${entry.pages.length === pages.length ? "hepsi" : entry.pages.join(", ")} |`);
  }
}
console.log(`\nRaporlar: ${folder}`);

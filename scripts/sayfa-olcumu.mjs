import { chromium } from "@playwright/test";

/**
 * SAYFA BOYUTU VE HIZ OLCUMU (Asama 3.7)
 *
 *   node scripts/sayfa-olcumu.mjs <site adresi> [<ikinci site adresi> …]
 *   ornek: node scripts/sayfa-olcumu.mjs http://localhost:3000 http://localhost:3100
 *
 * Her sayfa bos onbellekle 3 kez acilir, ortanca deger yazilir. Kosullar
 * Google'in mobil olcumundeki gibidir (Lighthouse): yavas 4G (150 ms gecikme,
 * 1,6 Mbit/sn) ve 4 kat yavaslatilmis islemci. Boyutlar sikistirilmis
 * (agdan inen) boyuttur. Haritanin parcalari gibi dis adresler sayilmaz.
 */
const PAGES = [
  ["Anasayfa", "/"],
  ["Kategori", "/ekipmanlar/kaynak-makineleri"],
  ["Ürün", "/urun/evomig-205-p"],
  ["Sepet", "/sepet"],
];
const RUNS = 3;
const sites = process.argv.slice(2);
if (sites.length === 0) {
  console.error("Kullanım: node scripts/sayfa-olcumu.mjs <site adresi> [<ikinci site adresi> …]");
  process.exit(1);
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const kb = (bytes) => Math.round(bytes / 1024);

async function measure(browser, url) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, locale: "tr-TR" });
  // Cerez bandi ve karsilama penceresi olcumu degistirmesin (tekrar gelen ziyaretci).
  await context.addInitScript(() => {
    try {
      localStorage.setItem("zenweld.cookie-consent.v1", JSON.stringify({ choice: "all", at: "olcum" }));
      sessionStorage.setItem("zenweld.welcome.seen", "1");
    } catch {
      /* yok say */
    }
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const origin = new URL(url).origin;
  const bytes = { document: 0, script: 0, total: 0 };
  const pending = [];
  page.on("response", (response) => {
    if (!response.url().startsWith(origin)) return;
    pending.push(
      response
        .request()
        .sizes()
        .then((s) => {
          const size = s.responseBodySize + s.responseHeadersSize;
          const type = response.request().resourceType();
          if (type === "document") bytes.document += size;
          if (type === "script") bytes.script += size;
          bytes.total += size;
        })
        .catch(() => {}),
    );
  });

  await page.goto(url, { waitUntil: "load", timeout: 120_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  const timing = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const nav = performance.getEntriesByType("navigation")[0];
        let lcp = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve({ ttfb: nav.responseStart, lcp }), 500);
      }),
  );
  await Promise.all(pending);
  await context.close();
  return { ...bytes, ...timing };
}

const browser = await chromium.launch();
console.log("| Sayfa | Site | Sayfanın kendisi (KB) | JavaScript (KB) | Toplam (KB) | İlk bayt (ms) | En büyük içerik (LCP, ms) |");
console.log("|---|---|---|---|---|---|---|");
for (const [name, path] of PAGES) {
  for (const site of sites) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await measure(browser, site + path));
    const m = (key) => median(runs.map((r) => r[key]));
    console.log(
      `| ${name} | ${site} | ${kb(m("document"))} | ${kb(m("script"))} | ${kb(m("total"))} | ${Math.round(m("ttfb"))} | ${Math.round(m("lcp"))} |`,
    );
  }
}
await browser.close();

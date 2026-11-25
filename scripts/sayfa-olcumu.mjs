import { chromium } from "@playwright/test";

/**
 * SAYFA HIZI OLCUMU (docs/YAPILACAKLAR.md › Ölçüm (hız))
 *
 *   node scripts/sayfa-olcumu.mjs <site adresi> [<ikinci site adresi> …] [--telefon | --masaustu] [--sayfa /yol …]
 *   ornek: node scripts/sayfa-olcumu.mjs http://localhost:3000 http://localhost:3100
 *
 * Google'in sayfa deneyimi olculeri (Core Web Vitals) ve sayfanin agirligi,
 * sitenin butun sayfa turlerinde, telefon ve masaustu kosullarinda:
 * - En buyuk icerik (LCP): sayfanin ana gorselinin ya da yazisinin gorundugu
 *   an. Iyi: 2,5 sn alti.
 * - Sayfa kaymasi (CLS): yuklenirken iceriklerin yer degistirmesi. Iyi: 0,1 alti.
 * - Kilitlenme (TBT): kodun ekrani kilitledigi sure (50 ms'yi asan uzun
 *   islerin asan kismi). Gercek ziyaretcide INP'nin laboratuvar karsiligi.
 *   Iyi: 200 ms alti.
 * Ayrica ilk bayt, sitenin kendi dosyalari (sayfa, JavaScript, toplam), dis
 * adreslerden inenler (harita parcalari, YouTube kapaklari), istek sayisi,
 * onceden yuklenen sayfa sayisi ve en buyuk icerigin ne oldugu.
 *
 * Kosullar Google'in olcumundeki gibidir (Lighthouse):
 * - Telefon: 412x823, yavas 4G (150 ms gecikme, 1,6 Mbit/sn), 4 kat
 *   yavaslatilmis islemci.
 * - Masaustu: 1350x940, 40 ms gecikme, 10 Mbit/sn, islemci yavaslatilmaz.
 * Her sayfa bos onbellekle 3 kez acilir, ortanca deger yazilir. Boyutlar
 * sikistirilmis (agdan inen) boyuttur. Siniri asan deger kalin yazilir.
 */
const PAGES = [
  ["Anasayfa", "/"],
  ["Grup (Kaynak Makineleri)", "/ekipmanlar/kaynak-makineleri"],
  ["Kategori (ürün listesi)", "/ekipmanlar/kaynak-makineleri/mig-gazalti-kaynak-makineleri"],
  ["Ürün", "/urun/evomig-205-p"],
  ["Blog yazısı", "/blog/mig-kaynaginda-gaz-secimi"],
  ["Haber", "/haberler/zenweld-izmir-uretim-tesisi-acildi"],
  ["Etkinlik", "/etkinlikler/win-eurasia-2026"],
  ["Videolar", "/videolar"],
  ["Force", "/force"],
  ["Bayi ve servis ağı", "/yetkili-bayi-ve-servis-agi"],
  ["Hakkımızda", "/hakkimizda"],
  ["Sepet", "/sepet"],
];

const DEVICES = {
  telefon: {
    label: "Telefon",
    context: {
      viewport: { width: 412, height: 823 },
      deviceScaleFactor: 1.75,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    },
    network: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
    cpu: 4,
  },
  masaustu: {
    label: "Masaüstü",
    context: { viewport: { width: 1350, height: 940 }, deviceScaleFactor: 1 },
    network: { latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (10 * 1024 * 1024) / 8 },
    cpu: 1,
  },
};

/** Google'in "iyi" sinirlari. */
const LIMITS = { lcp: 2500, cls: 0.1, tbt: 200 };
const RUNS = 3;

const args = process.argv.slice(2);
const sites = args.filter((a) => /^https?:\/\//.test(a)).map((a) => a.replace(/\/$/, ""));
const onlyPhone = args.includes("--telefon");
const onlyDesktop = args.includes("--masaustu");
const chosen = args.flatMap((a, i) => (args[i - 1] === "--sayfa" ? [a] : []));
if (sites.length === 0) {
  console.error("Kullanım: node scripts/sayfa-olcumu.mjs <site adresi> [<ikinci site adresi> …] [--telefon | --masaustu] [--sayfa /yol …]");
  process.exit(1);
}
const devices = Object.entries(DEVICES).filter(([key]) => (onlyPhone ? key === "telefon" : onlyDesktop ? key === "masaustu" : true));
const pages = chosen.length ? PAGES.filter(([, path]) => chosen.includes(path)).concat(chosen.filter((p) => !PAGES.some(([, path]) => path === p)).map((p) => [p, p])) : PAGES;

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const kb = (bytes) => Math.round(bytes / 1024);
const mark = (value, limit, text = String(value)) => (value > limit ? `**${text}**` : text);

async function measure(browser, url, device) {
  const context = await browser.newContext({ ...device.context, locale: "tr-TR" });
  await context.addInitScript(() => {
    // Cerez bandi ve karsilama penceresi olcumu degistirmesin (tekrar gelen ziyaretci).
    try {
      localStorage.setItem("zenweld.cookie-consent.v1", JSON.stringify({ choice: "all", at: "olcum" }));
      sessionStorage.setItem("zenweld.welcome.seen", "1");
    } catch {
      /* yok say */
    }
    // Olculer sayfanin kodu calismadan once dinlenir.
    const m = { lcp: 0, lcpElement: "", cls: 0, tbt: 0 };
    window.__olcum = m;
    const describe = (el) => {
      if (!el) return "";
      const src = el.getAttribute?.("src") || el.currentSrc || "";
      const text = (el.textContent || "").trim().replace(/\s+/g, " ");
      return `${el.tagName.toLowerCase()} ${src ? src.split("?")[0] : `"${text.slice(0, 40)}"`}`;
    };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        m.lcp = e.startTime;
        m.lcpElement = describe(e.element);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) m.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) m.tbt += Math.max(0, e.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...device.network });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: device.cpu });

  const origin = new URL(url).origin;
  const bytes = { document: 0, script: 0, total: 0, external: 0 };
  const counts = { requests: 0, prefetch: 0 };
  const pending = [];
  page.on("request", (request) => {
    counts.requests++;
    // Next.js'in onceden yukledigi sayfalar (baglantilar ekranda gorununce).
    if (request.headers()["next-router-prefetch"]) counts.prefetch++;
  });
  page.on("response", (response) => {
    const own = response.url().startsWith(origin);
    pending.push(
      response
        .request()
        .sizes()
        .then((s) => {
          const size = s.responseBodySize + s.responseHeadersSize;
          if (!own) {
            bytes.external += size;
            return;
          }
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
  // Sonradan dolan bolumlerin kaymasi ve gec isler de sayilsin.
  await page.waitForTimeout(1500);
  const result = await page.evaluate(() => ({
    ...window.__olcum,
    ttfb: performance.getEntriesByType("navigation")[0]?.responseStart ?? 0,
  }));
  await Promise.all(pending);
  await context.close();
  return { ...bytes, ...counts, ...result };
}

const browser = await chromium.launch();
for (const [key, device] of devices) {
  console.log(`\n### ${device.label}\n`);
  console.log(
    "| Sayfa | Site | En büyük içerik (LCP, ms) | Sayfa kayması (CLS) | Kilitlenme (TBT, ms) | İlk bayt (ms) | Sayfa (KB) | JavaScript (KB) | Toplam (KB) | Dış adresler (KB) | İstek | Önceden yüklenen | En büyük içerik |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const [name, path] of pages) {
    for (const site of sites) {
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        process.stderr.write(`${device.label} · ${name} · ${site} · ${i + 1}/${RUNS}\n`);
        runs.push(await measure(browser, site + path, device));
      }
      const m = (field) => median(runs.map((r) => r[field]));
      const lcp = Math.round(m("lcp"));
      const cls = Math.round(m("cls") * 1000) / 1000;
      const tbt = Math.round(m("tbt"));
      const element = runs.find((r) => Math.round(r.lcp) === lcp)?.lcpElement ?? runs[0].lcpElement;
      console.log(
        `| ${name} | ${site} | ${mark(lcp, LIMITS.lcp)} | ${mark(cls, LIMITS.cls, cls.toFixed(3))} | ${mark(tbt, LIMITS.tbt)} | ${Math.round(m("ttfb"))} | ${kb(m("document"))} | ${kb(m("script"))} | ${kb(m("total"))} | ${kb(m("external"))} | ${m("requests")} | ${m("prefetch")} | ${element} |`,
      );
    }
  }
  if (key === "telefon" && !onlyPhone && devices.length > 1) process.stderr.write("\n");
}
console.log(`\nİyi sınırlar (Google): LCP ${LIMITS.lcp} ms, CLS ${LIMITS.cls}, TBT ${LIMITS.tbt} ms altı. Kalın: sınırın üstünde.`);
await browser.close();

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test as base, expect, type Page } from "@playwright/test";
import type { ZenweldDatabase } from "@zenweld/data";

/**
 * TARAYICI TESTLERI ICIN ORTAK PARCALAR
 */

/**
 * Demo hesabin e-posta ve sifresi. Bu bilgiler yalnizca README'de durur
 * (CLAUDE.md); testler her calistirmada README'deki tablodan okur.
 */
export function demoAccount(role: "Yönetici" | "Bireysel" | "Kurumsal"): { email: string; password: string } {
  const readme = readFileSync(resolve(__dirname, "../../README.md"), "utf8");
  const row = readme.split("\n").find((line) => line.startsWith(`| **${role}** |`));
  const [email, password] = [...(row ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (!email || !password) throw new Error(`README'de ${role} hesabı bulunamadı (Demo Hesaplar tablosu)`);
  return { email, password };
}

/** Girisli oturumlarin saklandigi dosyalar (giris.kurulum.ts uretir; GitHub'a gitmez). */
export const SESSION = {
  member: "tests/e2e/.oturum/uye.json",
  admin: "tests/e2e/.oturum/yonetici.json",
};

/**
 * Her sayfada: cerez bandi ve karsilama penceresi kapali gelir (testi
 * ortmesin); sayfa hatalari ve guvenlik politikasi (CSP) ihlalleri toplanir.
 */
export const test = base.extend<{ problems: string[] }>({
  context: async ({ context }, provide) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem("zenweld.cookie-consent.v1", JSON.stringify({ choice: "all", at: "test" }));
        sessionStorage.setItem("zenweld.welcome.seen", "1");
      } catch {
        /* cerceve icindeki dis sayfalarda depo yok */
      }
    });
    await provide(context);
  },
  problems: async ({ page }, provide) => {
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(`JS hatası: ${e.message}`));
    page.on("console", (m) => {
      if (/Content Security Policy/.test(m.text())) problems.push(`CSP: ${m.text().slice(0, 200)}`);
    });
    await provide(problems);
  },
});

export { expect };

/** Tarayicidaki veritabanini (localStorage) okur. */
export async function readDb(page: Page): Promise<ZenweldDatabase> {
  // Ilk acilista site ornek veriyi sayfa yuklendikten sonra yazar.
  await page.waitForFunction(() => localStorage.getItem("zenweld.db.v1") !== null);
  return page.evaluate(() => JSON.parse(localStorage.getItem("zenweld.db.v1")!));
}

/**
 * Veritabaninda degisiklik yapip sayfayi yeniler. Degisiklik testte yapilir,
 * sonuc sayfaya yazilir (sayfanin guvenlik politikasi metinden kod
 * calistirmaya izin vermez).
 */
export async function changeDb(page: Page, change: (db: ZenweldDatabase) => void): Promise<void> {
  const db = await readDb(page);
  change(db);
  await page.evaluate((json) => localStorage.setItem("zenweld.db.v1", json), JSON.stringify(db));
  await page.reload();
}

/**
 * Seceneksiz bir ekipmana yalnizca bu tarayicida gecerli iki deneme secenegi
 * kurar (ornek veriden bagimsiz; urunlerin gercek secenekleri testlerin
 * konusu degildir): Deneme Soğutma (Hava / Su) ve Deneme Uzunluk (3 m / 4 m).
 * Varyantlar: Hava · 3 m (ZW-E2E-H3), Hava · 4 m (ZW-E2E-H4), Su · 4 m
 * (ZW-E2E-S4); "Su · 3 m" satilmaz. Su kombinasyonunun kendi fotografi var.
 * Uc kombinasyonun da Zenweld deposunda (SAP) stogu vardir.
 */
export const TEST_PHOTO = {
  hava: "/images/categories/mma-ortulu-elektrod-kaynak-makineleri.svg",
  su: "/images/products/ultimate-405-mts-su-sogutmali.webp",
};

export async function addTestOptions(page: Page, slug: string): Promise<void> {
  await changeDb(page, (db) => {
    db.optionDefinitions.push(
      {
        id: "e2e-sogutma",
        name: "Deneme Soğutma",
        values: [
          { id: "hava", label: "Hava Soğutmalı" },
          { id: "su", label: "Su Soğutmalı" },
        ],
      },
      {
        id: "e2e-uzunluk",
        name: "Deneme Uzunluk",
        values: [
          { id: "3-m", label: "3 m" },
          { id: "4-m", label: "4 m" },
        ],
      },
    );
    const product = db.products.find((p) => p.slug === slug)!;
    product.images = [
      { url: TEST_PHOTO.hava, alt: "Hava" },
      { url: TEST_PHOTO.su, alt: "Su" },
    ];
    const row = (cooling: string, length: string, sku: string) => ({
      id: `${cooling}_${length}`,
      values: { "e2e-sogutma": cooling, "e2e-uzunluk": length },
      sku,
      priceDeltaExVat: 0,
      ...(cooling === "su" ? { image: TEST_PHOTO.su } : {}),
    });
    product.options = {
      optionIds: ["e2e-sogutma", "e2e-uzunluk"],
      variants: [row("hava", "3-m", "ZW-E2E-H3"), row("hava", "4-m", "ZW-E2E-H4"), row("su", "4-m", "ZW-E2E-S4")],
    };
    const syncedAt = new Date().toISOString();
    for (const sapItemCode of ["ZW-E2E-H3", "ZW-E2E-H4", "ZW-E2E-S4"]) {
      db.warehouseStock.push({ sapItemCode, quantity: 5, syncedAt });
    }
  });
}

/** Zenweld depo stogunu (SAP) ayarlar: kalem kodu -> adet; satiri yoksa eklenir. */
export async function setWarehouseStock(page: Page, quantities: Record<string, number>): Promise<void> {
  await changeDb(page, (db) => {
    for (const [sapItemCode, quantity] of Object.entries(quantities)) {
      const row = db.warehouseStock.find((r) => r.sapItemCode === sapItemCode);
      if (row) row.quantity = quantity;
      else db.warehouseStock.push({ sapItemCode, quantity, syncedAt: new Date().toISOString() });
    }
  });
}

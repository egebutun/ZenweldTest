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

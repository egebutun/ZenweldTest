import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { categoryHref, createSeedDatabase, groupHref } from "@zenweld/data";
import list from "../../apps/zenweld-web/eski-site-yonlendirmeleri.json";

/*
 * ESKI SITENIN ADRESLERI (KARARLAR K-121; docs/SEO.md › 15)
 *
 * Eski zenweld.com'un adresleri next.config.mjs'de yeni sitedeki
 * karsiliklarina 301 ile yonlenir. Liste kodda
 * apps/zenweld-web/eski-site-yonlendirmeleri.json'da, belgede
 * docs/seo/yonlendirme-listesi.csv'dedir. Bu test ikisinin ayni oldugunu ve
 * her hedefin yeni sitede gercekten var oldugunu denetler: urun linki ya da
 * secenegi, kategori, haber ya da etkinlik linki degisirse burada yakalanir.
 */

const root = new URL("../../", import.meta.url);
const db = createSeedDatabase(Date.now());

/** Belgedeki tablo (tirnak icinde virgul olabilir). */
function csvRows(): Record<string, string>[] {
  const text = readFileSync(new URL("docs/seo/yonlendirme-listesi.csv", root), "utf8").trim();
  const parse = (line: string) => [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((m) => m[1].replace(/^"|"$/g, "").replace(/""/g, '"')).slice(0, -1);
  const [head, ...lines] = text.split("\n");
  const keys = parse(head);
  return lines.map((line) => Object.fromEntries(parse(line).map((value, i) => [keys[i], value])));
}

/** Yeni sitede bu adreste sayfa var mi (urun ve secenek, kategori, haber, etkinlik, sabit sayfa)? */
function existsOnNewSite(address: string): boolean {
  const [path, query] = address.split("?");
  const product = path.match(/^\/urun\/([^/]+)$/);
  if (product) {
    const p = db.products.find((x) => x.active && x.slug === product[1]);
    if (!p) return false;
    if (!query) return true;
    const variant = new URLSearchParams(query).get("secenek");
    return Boolean(p.options?.variants.some((v) => v.id === variant));
  }
  if (query) return false;
  const news = path.match(/^\/haberler\/([^/]+)$/);
  if (news) return db.news.some((n) => n.active && n.slug === news[1]);
  const event = path.match(/^\/etkinlikler\/([^/]+)$/);
  if (event) return db.events.some((e) => e.active && e.slug === event[1]);
  if (db.categories.some((c) => categoryHref(c) === path)) return true;
  if (db.categoryGroups.some((g) => groupHref(g) === path)) return true;
  // Sabit sayfa: uygulamada bu adresin sayfa dosyasi var.
  return existsSync(new URL(`apps/zenweld-web/src/app/(site)${path}/page.tsx`, root));
}

describe("eski sitenin adresleri", () => {
  it("koddaki liste belgedeki tabloyla aynı (aynı adreste kalanlar yönlendirilmez)", () => {
    const rows = csvRows();
    expect(rows).toHaveLength(85);
    const expected = rows.filter((r) => r.eski_adres !== r.yeni_adres).map((r) => ({ eski: r.eski_adres, yeni: r.yeni_adres }));
    expect(list).toEqual(expected);
  });

  it("her hedef yeni sitede var (ürün ve seçeneği, kategori, haber, etkinlik, sabit sayfa)", () => {
    expect(list.filter(({ yeni }) => !existsOnNewSite(yeni)).map(({ yeni }) => yeni)).toEqual([]);
  });

  it("eski adres yeni sitede bir sayfa değil; zincir ve döngü yok; her eski adres bir kez", () => {
    const sources = list.map(({ eski }) => eski);
    expect(new Set(sources).size).toBe(sources.length);
    expect(sources.filter((s) => existsOnNewSite(s))).toEqual([]);
    expect(list.filter(({ yeni }) => sources.includes(yeni.split("?")[0]))).toEqual([]);
  });

  it("örnek: su soğutmalı eski sayfa aynı ürünün su soğutmalı seçeneğine gider", () => {
    const find = (eski: string) => list.find((r) => r.eski === eski)?.yeni;
    expect(find("/urunler/argon-kaynak-makineleri-dc/ultimate-320-thp")).toBe("/urun/ultimate-320-thp-ipanel?secenek=hava_4-m");
    expect(find("/urunler/argon-kaynak-makineleri-dc/ultimate-320-thp-su-sogutmali-arabali")).toBe(
      "/urun/ultimate-320-thp-ipanel?secenek=su_4-m",
    );
  });
});

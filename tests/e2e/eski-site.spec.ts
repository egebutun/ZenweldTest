import list from "../../apps/zenweld-web/eski-site-yonlendirmeleri.json";
import { expect, test } from "./yardimci";

/**
 * ESKI SITENIN ADRESLERI (KARARLAR K-121; docs/SEO.md › 15)
 *
 * Eski zenweld.com'un her adresi yeni sitedeki karsiligina 301 ile gider;
 * eski adresteki diger parametreler korunur. Hedeflerin yeni sitede var
 * oldugunu tests/unit/eski-site-yonlendirmeleri.test.ts denetler; burada
 * sunucunun cevabi ve tarayicinin vardigi sayfa denenir.
 */
test("eski adresler 301 ile yeni karşılığına gider; seçenekli ürün seçenekle açılır", async ({ page, request }) => {
  for (const { eski, yeni } of list) {
    const answer = await request.get(eski, { maxRedirects: 0 });
    const location = new URL(answer.headers()["location"] ?? "", "http://site");
    expect([answer.status(), location.pathname + location.search], eski).toEqual([301, yeni]);
  }
  const utm = await request.get("/urunler/elektrot-kaynak-makineleri/ultimate-255?utm_source=eposta", { maxRedirects: 0 });
  expect(new URL(utm.headers()["location"], "http://site").search).toBe("?utm_source=eposta");

  await page.goto("/urunler/argon-kaynak-makineleri-dc/ultimate-320-thp-su-sogutmali-arabali");
  await expect(page).toHaveURL(/\/urun\/ultimate-320-thp-ipanel\?secenek=su_4-m$/);
  await expect(page.getByRole("button", { name: "Su Soğutmalı", exact: true })).toHaveAttribute("aria-pressed", "true");
});

import type { Page } from "@playwright/test";
import { tr } from "@zenweld/i18n";
import { demoAccount } from "../e2e/yardimci";
import { closeDatabase, expect, newVisitor, registerMember, sql, test } from "./yardimci";

/**
 * PANEL › UYELER VERITABANINDA (Asama 5, 6. alan; KARARLAR K-35, K-36, K-99)
 *
 * Uyeler ekrani veritabanindaki hesaplari gosterir; rol ve durum
 * degisikligi ve silme sunucuya yazilir ve islem kaydina duser. Askiya
 * alinan uye siteye giremez. Yonetici kendi rolunu degistiremez.
 */
test.describe.configure({ mode: "serial" });

const admin = demoAccount("Yönetici");
const stamp = Date.now();
const MEMBER = { email: `panel-uye-${stamp}@ornek.com`, password: "DenemeSifre123" };

async function panelLogin(page: Page) {
  await page.goto("/yonetim/giris");
  await page.fill("#admin-email", admin.email);
  await page.fill("#admin-password", admin.password);
  await page.locator("form button[type=submit]").click();
  await expect(page.getByRole("button", { name: "Çıkış" })).toBeVisible();
}

const memberRow = async () => (await sql<{ id: string; role: string; status: string }>("SELECT id, role, status FROM users WHERE email = $1", [MEMBER.email]))[0];

test.afterAll(async () => {
  await sql("DELETE FROM users WHERE email = $1", [MEMBER.email]);
  await closeDatabase();
});

test("üye: rolü ve durumu değişir (askıdaki üye giremez); silinir; işlem kaydında", async ({ page, request, browser }) => {
  await registerMember(request, MEMBER.email, MEMBER.password);
  const { id } = await memberRow();
  await panelLogin(page);
  await page.goto("/yonetim/uyeler");
  await page.getByPlaceholder("İsim, e-posta veya firma ara…").fill(MEMBER.email);
  const row = page.locator("tr", { hasText: MEMBER.email });
  await expect(row).toHaveCount(1);

  await row.locator("select").selectOption("business");
  await expect.poll(async () => (await memberRow()).role).toBe("business");
  // Hemen ardindan durum: kendi kaydi uyari vermez.
  await row.getByRole("button", { name: "Askıya al" }).click();
  await expect(row.getByText("Askıda", { exact: true })).toBeVisible();
  expect(await memberRow()).toMatchObject({ role: "business", status: "suspended" });
  await expect(page.getByText(tr.panel.staleRecord)).toHaveCount(0);

  // Askidaki uye siteye giremez.
  const login = await (await newVisitor(browser)).request.post("/api/uyelik/giris", { data: { email: MEMBER.email, password: MEMBER.password } });
  expect(login.ok()).toBe(false);

  await row.getByRole("button", { name: "Aktifleştir" }).click();
  await expect(row.getByText("Aktif", { exact: true })).toBeVisible();

  page.once("dialog", (d) => {
    expect(d.message()).toBe(`${MEMBER.email} silinsin mi?`);
    void d.accept();
  });
  await row.getByTitle("Sil").click();
  await expect(row).toHaveCount(0);
  expect(await memberRow()).toBeUndefined();
  const audit = await sql<{ action: string }>("SELECT action FROM audit_log WHERE entity_type = 'users' AND entity_id = $1 ORDER BY id", [id]);
  expect(audit.map((a) => a.action)).toEqual(["update", "update", "update", "delete"]);
});

test("yönetici kendi rolünü değiştiremez; yönetici silinemez", async ({ page }) => {
  await panelLogin(page);
  await page.goto("/yonetim/uyeler");
  await page.getByPlaceholder("İsim, e-posta veya firma ara…").fill(admin.email);
  const row = page.locator("tr", { hasText: admin.email });
  await expect(row.locator("select")).toBeDisabled();
  await expect(row.getByRole("button", { name: "Askıya al" })).toHaveCount(0);
  await expect(row.getByTitle("Sil")).toBeDisabled();
});

test("oturumsuz üye isteği reddedilir", async ({ request }) => {
  const answer = await request.post("/api/yonetim/uyeler/uye-sil", { data: { id: "x", updatedAt: "" } });
  expect([answer.status(), (await answer.json()).error]).toEqual([401, tr.panel.sessionEnded]);
});

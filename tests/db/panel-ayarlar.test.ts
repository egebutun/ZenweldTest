import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { EMAIL_RECIPIENT_TYPES, SHOP_NO_CARRIER, SHOP_ONE_DEFAULT, type ShopSettings } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminSaveEmailRecipients,
  adminSaveShopSettings,
  emailRecipientsFor,
  readShopPanel,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { EMAIL_TYPES } from "../../packages/db/src/schema/system";
import { closePool, inTransaction } from "./ortak";

/*
 * PANEL › MAGAZA AYARLARI SUNUCUDA, ADIM 5.1 (packages/db/src/admin-settings.ts;
 * Asama 5, 5. alan, KARARLAR K-99, K-104): Kargo ve Ödeme sekmesi tek kayit
 * gibi kaydedilir (settings 'shop' + payment_pos, bank_accounts, carriers);
 * E-posta Alıcıları email_recipients'a yazilir. Ekran acildiktan sonra
 * degismis kayit kaydedilmez; her degisiklik audit_log'a yazilir.
 * Her test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-ayar", name: "Ayar Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };

/** Ornek: iki POS (A varsayilan), bir hesap, iki kargo firmasi (Aras'in takip adresi var), bir alici satiri. */
async function withSettings(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('shop', '{"freeShippingThreshold":5000,"shippingFee":150,"minInstallmentAmount":1000,"transferDueDays":3}', $1)`,
      [T0],
    );
    await client.query(
      `INSERT INTO payment_pos (id, bank_short_name, name, program, merchant_no, pos_name, active, is_default, position, installments, commissions, updated_at) VALUES
         ('pos-a', 'İyzico', 'iyzico', NULL, '1', 'A', true, true, 0, '[]', '[{"count":1,"ratePercent":2}]', $1),
         ('pos-b', 'Garanti', 'Garanti Bonus', 'Bonus', '2', 'B', true, false, 1, '[{"count":3,"enabled":true,"ratePercent":0}]', '[]', $1)`,
      [T0],
    );
    await client.query(
      "INSERT INTO bank_accounts (id, bank_name, account_holder, iban, position, updated_at) VALUES ('ba-1', 'Garanti', 'Zenweld', 'TR01', 0, $1)",
      [T0],
    );
    await client.query(
      `INSERT INTO carriers (id, name, tracking_url, position, updated_at) VALUES
         ('aras', 'Aras Kargo', 'https://kargo.ornek/{takip}', 0, $1), ('mng', 'MNG Kargo', NULL, 1, $1)`,
      [T0],
    );
    await client.query("INSERT INTO email_recipients (type, recipients, updated_at) VALUES ('teklif', '{satis@zenweld.com}', $1)", [T0]);
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  (await client.query("SELECT action, entity_type, entity_id, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id", [admin.id])).rows;

const current = async (db: Db) => (await readShopPanel(db)).settings!.shop;
const edit = (shop: ShopSettings, patch: Partial<ShopSettings>) => {
  const { updatedAt, ...rest } = shop;
  return { shop: { ...rest, ...patch }, updatedAt };
};

describe("Mağaza Ayarları › Kargo ve Ödeme", () => {
  it("okunur: ayarlar son değişiklik anıyla, POS'lar, hesaplar ve kargo firmaları sırasıyla, e-posta alıcıları", async () => {
    await withSettings(async (db) => {
      const data = await readShopPanel(db);
      expect(data.settings?.shop).toMatchObject({
        shippingFee: 150,
        transferDueDays: 3,
        carriers: ["Aras Kargo", "MNG Kargo"],
        updatedAt: T0.toISOString(),
      });
      expect(data.settings?.shop.pos.map((p) => [p.id, p.isDefault, p.program])).toEqual([
        ["pos-a", true, undefined],
        ["pos-b", false, "Bonus"],
      ]);
      expect(data.emailRecipients).toEqual([{ type: "teklif", recipients: ["satis@zenweld.com"], updatedAt: T0.toISOString() }]);
    });
  });

  it("kaydedilir: varsayılan POS değişir, POS ve hesap çıkar/eklenir, kalan kargo firmasının takip adresi korunur; işlem kaydına yazılır", async () => {
    await withSettings(async (db, client) => {
      const shop = await current(db);
      const [a, b] = shop.pos;
      const input = edit(shop, {
        shippingFee: 175,
        carriers: ["Yurtiçi Kargo", "aras kargo", "Aras Kargo"],
        pos: [{ ...b, isDefault: true }],
        bankAccounts: [{ id: "ba-2", bankName: "Ziraat", accountHolder: "Zenweld", iban: "tr02" }],
      });
      expect(await adminSaveShopSettings(db, admin, input, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });

      const after = await current(db);
      expect(after).toMatchObject({ shippingFee: 175, carriers: ["Yurtiçi Kargo", "aras kargo"], updatedAt: T1.toISOString() });
      expect(after.pos.map((p) => [p.id, p.isDefault])).toEqual([["pos-b", true]]);
      expect(after.bankAccounts).toEqual([{ id: "ba-2", bankName: "Ziraat", accountHolder: "Zenweld", iban: "TR02" }]);
      // "aras kargo" yeni bir ad: eski "Aras Kargo" satiri silinir.
      const carriers = (await client.query("SELECT name, tracking_url, position FROM carriers ORDER BY position")).rows;
      expect(carriers.map((c) => c.name)).toEqual(["Yurtiçi Kargo", "aras kargo"]);

      const [entry] = await audit(client);
      expect(entry).toMatchObject({ action: "update", entity_type: "settings", entity_id: "shop" });
      expect(Object.keys(entry.changes).sort()).toEqual(["bankAccounts", "carriers", "pos", "shippingFee"]);
      expect(entry.changes.shippingFee).toEqual([150, 175]);
      expect(entry.changes.pos[0].map((p: { id: string }) => p.id)).toEqual([a.id, b.id]);
    });
  });

  it("varsayılan POS listede kalan başka bir POS'a geçer (varsayılan tek kalır); sıra değişir", async () => {
    await withSettings(async (db, client) => {
      const shop = await current(db);
      const [a, b] = shop.pos;
      const input = edit(shop, { pos: [{ ...b, isDefault: true }, { ...a, isDefault: false }] });
      expect(await adminSaveShopSettings(db, admin, input, T1)).toMatchObject({ ok: true });
      expect((await client.query("SELECT id, is_default, position FROM payment_pos ORDER BY position")).rows).toEqual([
        { id: "pos-b", is_default: true, position: 0 },
        { id: "pos-a", is_default: false, position: 1 },
      ]);
    });
  });

  it("kalan kargo firmasının kimliği ve takip adresi korunur; yalnızca sırası değişir", async () => {
    await withSettings(async (db, client) => {
      const shop = await current(db);
      expect(await adminSaveShopSettings(db, admin, edit(shop, { carriers: ["MNG Kargo", "Aras Kargo"] }), T1)).toMatchObject({ ok: true });
      expect((await client.query("SELECT id, tracking_url FROM carriers ORDER BY position")).rows).toEqual([
        { id: "mng", tracking_url: null },
        { id: "aras", tracking_url: "https://kargo.ornek/{takip}" },
      ]);
    });
  });

  it("ekran eskiyse kaydedilmez; değişiklik yoksa yazılmaz; kurallara uymayan kaydedilmez", async () => {
    await withSettings(async (db, client) => {
      const shop = await current(db);
      expect(await adminSaveShopSettings(db, admin, { ...edit(shop, { shippingFee: 1 }), updatedAt: T1.toISOString() }, T2)).toEqual(stale);
      expect(await adminSaveShopSettings(db, admin, { shop: edit(shop, { shippingFee: 1 }).shop }, T2)).toEqual(stale);
      expect(await adminSaveShopSettings(db, admin, edit(shop, {}), T2)).toEqual({ ok: true, updatedAt: T0.toISOString() });
      expect(await adminSaveShopSettings(db, admin, edit(shop, { carriers: [] }), T2)).toEqual({ ok: false, status: 400, error: SHOP_NO_CARRIER });
      expect(await adminSaveShopSettings(db, admin, edit(shop, { pos: shop.pos.map((p) => ({ ...p, isDefault: true })) }), T2)).toEqual({
        ok: false,
        status: 400,
        error: SHOP_ONE_DEFAULT,
      });
      expect(await adminSaveShopSettings(db, admin, edit(shop, { shippingFee: -5 }), T2)).toEqual({ ok: false, status: 400, error: tr.panel.invalidRequest });
      expect(await audit(client)).toEqual([]);
    });
  });
});

describe("Mağaza Ayarları › E-posta Alıcıları", () => {
  it("türler veritabanındaki listeyle aynı", () => {
    expect(EMAIL_RECIPIENT_TYPES.map((t) => t.type).sort()).toEqual([...EMAIL_TYPES].sort());
  });

  it("eklenir, değişir, boşaltılınca silinir (varsayılan adrese döner); e-posta gönderilirken okunur; işlem kaydına yazılır", async () => {
    await withSettings(async (db, client) => {
      const version = `1|${T0.toISOString()}`;
      const items = [
        { type: "teklif", recipients: ["Satis@zenweld.com", "teklif@zenweld.com"] },
        { type: "servis", recipients: ["servis@zenweld.com"] },
      ];
      expect(await adminSaveEmailRecipients(db, admin, { items, version }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect(await emailRecipientsFor(db, "teklif")).toEqual(["satis@zenweld.com", "teklif@zenweld.com"]);
      expect(await emailRecipientsFor(db, "garanti")).toEqual([]);

      // Ayni ekranla ikinci kayit: liste bu arada degisti.
      expect(await adminSaveEmailRecipients(db, admin, { items, version }, T2)).toEqual(stale);
      const next = `2|${T1.toISOString()}`;
      expect(await adminSaveEmailRecipients(db, admin, { items: [{ type: "teklif", recipients: [] }], version: next }, T2)).toMatchObject({ ok: true });
      expect(await emailRecipientsFor(db, "teklif")).toEqual([]);
      // Degisiklik yok: yazilmaz.
      expect(await adminSaveEmailRecipients(db, admin, { items: [{ type: "servis", recipients: ["servis@zenweld.com"] }], version: `1|${T1.toISOString()}` }, T2)).toEqual({
        ok: true,
      });

      expect((await audit(client)).map((r) => [r.action, r.entity_type, r.entity_id, r.changes])).toEqual([
        ["update", "email_recipients", "teklif", { recipients: [["satis@zenweld.com"], ["satis@zenweld.com", "teklif@zenweld.com"]] }],
        ["create", "email_recipients", "servis", { recipients: [[], ["servis@zenweld.com"]] }],
        ["delete", "email_recipients", "teklif", { recipients: [["satis@zenweld.com", "teklif@zenweld.com"], []] }],
      ]);
    });
  });

  it("geçersiz adres, bilinmeyen tür ve aynı tür iki kez reddedilir", async () => {
    await withSettings(async (db) => {
      const version = `1|${T0.toISOString()}`;
      expect(await adminSaveEmailRecipients(db, admin, { items: [{ type: "servis", recipients: ["servis@"] }], version }, T1)).toEqual({
        ok: false,
        status: 400,
        error: 'Servis talebi: "servis@" geçerli bir e-posta adresi değil.',
      });
      expect(await adminSaveEmailRecipients(db, admin, { items: [{ type: "sifre-sifirlama", recipients: [] }], version }, T1)).toMatchObject({ status: 400 });
      const twice = [
        { type: "servis", recipients: [] },
        { type: "servis", recipients: [] },
      ];
      expect(await adminSaveEmailRecipients(db, admin, { items: twice, version }, T1)).toMatchObject({ status: 400 });
    });
  });
});

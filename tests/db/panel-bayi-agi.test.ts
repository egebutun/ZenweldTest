import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { DEALER_STORE_TAKEN } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteDealer,
  adminDeleteRetailer,
  adminDeleteSalesRep,
  adminMoveSalesRep,
  adminSaveDealer,
  adminSaveRetailer,
  adminSaveSalesRep,
  adminSetSalesRepActive,
  readDealersPanel,
  readRetailersPanel,
  readSalesRepsPanel,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product } from "./ortak";

/*
 * PANEL › BAYI AGI SUNUCUDA, ADIM 4.1 (packages/db/src/admin-network.ts;
 * Asama 5, 4. alan, KARARLAR K-99, K-103): Bayiler, Online Satıcılar ve Satış
 * Temsilcileri. Kurallar demo panelindekiyle aynidir; bir online magaza tek
 * bayiye baglanir, silinen bayinin ve saticinin stogu, gecmisi ve kod
 * eslestirmeleri de silinir, ekran acildiktan sonra degismis kayit
 * kaydedilmez, her degisiklik audit_log'a yazilir. Her test kendi isleminde
 * calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-bayi-agi", name: "Bayi Ağı Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const ref = (id: string, at = T0) => ({ id, updatedAt: at.toISOString() });
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };

/** Ornek ag: magazali bayi d1 (r1'e bagli), bayi d2, satici r1 ve r2, urun p1; kayit anlari T0. */
async function withNetwork(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await group(client);
    await category(client);
    await product(client, "p1", "ZW-P1");
    await client.query(
      `INSERT INTO retailers (id, name, website_url, logo_text, updated_at)
       VALUES ('r1', 'Mağaza Bir', 'https://bir.ornek', 'BİR', $1), ('r2', 'Mağaza İki', 'https://iki.ornek', 'İKİ', $1)`,
      [T0],
    );
    await client.query(
      `INSERT INTO dealers (id, name, city, district, address, phone, lat, lng, badges, working_hours, retailer_id, updated_at)
       VALUES ('d1', 'Bayi Bir', 'Konya', 'Selçuklu', 'Adres', '0555', 37.9, 32.5, '{yetkili-satici}', '09-18', 'r1', $1),
              ('d2', 'Bayi İki', 'Ankara', 'Çankaya', 'Adres', '0555', 39.9, 32.8, '{yetkili-servis}', '09-18', NULL, $1)`,
      [T0],
    );
    await run(drizzle(client, { schema }), client);
  });
}

const audit = async (client: PoolClient) =>
  // Yalnizca bu testin yoneticisi: baska testlerin silinemeyen kayitlari sayilmaz.
  (
    await client.query(
      "SELECT action, entity_type, entity_id, entity_label, changes FROM audit_log WHERE actor_user_id = $1 ORDER BY id",
      [admin.id],
    )
  ).rows;

const count = async (client: PoolClient, sql: string, params: unknown[] = []) => (await client.query(sql, params)).rows[0].n as number;

/** Bayi formunun gonderdigi alanlar. */
const dealerInput = (fields: Record<string, unknown> = {}) => ({
  name: "Yeni Bayi",
  city: "İzmir",
  district: "Bornova",
  address: "Adres",
  phone: "0232 000 00 00",
  lat: 38.46,
  lng: 27.21,
  badges: ["yetkili-satici", "yetkili-servis"],
  workingHours: "09-18",
  active: true,
  ...fields,
});

/** Bayinin stogu, stok gecmisi ve kod eslestirmesi. */
async function stockOf(client: PoolClient, type: "dealer" | "retailer", id: string) {
  const table = type === "dealer" ? "dealer_stock (dealer_id" : "retailer_stock (retailer_id";
  await client.query(`INSERT INTO ${table}, product_id, sku, quantity, url, updated_at) VALUES ($1, 'p1', 'K1', 3, 'https://x.ornek/p1', $2)`, [
    id,
    T0,
  ]);
  await client.query(
    `INSERT INTO stock_imports (id, source_type, source_id, kind, rows, matched, unmatched, invalid, added, changed, zeroed)
     VALUES ($1, $2, $3, 'file', 1, 1, 0, 0, 1, 0, 0)`,
    [`si-${id}`, type, id],
  );
  await client.query("INSERT INTO sku_aliases (source_id, code, product_id) VALUES ($1, 'K1', 'p1')", [id]);
}

describe("bayiler", () => {
  it("bayi eklenir ve düzenlenir; bir online mağaza tek bayiye bağlanır; ekran eskiyse kaydedilmez; değişiklik yoksa yazılmaz", async () => {
    await withNetwork(async (db, client) => {
      expect(await adminSaveDealer(db, admin, dealerInput({ city: " " }), T1)).toEqual({
        ok: false,
        status: 400,
        error: "Bayi adı ve şehir zorunludur.",
      });
      expect(await adminSaveDealer(db, admin, dealerInput({ badges: [] }), T1)).toMatchObject({
        status: 400,
        error: "Bayi türünü seçin: Yetkili Bayi, Yetkili Servis ya da ikisi.",
      });
      expect(await adminSaveDealer(db, admin, dealerInput({ badges: ["uydurma"] }), T1)).toMatchObject({ status: 400 });
      expect(await adminSaveDealer(db, admin, dealerInput({ lat: 120 }), T1)).toMatchObject({ status: 400 });
      expect(await adminSaveDealer(db, admin, dealerInput({ retailerId: "r1" }), T1)).toEqual({ ok: false, status: 409, error: DEALER_STORE_TAKEN });
      expect(await adminSaveDealer(db, admin, dealerInput({ retailerId: "yok" }), T1)).toMatchObject({ status: 400, error: tr.panel.storeMissing });

      const created = await adminSaveDealer(db, admin, dealerInput({ retailerId: "r2", whatsapp: " " }), T1);
      expect(created).toMatchObject({ ok: true, updatedAt: T1.toISOString() });
      const id = (created as { id: string }).id;
      expect((await readDealersPanel(db)).dealers.find((d) => d.id === id)).toMatchObject({
        name: "Yeni Bayi",
        retailerId: "r2",
        badges: ["yetkili-satici", "yetkili-servis"],
        updatedAt: T1.toISOString(),
      });

      // d2 magazasiz; r2 artik yeni bayinin.
      const d2 = { ...dealerInput({ name: "Bayi İki", city: "Ankara" }), ...ref("d2") };
      expect(await adminSaveDealer(db, admin, { ...d2, retailerId: "r2" }, T2)).toEqual({ ok: false, status: 409, error: DEALER_STORE_TAKEN });
      expect(await adminSaveDealer(db, admin, d2, T2)).toEqual({ ok: true, updatedAt: T2.toISOString(), id: "d2" });
      expect(await adminSaveDealer(db, admin, d2, T2)).toEqual(stale);
      // Ayni kayit yeniden: hicbir sey yazilmaz.
      expect(await adminSaveDealer(db, admin, { ...d2, ...ref("d2", T2) }, T2)).toEqual({ ok: true, updatedAt: T2.toISOString(), id: "d2" });

      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_type, r.entity_label])).toEqual([
        ["create", "dealers", "Yeni Bayi"],
        ["update", "dealers", "Bayi İki"],
      ]);
      expect(Object.keys(rows[1].changes).sort()).toEqual(["badges", "district", "lat", "lng", "phone"]);
    });
  });

  it("bayi silinince stoğu, stok geçmişi ve kod eşleştirmeleri silinir; bayilik başvurusundaki bağlantı boşalır", async () => {
    await withNetwork(async (db, client) => {
      await stockOf(client, "dealer", "d1");
      await client.query("INSERT INTO dealer_applications (id, company_name, email, dealer_id) VALUES ('a1', 'Bayi Bir', 'a@ornek.com', 'd1')");

      expect(await adminDeleteDealer(db, admin, ref("d1", T1), T1)).toEqual(stale);
      expect(await adminDeleteDealer(db, admin, ref("d1"), T1)).toEqual({ ok: true });
      expect(await count(client, "SELECT count(*)::int AS n FROM dealers WHERE id = 'd1'")).toBe(0);
      expect(await count(client, "SELECT count(*)::int AS n FROM dealer_stock")).toBe(0);
      expect(await count(client, "SELECT count(*)::int AS n FROM stock_imports WHERE source_id = 'd1'")).toBe(0);
      expect(await count(client, "SELECT count(*)::int AS n FROM sku_aliases WHERE source_id = 'd1'")).toBe(0);
      expect((await client.query("SELECT dealer_id FROM dealer_applications WHERE id = 'a1'")).rows[0].dealer_id).toBeNull();
      // Bagli oldugu magaza kalir.
      expect(await count(client, "SELECT count(*)::int AS n FROM retailers WHERE id = 'r1'")).toBe(1);
      expect((await audit(client))[0]).toMatchObject({
        action: "delete",
        entity_id: "d1",
        changes: { name: "Bayi Bir", retailerId: "r1", stockRows: 1 },
      });
    });
  });
});

describe("online satıcılar", () => {
  it("satıcı eklenir (logo metni boşsa adın büyük harfli hali) ve düzenlenir; ekranda yalnızca sitede görünebilecek stok satırları okunur", async () => {
    await withNetwork(async (db, client) => {
      expect(await adminSaveRetailer(db, admin, { name: "Satıcı", websiteUrl: "", isOwnStore: false, active: true }, T1)).toEqual({
        ok: false,
        status: 400,
        error: "Satıcı adı ve site adresi zorunludur.",
      });
      const created = await adminSaveRetailer(db, admin, { name: "Kaynakçı Market", websiteUrl: "https://kaynakci.ornek", isOwnStore: false, active: true }, T1);
      expect(created).toMatchObject({ ok: true });
      const id = (created as { id: string }).id;
      const input = { ...ref("r2"), name: "Mağaza İki", websiteUrl: "https://iki.ornek", logoText: "İKİ", isOwnStore: true, city: "Bursa", active: true };
      expect(await adminSaveRetailer(db, admin, input, T1)).toEqual({ ok: true, updatedAt: T1.toISOString(), id: "r2" });
      expect(await adminSaveRetailer(db, admin, { ...input, city: "İzmir" }, T2)).toEqual(stale);

      // Gorunebilecek satirlar: adet > 0 ve linkli; bayide yalnizca magazasi olanlar (d1).
      await client.query(
        `INSERT INTO retailer_stock (retailer_id, product_id, sku, quantity, url, updated_at)
         VALUES ('r2', 'p1', 'K1', 2, 'https://iki.ornek/p1', $1)`,
        [T0],
      );
      await client.query(
        `INSERT INTO dealer_stock (dealer_id, product_id, variant_id, sku, quantity, url, updated_at)
         VALUES ('d1', 'p1', '', 'K1', 4, 'https://bir.ornek/p1', $1), ('d2', 'p1', '', 'K1', 4, 'https://x.ornek/p1', $1)`,
        [T0],
      );
      const panel = await readRetailersPanel(db);
      expect(panel.retailers.find((r) => r.id === id)).toMatchObject({ name: "Kaynakçı Market", logoText: "KAYNAKÇI MARKET", updatedAt: T1.toISOString() });
      expect(panel.retailers.find((r) => r.id === "r2")).toMatchObject({ isOwnStore: true, city: "Bursa" });
      expect(panel.retailerStock.map((r) => r.retailerId)).toEqual(["r2"]);
      expect(panel.dealerStock.map((r) => r.dealerId)).toEqual(["d1"]);
      // "Kac gunden eski stok gosterilmez" ayari da gelir (kayit yoksa varsayilan kullanilir).
      await client.query("INSERT INTO settings (key, value) VALUES ('stock', '{\"staleDays\": 7}')");
      expect((await readRetailersPanel(db)).settings.stock).toEqual({ staleDays: 7 });
    });
  });

  it("satıcı silinince stoğu, geçmişi ve eşleştirmeleri silinir; bağlı bayinin mağaza bağlantısı kalkar ve bayi değişmiş sayılır", async () => {
    await withNetwork(async (db, client) => {
      await stockOf(client, "retailer", "r1");
      expect(await adminDeleteRetailer(db, admin, ref("r1"), T1)).toEqual({ ok: true });
      expect(await count(client, "SELECT count(*)::int AS n FROM retailer_stock")).toBe(0);
      expect(await count(client, "SELECT count(*)::int AS n FROM stock_imports WHERE source_id = 'r1'")).toBe(0);
      expect(await count(client, "SELECT count(*)::int AS n FROM sku_aliases WHERE source_id = 'r1'")).toBe(0);
      expect((await client.query("SELECT retailer_id, updated_at FROM dealers WHERE id = 'd1'")).rows[0]).toEqual({ retailer_id: null, updated_at: T1 });
      // Acik bayi formu silinen magazayi geri yazamaz.
      expect(await adminSaveDealer(db, admin, { ...dealerInput({ name: "Bayi Bir", retailerId: "r1" }), ...ref("d1") }, T2)).toEqual(stale);
      expect((await audit(client))[0]).toMatchObject({ action: "delete", entity_id: "r1", changes: { stockRows: 1, dealers: ["d1"] } });
    });
  });
});

describe("satış temsilcileri", () => {
  it("temsilci listenin sonuna eklenir; kurallar; yüklenmiş fotoğraf reddedilir; sitede gösterilir/gizlenir; oklar sırayı değiştirir; silinir", async () => {
    await withNetwork(async (db, client) => {
      await client.query(
        `INSERT INTO sales_reps (id, name, region, phone, email, position, updated_at)
         VALUES ('t1', 'Ali Bir', 'Ege', '+90 532 000 00 01', 'ali@ornek.com', 1, $1), ('t2', 'Ayşe İki', 'Marmara', '+90 532 000 00 02', 'ayse@ornek.com', 2, $1)`,
        [T0],
      );
      const rep = { name: "Mehmet Üç", region: "İç Anadolu", phone: "+90 532 000 00 03", email: "mehmet@ornek.com", active: true };
      expect(await adminSaveSalesRep(db, admin, { ...rep, email: "mehmet" }, T1)).toMatchObject({ status: 400, error: "E-posta adresi geçersiz görünüyor." });
      expect(await adminSaveSalesRep(db, admin, { ...rep, phone: "0532" }, T1)).toMatchObject({ status: 400 });
      expect(await adminSaveSalesRep(db, admin, { ...rep, photoUrl: "data:image/png;base64,AAAA" }, T1)).toEqual({
        ok: false,
        status: 400,
        error: tr.panel.uploadDisabled,
      });
      const created = await adminSaveSalesRep(db, admin, { ...rep, photoUrl: "/images/reps/mehmet.jpg" }, T1);
      expect(created).toMatchObject({ ok: true });
      const id = (created as { id: string }).id;
      expect((await readSalesRepsPanel(db)).salesReps.map((r) => [r.id, r.order])).toEqual([
        ["t1", 1],
        ["t2", 2],
        [id, 3],
      ]);

      expect(await adminSetSalesRepActive(db, admin, { ...ref("t1"), active: false }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString() });
      expect(await adminSetSalesRepActive(db, admin, { ...ref("t1"), active: true }, T2)).toEqual(stale);
      expect(await adminMoveSalesRep(db, admin, { id, direction: -1 }, T2)).toEqual({ ok: true });
      expect(await adminMoveSalesRep(db, admin, { id: "t1", direction: -1 }, T2)).toEqual({ ok: true });
      const order = (await readSalesRepsPanel(db)).salesReps;
      expect(order.map((r) => [r.id, r.order, r.active])).toEqual([
        ["t1", 1, false],
        [id, 2, true],
        ["t2", 3, true],
      ]);
      // Sira kaydin icerigi degildir.
      expect(order.find((r) => r.id === "t2")?.updatedAt).toBe(T0.toISOString());

      expect(await adminDeleteSalesRep(db, admin, ref("t2"), T2)).toEqual({ ok: true });
      expect((await readSalesRepsPanel(db)).salesReps.map((r) => r.id)).toEqual(["t1", id]);
      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_id, r.changes.position ?? null])).toEqual([
        ["create", id, null],
        ["update", "t1", null],
        ["update", id, [3, 2]],
        ["update", "t2", [2, 3]],
        ["delete", "t2", null],
      ]);
    });
  });
});

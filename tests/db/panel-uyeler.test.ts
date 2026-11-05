import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { tr } from "@zenweld/i18n";
import { adminDeleteMember, adminSaveMember, readMembersPanel, type Actor } from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction, testDatabaseUrl } from "./ortak";

/*
 * PANEL › UYELER SUNUCUDA (packages/db/src/admin-members.ts; Asama 5, 6. alan;
 * KARARLAR K-35, K-36, K-99): rol ve durum, kendi hesabi, son yonetici,
 * silme, ekran eskiyse kaydetmeme, islem kaydi. Testler kendi isleminde
 * calisir ve geri alinir; ayni anda iki yonetici testi gercekten yazar ve
 * sonda siler (audit_log silinemez, onun kaydi kalir).
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");

async function account(client: PoolClient, id: string, role: string, status = "active") {
  await client.query(
    `INSERT INTO users (id, role, status, email, password_hash, first_name, last_name, phone, created_at, updated_at)
     VALUES ($1, $2, $3, $1 || '@ornek.com', 'gizli-ozet', 'Ad', $1, '0555', $4, $4)`,
    [id, role, status, T0],
  );
}

/** Bu testin hesaplari: yonetici y1, y2 (ikinci yonetici) ve uye u1. Diger yoneticiler askida sayilir. */
async function withMembers(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await client.query("UPDATE users SET status = 'suspended' WHERE role = 'admin'");
    await account(client, "y1", "admin");
    await account(client, "y2", "admin");
    await account(client, "u1", "individual");
    await run(drizzle(client, { schema }), client);
  });
}

const admin: Actor = { id: "y1", name: "Ad y1" };
const ref = (id: string, updatedAt = T0) => ({ id, updatedAt: updatedAt.toISOString() });
const audit = async (client: PoolClient) =>
  (await client.query("SELECT action, entity_type, entity_id, changes FROM audit_log WHERE actor_user_id = 'y1' ORDER BY id")).rows;

describe("üyeler", () => {
  it("bütün hesaplar okunur (yöneticiler dahil); şifre özeti gönderilmez", async () => {
    await withMembers(async (db) => {
      const members = await readMembersPanel(db);
      const mine = members.filter((m) => ["y1", "y2", "u1"].includes(m.id));
      expect(mine.map((m) => [m.id, m.role, m.passwordHash, m.updatedAt])).toEqual([
        ["u1", "individual", "", T0.toISOString()],
        ["y1", "admin", "", T0.toISOString()],
        ["y2", "admin", "", T0.toISOString()],
      ]);
      expect(members.every((m) => m.passwordHash === "")).toBe(true);
    });
  });

  it("rol ve durum değişir; işlem kaydına yazılır; değişmeyen kayıt yazılmaz; ekran eskiyse kaydedilmez", async () => {
    await withMembers(async (db, client) => {
      expect(await adminSaveMember(db, admin, { ...ref("u1"), role: "business", status: "suspended" }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      const [row] = (await client.query("SELECT role, status FROM users WHERE id = 'u1'")).rows;
      expect(row).toEqual({ role: "business", status: "suspended" });
      expect(await audit(client)).toEqual([
        { action: "update", entity_type: "users", entity_id: "u1", changes: { role: ["individual", "business"], status: ["active", "suspended"] } },
      ]);
      // Ayni hal: yazilmaz.
      expect(await adminSaveMember(db, admin, { ...ref("u1", T1), role: "business", status: "suspended" }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
      });
      expect(await audit(client)).toHaveLength(1);
      // Eski ekran.
      expect(await adminSaveMember(db, admin, { ...ref("u1"), role: "individual", status: "active" }, T1)).toEqual({
        ok: false,
        status: 409,
        error: tr.panel.staleRecord,
      });
      expect(await adminSaveMember(db, admin, { ...ref("yok"), role: "individual", status: "active" }, T1)).toMatchObject({
        status: 404,
        error: tr.panel.memberNotFound,
      });
      expect(await adminSaveMember(db, admin, { ...ref("u1", T1), role: "patron", status: "active" }, T1)).toMatchObject({ status: 400 });
    });
  });

  it("yönetici kendi rolünü ve durumunu değiştiremez; son aktif yönetici korunur", async () => {
    await withMembers(async (db) => {
      expect(await adminSaveMember(db, admin, { ...ref("y1"), role: "individual", status: "active" }, T1)).toEqual({
        ok: false,
        status: 400,
        error: tr.panel.ownAccount,
      });
      expect(await adminSaveMember(db, admin, { ...ref("y1"), role: "admin", status: "suspended" }, T1)).toMatchObject({
        error: tr.panel.ownAccount,
      });
      // Iki aktif yonetici varken y2 askiya alinir; y2'nin oturumu olsa o da gecersiz olur.
      expect(await adminSaveMember(db, admin, { ...ref("y2"), role: "admin", status: "suspended" }, T1)).toMatchObject({ ok: true });
      // Artik y1 son aktif yonetici: (baska bir yonetici olarak) dusurulemez.
      const other: Actor = { id: "y2", name: "Ad y2" };
      expect(await adminSaveMember(db, other, { ...ref("y1"), role: "business", status: "active" }, T1)).toEqual({
        ok: false,
        status: 409,
        error: tr.panel.lastAdmin,
      });
      // Askidaki yonetici yeniden aktif yapilabilir.
      expect(await adminSaveMember(db, admin, { ...ref("y2", T1), role: "admin", status: "active" }, T1)).toMatchObject({ ok: true });
    });
  });

  it("üye silinir: adresleri gider, siparişi kalır; son hali işlem kaydında; yönetici silinmez", async () => {
    await withMembers(async (db, client) => {
      await client.query(
        `INSERT INTO addresses (id, user_id, title, full_name, phone, city, district, line, is_default)
         VALUES ('adr-1', 'u1', 'Ev', 'Ad', '0555', 'Konya', 'Selçuklu', 'Cad. 1', true)`,
      );
      await client.query(
        `INSERT INTO orders (id, code, user_id, status, customer_name, email, phone, shipping_address, invoice,
                             subtotal, vat, shipping, total, payment_method, terms_accepted_at)
         VALUES ('o-u1', 'SIP-U1', 'u1', 'delivered', 'Ad', 'u1@ornek.com', '0555', '{}', '{}', 0, 0, 0, 0, 'transfer', now())`,
      );
      expect(await adminDeleteMember(db, admin, ref("y2"), T1)).toEqual({ ok: false, status: 400, error: tr.panel.adminNotDeletable });
      expect(await adminDeleteMember(db, admin, ref("u1", T1), T1)).toMatchObject({ status: 409 });
      expect(await adminDeleteMember(db, admin, ref("u1"), T1)).toEqual({ ok: true });

      expect((await client.query("SELECT id FROM users WHERE id = 'u1'")).rows).toEqual([]);
      expect((await client.query("SELECT id FROM addresses WHERE id = 'adr-1'")).rows).toEqual([]);
      expect((await client.query("SELECT user_id FROM orders WHERE id = 'o-u1'")).rows).toEqual([{ user_id: null }]);
      const [entry] = await audit(client);
      expect(entry).toMatchObject({ action: "delete", entity_id: "u1", changes: { email: "u1@ornek.com", role: "individual", status: "active" } });
      expect(JSON.stringify(entry.changes)).not.toContain("gizli-ozet");
    });
  });
});

describe("aynı anda iki yönetici", () => {
  it("iki aktif yönetici aynı anda birbirini askıya alamaz: ikincisi beklenir ve reddedilir", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl(), max: 2 });
    const [a, b] = [await pool.connect(), await pool.connect()];
    const p = `iy${Date.now()}-`;
    let before: string[] = [];
    try {
      // Diger yoneticiler askida (sonda eski haline doner).
      before = (await a.query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'")).rows.map((r) => r.id as string);
      await a.query("UPDATE users SET status = 'suspended' WHERE id = ANY($1)", [before]);
      await account(a, `${p}y1`, "admin");
      await account(a, `${p}y2`, "admin");
      const first: Actor = { id: `${p}y1`, name: "Bir" };
      const second: Actor = { id: `${p}y2`, name: "İki" };

      await a.query("BEGIN");
      const one = await adminSaveMember(drizzle(a, { schema }), first, { ...ref(`${p}y2`), role: "admin", status: "suspended" }, T1);
      await b.query("BEGIN");
      let done = false;
      const two = adminSaveMember(drizzle(b, { schema }), second, { ...ref(`${p}y1`), role: "admin", status: "suspended" }, T1).then(
        (r) => ((done = true), r),
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(done).toBe(false);
      await a.query("COMMIT");
      const result = await two;
      await b.query("COMMIT");
      expect(one).toMatchObject({ ok: true });
      expect(result).toEqual({ ok: false, status: 409, error: tr.panel.lastAdmin });
      const rows = (await a.query("SELECT id, status FROM users WHERE id LIKE $1 ORDER BY id", [`${p}%`])).rows;
      expect(rows).toEqual([
        { id: `${p}y1`, status: "active" },
        { id: `${p}y2`, status: "suspended" },
      ]);
    } finally {
      await a.query("ROLLBACK").catch(() => {});
      await b.query("ROLLBACK").catch(() => {});
      await a.query("UPDATE users SET status = 'active' WHERE id = ANY($1)", [before]);
      await a.query("DELETE FROM users WHERE id LIKE $1", [`${p}%`]);
      a.release();
      b.release();
      await pool.end();
    }
  });
});

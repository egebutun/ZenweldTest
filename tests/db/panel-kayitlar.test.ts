import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { auditLogFacets, readAuditLog, readEmailLog } from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { closePool, inTransaction } from "./ortak";

/*
 * PANEL › ISLEM KAYDI VE E-POSTA KAYDI (packages/db/src/admin-logs.ts;
 * Asama 5, 6. alan): en yeni once, suzgecler (tur, yonetici, islem,
 * Turkiye gunune gore tarih, metin), sayfalama. Her test kendi isleminde
 * calisir ve geri alinir; baska testlerin kayitlari ayirt edici yonetici
 * ve metinlerle disarida birakilir.
 */

afterAll(closePool);

const P = "kayit-test";

async function audit(client: PoolClient, at: string, actor: string, action: string, entityType: string, entityId: string, label: string) {
  await client.query(
    `INSERT INTO audit_log (at, actor_user_id, actor_name, action, entity_type, entity_id, entity_label, changes, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '10.0.0.9')`,
    [at, `${P}-${actor}`, `Yönetici ${actor}`, action, entityType, entityId, label, action === "update" ? { status: ["new", "done"] } : null],
  );
}

async function email(client: PoolClient, at: string, type: string, to: string, subject: string, status: string) {
  await client.query(
    `INSERT INTO email_log (created_at, type, recipients, subject, status, entity_type, entity_id, error)
     VALUES ($1, $2, ARRAY[$3], $4, $5, 'quotes', 'TKL-1', $6)`,
    [at, type, to, subject, status, status === "skipped" ? "eposta-yapilandirilmadi" : null],
  );
}

describe("işlem kaydı", () => {
  it("en yeni önce; tür, yönetici, işlem ve metinle süzülür; değişiklik ve IP gelir", async () => {
    await inTransaction(async (client) => {
      await audit(client, "2001-03-10T09:00:00Z", "a", "login", "users", `${P}-a`, "Giriş");
      await audit(client, "2001-03-10T10:00:00Z", "a", "update", "orders", "o-1", `SIP-${P}-1`);
      await audit(client, "2001-03-10T11:00:00Z", "b", "delete", "coupons", "k-1", `KUPON_%_${P}`);
      const db = drizzle(client, { schema });
      const mine = async (filter: Parameters<typeof readAuditLog>[1]) =>
        (await readAuditLog(db, { ...filter, q: filter?.q ?? P })).entries.map((e) => e.entityId);

      expect(await mine({})).toEqual(["k-1", "o-1", `${P}-a`]);
      expect(await mine({ entityType: "orders" })).toEqual(["o-1"]);
      expect(await mine({ actorUserId: `${P}-b` })).toEqual(["k-1"]);
      expect(await mine({ action: "login" })).toEqual([`${P}-a`]);
      // % ve _ harfiyen aranir.
      expect(await mine({ q: `KUPON_%_${P}` })).toEqual(["k-1"]);
      expect(await mine({ q: `KUPONx%_${P}` })).toEqual([]);

      const [entry] = (await readAuditLog(db, { entityType: "orders", q: P })).entries;
      expect(entry).toMatchObject({
        at: "2001-03-10T10:00:00.000Z",
        actorName: "Yönetici a",
        action: "update",
        entityLabel: `SIP-${P}-1`,
        changes: { status: ["new", "done"] },
        ip: "10.0.0.9",
      });
    });
  });

  it("tarih aralığı Türkiye gününe göredir (iki uç dahil)", async () => {
    await inTransaction(async (client) => {
      // Turkiye saatiyle 10 Mart 23:30 ve 11 Mart 00:30.
      await audit(client, "2001-03-10T20:30:00Z", "a", "update", "orders", "gece-1", P);
      await audit(client, "2001-03-10T21:30:00Z", "a", "update", "orders", "gece-2", P);
      const db = drizzle(client, { schema });
      const ids = async (from?: string, to?: string) => (await readAuditLog(db, { q: P, from, to })).entries.map((e) => e.entityId);
      expect(await ids("2001-03-11", "2001-03-11")).toEqual(["gece-2"]);
      expect(await ids("2001-03-10", "2001-03-10")).toEqual(["gece-1"]);
      expect(await ids(undefined, "2001-03-10")).toEqual(["gece-1"]);
      expect(await ids("2001-03-10")).toEqual(["gece-2", "gece-1"]);
      // Gecersiz tarih yok sayilir.
      expect(await ids("10.03.2001")).toEqual(["gece-2", "gece-1"]);
    });
  });

  it("sayfalama: 'daha eski' son kaydın numarasıyla; süzgeç seçenekleri", async () => {
    await inTransaction(async (client) => {
      for (let i = 1; i <= 5; i++) await audit(client, `2001-03-1${i}T09:00:00Z`, i % 2 ? "a" : "b", "update", "products", `p-${i}`, P);
      const db = drizzle(client, { schema });
      const first = await readAuditLog(db, { q: P }, 2);
      expect([first.entries.map((e) => e.entityId), first.more]).toEqual([["p-5", "p-4"], true]);
      const second = await readAuditLog(db, { q: P, before: first.entries[1].id }, 2);
      expect([second.entries.map((e) => e.entityId), second.more]).toEqual([["p-3", "p-2"], true]);
      const last = await readAuditLog(db, { q: P, before: second.entries[1].id }, 2);
      expect([last.entries.map((e) => e.entityId), last.more]).toEqual([["p-1"], false]);

      const facets = await auditLogFacets(db);
      expect(facets.entityTypes).toContain("products");
      expect(facets.actors.filter((a) => a.id.startsWith(P))).toEqual([
        { id: `${P}-a`, name: "Yönetici a" },
        { id: `${P}-b`, name: "Yönetici b" },
      ]);
    });
  });
});

describe("e-posta kaydı", () => {
  it("en yeni önce; tür, durum, tarih ve alıcı/konu metniyle süzülür; sayfalanır", async () => {
    await inTransaction(async (client) => {
      await email(client, "2001-03-10T09:00:00Z", "teklif", `${P}-1@ornek.com`, "Yeni teklif TKL-1", "sent");
      await email(client, "2001-03-11T09:00:00Z", "servis", `${P}-2@ornek.com`, "Servis talebi", "failed");
      await email(client, "2001-03-12T09:00:00Z", "teklif", `${P}-3@ornek.com`, "Yeni teklif TKL-2", "skipped");
      const db = drizzle(client, { schema });
      const to = async (filter: Parameters<typeof readEmailLog>[1]) =>
        (await readEmailLog(db, { ...filter, q: filter?.q ?? P })).entries.map((e) => e.recipients[0]);

      expect(await to({})).toEqual([`${P}-3@ornek.com`, `${P}-2@ornek.com`, `${P}-1@ornek.com`]);
      expect(await to({ type: "teklif" })).toEqual([`${P}-3@ornek.com`, `${P}-1@ornek.com`]);
      expect(await to({ status: "failed" })).toEqual([`${P}-2@ornek.com`]);
      expect(await to({ from: "2001-03-11", to: "2001-03-11" })).toEqual([`${P}-2@ornek.com`]);

      const [skipped] = (await readEmailLog(db, { q: `${P}-3` })).entries;
      expect(skipped).toMatchObject({ type: "teklif", subject: "Yeni teklif TKL-2", status: "skipped", entityType: "quotes", entityId: "TKL-1", error: "eposta-yapilandirilmadi" });

      const page = await readEmailLog(db, { q: P }, 2);
      expect(page.more).toBe(true);
      expect((await readEmailLog(db, { q: P, before: page.entries[1].id }, 2)).entries.map((e) => e.recipients[0])).toEqual([`${P}-1@ornek.com`]);
    });
  });
});

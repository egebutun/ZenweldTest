import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import {
  ACCOUNT_LIMITS,
  AUTH_ERRORS,
  addFavourites,
  deleteAddress,
  listAddresses,
  listFavourites,
  removeFavourite,
  saveAddress,
  setDefaultAddress,
} from "../../packages/auth/src/server";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, product, testDatabaseUrl, user } from "./ortak";

/*
 * Uyenin adresleri ve favorileri (packages/auth/src/server/account-data.ts;
 * Asama 5.1, KARARLAR K-96). Her test kendi isleminde calisir ve sonunda
 * geri alinir.
 */

afterAll(closePool);

async function withMembers(run: (db: NodePgDatabase<typeof schema>, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await user(client, "u-a", "a@ornek.com");
    await user(client, "u-b", "b@ornek.com");
    await group(client);
    await category(client);
    await product(client, "p1", "ZW-P1");
    await product(client, "p2", "ZW-P2");
    await run(drizzle(client, { schema }), client);
  });
}

const address = (title: string) => ({
  title,
  fullName: "Ad Soyad",
  phone: "05550000000",
  city: "Konya",
  district: "Selçuklu",
  line: "Örnek Cad. No:1",
});

describe("adresler", () => {
  it("ilk adres varsayılan; varsayılan değişir; varsayılan silinince kalan ilk adres varsayılan olur", async () => {
    await withMembers(async (db) => {
      const first = await saveAddress(db, "u-a", address("Ev"));
      expect(first.ok && first.addresses.map((a) => [a.title, a.isDefault])).toEqual([["Ev", true]]);
      await saveAddress(db, "u-a", address("İş"));
      const third = await saveAddress(db, "u-a", address("Depo"));
      expect(third.ok && third.addresses.map((a) => [a.title, a.isDefault])).toEqual([
        ["Ev", true],
        ["İş", false],
        ["Depo", false],
      ]);

      const depo = third.ok ? third.addresses[2].id : "";
      const switched = await setDefaultAddress(db, "u-a", depo);
      expect(switched.ok && switched.addresses.map((a) => [a.title, a.isDefault])).toEqual([
        ["Depo", true],
        ["Ev", false],
        ["İş", false],
      ]);

      const removed = await deleteAddress(db, "u-a", depo);
      expect(removed.ok && removed.addresses.map((a) => [a.title, a.isDefault])).toEqual([
        ["Ev", true],
        ["İş", false],
      ]);

      const ev = removed.ok ? removed.addresses[0].id : "";
      const edited = await saveAddress(db, "u-a", { ...address(" Evim "), id: ev, city: "Ankara" });
      expect(edited.ok && edited.addresses[0]).toMatchObject({ id: ev, title: "Evim", city: "Ankara", isDefault: true });
    });
  });

  it("adresi yalnızca sahibi değiştirir; zorunlu alanlar; en fazla 20 adres", async () => {
    await withMembers(async (db) => {
      const saved = await saveAddress(db, "u-a", address("Ev"));
      const id = saved.ok ? saved.addresses[0].id : "";
      const notFound = { ok: false, status: 400, error: "Adres bulunamadı." };
      expect(await saveAddress(db, "u-b", { ...address("Başkası"), id })).toEqual(notFound);
      expect(await deleteAddress(db, "u-b", id)).toEqual(notFound);
      expect(await setDefaultAddress(db, "u-b", id)).toEqual(notFound);
      expect(await listAddresses(db, "u-a")).toHaveLength(1);
      expect(await listAddresses(db, "u-b")).toHaveLength(0);

      expect(await saveAddress(db, "u-a", { ...address("Eksik"), district: " " })).toMatchObject({ error: AUTH_ERRORS.missingFields });

      for (let i = 2; i <= ACCOUNT_LIMITS.addresses; i++) expect((await saveAddress(db, "u-a", address(`Adres ${i}`))).ok).toBe(true);
      expect(await saveAddress(db, "u-a", address("Fazla"))).toMatchObject({ error: "En fazla 20 adres kaydedebilirsiniz." });
    });
  });

  it("aynı anda gelen istekler sırayla çalışır: tek varsayılan, sınır aşılmaz", async () => {
    // Iki ayri baglanti (iki sekme gibi); kayitlar gercekten yazilir, sonda silinir.
    const pool = new Pool({ connectionString: testDatabaseUrl(), max: 2 });
    const [a, b] = [await pool.connect(), await pool.connect()];
    const id = `u-es-${Date.now()}`;
    /** Birinci istek islemini acik tutarken ikincisi baslar; ikincisi birincinin bitmesini bekler. */
    const race = async (first: string, second: string) => {
      await a.query("BEGIN");
      const one = await saveAddress(drizzle(a, { schema }), id, address(first));
      await b.query("BEGIN");
      let done = false;
      const two = saveAddress(drizzle(b, { schema }), id, address(second)).then((r) => ((done = true), r));
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(done).toBe(false);
      await a.query("COMMIT");
      const result = await two;
      await b.query("COMMIT");
      return [one, result];
    };
    try {
      await a.query(
        `INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone)
         VALUES ($1, 'individual', $2, 'ozet', 'Ad', 'Soyad', '05550000000')`,
        [id, `${id}@ornek.com`],
      );
      await race("Ev", "İş");
      const defaults = await a.query("SELECT count(*)::int AS n FROM addresses WHERE user_id = $1 AND is_default", [id]);
      expect(defaults.rows[0].n).toBe(1);

      // 19 adres varken iki istek: yalnizca biri kaydolur.
      for (let i = 3; i < ACCOUNT_LIMITS.addresses; i++) await saveAddress(drizzle(a, { schema }), id, address(`Adres ${i}`));
      const [one, two] = await race("A", "B");
      expect([one.ok, two.ok]).toEqual([true, false]);
      expect(await listAddresses(drizzle(a, { schema }), id)).toHaveLength(ACCOUNT_LIMITS.addresses);
    } finally {
      await a.query("ROLLBACK").catch(() => {});
      await b.query("ROLLBACK").catch(() => {});
      await a.query("DELETE FROM users WHERE id = $1", [id]);
      a.release();
      b.release();
      await pool.end();
    }
  });
});

describe("favoriler", () => {
  it("eklenir (olmayan ürün ve tekrar atlanır), çıkarılır; ürün silinince favoriden de gider", async () => {
    await withMembers(async (db, client) => {
      expect(await addFavourites(db, "u-a", ["p2", "yok", "p1", "p2", 42])).toEqual({ ok: true, ids: ["p2", "p1"] });
      expect(await addFavourites(db, "u-a", ["p1"])).toEqual({ ok: true, ids: ["p2", "p1"] });
      expect(await listFavourites(db, "u-b")).toEqual([]);
      expect(await removeFavourite(db, "u-a", "p2")).toEqual({ ok: true, ids: ["p1"] });
      await client.query("DELETE FROM products WHERE id = 'p1'");
      expect(await listFavourites(db, "u-a")).toEqual([]);
    });
  });

  it("en fazla 500: tek ürün eklenirken hata; girişte birleştirmede sığan kadarı eklenir", async () => {
    await withMembers(async (db, client) => {
      await client.query(
        `INSERT INTO products (id, slug, sku, name, category_id, price_ex_vat, vat_rate, warranty_months)
         SELECT 'x' || g, 'x' || g, 'ZW-X' || g, 'Ürün', 'c1', 1000, 20, 24 FROM generate_series(1, 501) g`,
      );
      const many = Array.from({ length: 499 }, (_, i) => `x${i + 1}`);
      expect((await addFavourites(db, "u-a", many)).ok).toBe(true);
      // Giris birlestirmesi: 3 urun gelir, 1'i sigar.
      expect(await addFavourites(db, "u-a", ["x500", "x501", "p1"])).toMatchObject({ ok: true });
      expect(await listFavourites(db, "u-a")).toHaveLength(500);
      expect(await addFavourites(db, "u-a", ["p2"])).toEqual({
        ok: false,
        status: 400,
        error: "En fazla 500 favori ekleyebilirsiniz.",
      });
    });
  });
});

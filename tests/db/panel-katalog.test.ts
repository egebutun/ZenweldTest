import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import {
  CATEGORY_HAS_PRODUCTS,
  GROUP_HAS_CATEGORIES,
  categorySlugTakenText,
  groupSlugTakenText,
  optionInUseText,
  optionValueInUseText,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import {
  adminDeleteCategory,
  adminDeleteGroup,
  adminDeleteOptionDefinition,
  adminMoveCategory,
  adminMoveGroup,
  adminSaveCategory,
  adminSaveGroup,
  adminSaveOptionDefinition,
  readCatalogPanel,
  type Actor,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, group, inTransaction, optionDefinition, product, variant } from "./ortak";

/*
 * PANEL › KATALOG SUNUCUDA, ADIM 3.1 (packages/db/src/admin-catalog.ts;
 * Asama 5, 3. alan, KARARLAR K-99, K-101): Seçenek Tanımları, Kategoriler ve
 * gruplar. Kurallar demo panelindekiyle aynidir; link degisince eski adres
 * yonlenir, kaldirilan filtre degeri urunden kalkar, kullanilan kayit
 * silinmez, ekran acildiktan sonra degismis kayit kaydedilmez, her degisiklik
 * audit_log'a yazilir. Her test kendi isleminde calisir ve geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const admin: Actor = { id: "u-katalog", name: "Katalog Yöneticisi" };
const T0 = new Date("2026-03-10T09:00:00.000Z");
const T1 = new Date("2026-03-11T09:00:00.000Z");
const T2 = new Date("2026-03-11T10:00:00.000Z");
const ref = (id: string, at = T0) => ({ id, updatedAt: at.toISOString() });
const stale = { ok: false, status: 409, error: tr.panel.staleRecord };

/** Ornek katalog: g1 (kaynak-makineleri) > c1 (kategori-c1) > p1; kayit anlari T0. */
async function withCatalog(run: (db: Db, client: PoolClient) => Promise<void>) {
  await inTransaction(async (client) => {
    await group(client);
    await category(client);
    await product(client, "p1", "ZW-P1");
    for (const table of ["category_groups", "categories", "products"]) {
      await client.query(`UPDATE ${table} SET updated_at = $1`, [T0]);
    }
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

const redirects = async (client: PoolClient) =>
  (await client.query("SELECT old_path, target_type, target_id FROM redirects ORDER BY old_path")).rows;

/** Kategori formunun gonderdigi alanlar. */
const categoryInput = (fields: Record<string, unknown> = {}) => ({
  groupId: "g1",
  name: "Yeni Kategori",
  slug: "yeni-kategori",
  description: "Kısa açıklama",
  optionIds: [],
  filters: [],
  mapping: [],
  ...fields,
});

describe("seçenek tanımları", () => {
  it("yeni tanım eklenir; ad tekil; değer adı yer değiştirebilir; üründe kullanılan değer kaldırılamaz; ekran eskiyse kaydedilmez", async () => {
    await withCatalog(async (db, client) => {
      await optionDefinition(client);
      await client.query("UPDATE option_definitions SET updated_at = $1", [T0]);
      await variant(client, "p1", "3-m", "ZW-P1-3");

      const created = await adminSaveOptionDefinition(
        db,
        admin,
        { name: " Torç Tipi ", values: [{ id: "duz", label: "Düz" }, { id: "egik", label: "Eğik" }] },
        T1,
      );
      expect(created).toMatchObject({ ok: true, updatedAt: T1.toISOString() });
      const id = (created as { id: string }).id;
      // Ayni ad (buyuk-kucuk harf farki sayilmaz) ikinci kez girilemez.
      expect(await adminSaveOptionDefinition(db, admin, { name: "torç tipi", values: [{ id: "x", label: "X" }] }, T1)).toMatchObject({
        ok: false,
        status: 400,
      });
      // Gecersiz deger kimligi: istek reddedilir.
      expect(await adminSaveOptionDefinition(db, admin, { name: "Başka", values: [{ id: "Büyük Harf", label: "X" }] }, T1)).toMatchObject({
        status: 400,
        error: tr.panel.invalidRequest,
      });

      // Urunde kullanilan "3 m" kaldirilamaz.
      expect(
        await adminSaveOptionDefinition(db, admin, { ...ref("uzunluk"), name: "Uzunluk", values: [{ id: "5-m", label: "5 m" }] }, T1),
      ).toEqual({ ok: false, status: 409, error: optionValueInUseText("3 m", 1) });
      // Adlar yer degistirir (tekil ad kurali araya takilmaz); kullanilmayan deger eklenir.
      const values = [
        { id: "5-m", label: "3 m" },
        { id: "3-m", label: "5 m" },
        { id: "8-m", label: "8 m" },
      ];
      expect(await adminSaveOptionDefinition(db, admin, { ...ref("uzunluk"), name: "Kablo Uzunluğu", values }, T1)).toEqual({
        ok: true,
        updatedAt: T1.toISOString(),
        id: "uzunluk",
      });
      expect(await adminSaveOptionDefinition(db, admin, { ...ref("uzunluk"), name: "Uzunluk", values }, T2)).toEqual(stale);

      const panel = await readCatalogPanel(db);
      expect(panel.optionDefinitions.find((o) => o.id === "uzunluk")).toEqual({
        id: "uzunluk",
        name: "Kablo Uzunluğu",
        values,
        updatedAt: T1.toISOString(),
      });
      expect(panel.optionDefinitions.find((o) => o.id === id)?.values.map((v) => v.label)).toEqual(["Düz", "Eğik"]);
      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_type, r.entity_label])).toEqual([
        ["create", "option_definitions", "Torç Tipi"],
        ["update", "option_definitions", "Kablo Uzunluğu"],
      ]);
      expect(rows[1].changes.name).toEqual(["Uzunluk", "Kablo Uzunluğu"]);
    });
  });

  it("üründe kullanılan tanım silinmez; kullanılmayan silinir, listelendiği kategorinin kayıt anı değişir", async () => {
    await withCatalog(async (db, client) => {
      await optionDefinition(client);
      await optionDefinition(client, "tip", "Tip");
      await client.query("UPDATE option_definitions SET updated_at = $1", [T0]);
      await variant(client, "p1", "3-m", "ZW-P1-3");
      await client.query("INSERT INTO category_option_definitions (category_id, option_definition_id, position) VALUES ('c1', 'tip', 0)");

      expect(await adminDeleteOptionDefinition(db, admin, ref("uzunluk"), T1)).toEqual({
        ok: false,
        status: 409,
        error: optionInUseText("Uzunluk", 1),
      });
      expect(await adminDeleteOptionDefinition(db, admin, ref("tip", T1), T1)).toEqual(stale);
      expect(await adminDeleteOptionDefinition(db, admin, ref("tip"), T1)).toEqual({ ok: true });

      expect((await client.query("SELECT id FROM option_definitions ORDER BY id")).rows).toEqual([{ id: "uzunluk" }]);
      expect((await client.query("SELECT count(*)::int AS n FROM category_option_definitions")).rows[0].n).toBe(0);
      // Acik kategori formu silinen tanimi listeye geri yazamaz.
      expect((await client.query("SELECT updated_at FROM categories WHERE id = 'c1'")).rows[0].updated_at).toEqual(T1);
      expect((await audit(client))[0]).toMatchObject({
        action: "delete",
        entity_id: "tip",
        changes: { name: "Tip", categories: ["c1"], values: [{ id: "3-m", label: "3 m" }, { id: "5-m", label: "5 m" }] },
      });
    });
  });
});

describe("kategoriler", () => {
  it("yeni kategori grubun sonuna eklenir; link tekil; yüklenen görsel, olmayan grup ve silinmiş seçenek reddedilir", async () => {
    await withCatalog(async (db, client) => {
      // Yeni kategorinin adresi baska bir kaydin eski adresiyse o yonlendirme kalkar.
      await client.query(
        "INSERT INTO redirects (old_path, target_type, target_id) VALUES ('/ekipmanlar/kaynak-makineleri/yeni-kategori', 'category', 'c1')",
      );

      expect(await adminSaveCategory(db, admin, categoryInput({ slug: "kategori-c1" }), T1)).toEqual({
        ok: false,
        status: 409,
        error: categorySlugTakenText("kategori-c1", "Kategori"),
      });
      expect(await adminSaveCategory(db, admin, categoryInput({ image: "data:image/png;base64,AAAA" }), T1)).toEqual({
        ok: false,
        status: 400,
        error: tr.panel.uploadDisabled,
      });
      expect(await adminSaveCategory(db, admin, categoryInput({ groupId: "yok" }), T1)).toMatchObject({ status: 400, error: "Bir grup seçin." });
      expect(await adminSaveCategory(db, admin, categoryInput({ optionIds: ["silinmis"] }), T1)).toMatchObject({
        status: 400,
        error: tr.panel.optionsMissing,
      });
      expect(await adminSaveCategory(db, admin, categoryInput({ slug: "Boşluklu Link" }), T1)).toMatchObject({
        status: 400,
        error: tr.panel.invalidRequest,
      });

      const answer = await adminSaveCategory(db, admin, categoryInput({ image: "/images/categories/yeni.svg" }), T1);
      expect(answer).toMatchObject({ ok: true, updatedAt: T1.toISOString() });
      const id = (answer as { id: string }).id;
      const created = (await readCatalogPanel(db)).categories.find((c) => c.id === id);
      expect(created).toMatchObject({
        slug: "yeni-kategori",
        section: "ekipmanlar",
        group: "kaynak-makineleri",
        name: "Yeni Kategori",
        image: "/images/categories/yeni.svg",
        order: 2,
        updatedAt: T1.toISOString(),
      });
      expect(await redirects(client)).toEqual([]);
      const [row] = await audit(client);
      expect(row).toMatchObject({ action: "create", entity_type: "categories", entity_id: id, entity_label: "Yeni Kategori" });
      expect(row.changes).toMatchObject({ slug: "yeni-kategori", group: "kaynak-makineleri", filters: null });
    });
  });

  it("link ve grup değişince eski adres yönlenir; kaldırılan filtre değeri üründen kalkar; eşleme tablosu yazılır, ürün eskiyse kaydedilmez", async () => {
    await withCatalog(async (db, client) => {
      await group(client, "g2", "plazma");
      await product(client, "p2", "ZW-P2");
      await client.query("UPDATE products SET updated_at = $1", [T0]);
      await client.query("INSERT INTO category_filters (category_id, id, name, position) VALUES ('c1', 'seri', 'Seri', 0)");
      await client.query(
        "INSERT INTO category_filter_values (category_id, filter_id, id, label, position) VALUES ('c1', 'seri', 'a', 'A', 0), ('c1', 'seri', 'b', 'B', 1)",
      );
      await client.query(
        "INSERT INTO product_filter_values (product_id, category_id, filter_id, value_id) VALUES ('p1', 'c1', 'seri', 'a'), ('p2', 'c1', 'seri', 'b')",
      );

      // "B" degeri kalkar, "Güç" filtresi eklenir; eslesme tablosunda p1'e "Güç: X" verilir.
      const filters = [
        { id: "seri", name: "Seri", values: [{ id: "a", label: "A" }] },
        { id: "guc", name: "Güç", values: [{ id: "x", label: "X" }] },
      ];
      const input = categoryInput({ ...ref("c1"), name: "Kategori", slug: "yeni-link", description: "", filters });
      const mapping = [{ ...ref("p1"), productId: "p1", values: { seri: ["a"], guc: ["x"] } }];
      expect(await adminSaveCategory(db, admin, { ...input, mapping }, T1)).toEqual({ ok: true, updatedAt: T1.toISOString(), id: "c1" });

      expect(await redirects(client)).toEqual([
        { old_path: "/ekipmanlar/kaynak-makineleri/kategori-c1", target_type: "category", target_id: "c1" },
      ]);
      const values = (await client.query("SELECT product_id, filter_id, value_id FROM product_filter_values ORDER BY 1, 2")).rows;
      expect(values).toEqual([
        { product_id: "p1", filter_id: "guc", value_id: "x" },
        { product_id: "p1", filter_id: "seri", value_id: "a" },
      ]);
      // p2'nin degeri kalkti; acik urun formu eski degeri geri yazamaz.
      const stamps = (await client.query("SELECT id, updated_at FROM products ORDER BY id")).rows;
      expect(stamps).toEqual([
        { id: "p1", updated_at: T1 },
        { id: "p2", updated_at: T1 },
      ]);

      // Urun ekran acildiktan sonra degisti (T1): eslesme tablosu kaydedilmez.
      const again = [{ ...ref("p1"), productId: "p1", values: { seri: [], guc: ["x"] } }];
      expect(await adminSaveCategory(db, admin, { ...input, ...ref("c1", T1), mapping: again }, T2)).toEqual(stale);
      // Kategori ekran acildiktan sonra degisti.
      expect(await adminSaveCategory(db, admin, input, T2)).toEqual(stale);

      // Grup degisir: eski adres yeni adrese yonlenir, onceki yonlendirme de yeni adrese gider.
      expect(await adminSaveCategory(db, admin, { ...input, ...ref("c1", T1), groupId: "g2" }, T2)).toMatchObject({ ok: true });
      expect(await redirects(client)).toEqual([
        { old_path: "/ekipmanlar/kaynak-makineleri/kategori-c1", target_type: "category", target_id: "c1" },
        { old_path: "/ekipmanlar/kaynak-makineleri/yeni-link", target_type: "category", target_id: "c1" },
      ]);
      const moved = (await readCatalogPanel(db)).categories.find((c) => c.id === "c1")!;
      expect([moved.group, moved.previousPaths?.sort()]).toEqual([
        "plazma",
        ["/ekipmanlar/kaynak-makineleri/kategori-c1", "/ekipmanlar/kaynak-makineleri/yeni-link"],
      ]);
      // Urun kategoriye kimlikle bagli: yeni adreste ayni urunler.
      expect((await readCatalogPanel(db)).products.filter((p) => p.categorySlug === "yeni-link").map((p) => p.id)).toEqual(["p1", "p2"]);

      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_type, r.entity_id])).toEqual([
        ["update", "products", "p1"],
        ["update", "categories", "c1"],
        ["update", "categories", "c1"],
      ]);
      expect(rows[0].changes).toEqual({ filterValues: [{ seri: ["a"] }, { seri: ["a"], guc: ["x"] }] });
      expect(Object.keys(rows[1].changes).sort()).toEqual(["filters", "slug"]);
      expect(rows[2].changes).toEqual({ group: ["kaynak-makineleri", "plazma"] });
    });
  });

  it("değişiklik yoksa ürünlerin kayıt anı değişmez (filtre değerleri sırasız okunur)", async () => {
    await withCatalog(async (db, client) => {
      await client.query("INSERT INTO category_filters (category_id, id, name, position) VALUES ('c1', 'seri', 'Seri', 0)");
      await client.query(
        "INSERT INTO category_filter_values (category_id, filter_id, id, label, position) VALUES ('c1', 'seri', 'a', 'A', 0), ('c1', 'seri', 'b', 'B', 1)",
      );
      // Tabloya ters sirayla yazilmis degerler.
      await client.query(
        "INSERT INTO product_filter_values (product_id, category_id, filter_id, value_id) VALUES ('p1', 'c1', 'seri', 'b'), ('p1', 'c1', 'seri', 'a')",
      );
      const filters = [{ id: "seri", name: "Seri", values: [{ id: "a", label: "A" }, { id: "b", label: "B" }] }];
      const mapping = [{ ...ref("p1"), productId: "p1", values: { seri: ["a", "b"] } }];
      const input = categoryInput({ ...ref("c1"), name: "Kategori", slug: "kategori-c1", description: "", filters, mapping });
      expect(await adminSaveCategory(db, admin, input, T1)).toMatchObject({ ok: true });
      expect((await client.query("SELECT updated_at FROM products WHERE id = 'p1'")).rows[0].updated_at).toEqual(T0);
      expect((await audit(client)).map((r) => r.entity_type)).toEqual([]);
    });
  });

  it("ürünü olan kategori silinmez; boş kategori yönlendirmeleriyle silinir; oklar sırayı değiştirir", async () => {
    await withCatalog(async (db, client) => {
      await category(client, "c2", "g1");
      await category(client, "c3", "g1");
      await client.query("UPDATE categories SET position = 2 WHERE id = 'c2'");
      await client.query("UPDATE categories SET position = 3, updated_at = $1 WHERE id = 'c3'", [T0]);
      await client.query("INSERT INTO redirects (old_path, target_type, target_id) VALUES ('/ekipmanlar/eski/c3', 'category', 'c3')");

      expect(await adminDeleteCategory(db, admin, ref("c1"), T1)).toEqual({ ok: false, status: 409, error: CATEGORY_HAS_PRODUCTS });
      expect(await adminDeleteCategory(db, admin, ref("c3", T1), T1)).toEqual(stale);
      expect(await adminDeleteCategory(db, admin, ref("c3"), T1)).toEqual({ ok: true });
      expect(await redirects(client)).toEqual([]);

      expect(await adminMoveCategory(db, admin, { id: "c1", direction: -1 }, T1)).toEqual({ ok: true });
      expect(await adminMoveCategory(db, admin, { id: "c2", direction: -1 }, T1)).toEqual({ ok: true });
      expect(await adminMoveCategory(db, admin, { id: "c2", direction: 2 }, T1)).toMatchObject({ status: 400 });
      const order = (await client.query("SELECT id, position, updated_at FROM categories ORDER BY position")).rows;
      expect(order.map((r) => [r.id, r.position])).toEqual([
        ["c2", 1],
        ["c1", 2],
      ]);
      // Sira kaydin icerigi degildir: acik form eskimez.
      expect(order.find((r) => r.id === "c1").updated_at).toEqual(T0);

      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_id, r.changes.position ?? null])).toEqual([
        ["delete", "c3", null],
        ["update", "c2", [2, 1]],
        ["update", "c1", [1, 2]],
      ]);
    });
  });
});

describe("gruplar", () => {
  it("link değişince grubun ve kategorilerinin eski adresleri yönlenir; bölüm değişmez; link bölümde tekil", async () => {
    await withCatalog(async (db, client) => {
      await group(client, "g2", "plazma");
      await client.query("UPDATE category_groups SET updated_at = $1", [T0]);

      const input = { ...ref("g1"), section: "aksesuarlar", name: "Kaynak", slug: "kaynak" };
      expect(await adminSaveGroup(db, admin, { ...input, slug: "plazma" }, T1)).toEqual({
        ok: false,
        status: 409,
        error: groupSlugTakenText("plazma", "Grup"),
      });
      expect(await adminSaveGroup(db, admin, { ...input, image: "data:image/png;base64,AAAA" }, T1)).toMatchObject({
        status: 400,
        error: tr.panel.uploadDisabled,
      });
      expect(await adminSaveGroup(db, admin, input, T1)).toEqual({ ok: true, updatedAt: T1.toISOString(), id: "g1" });
      expect(await adminSaveGroup(db, admin, { ...input, name: "Kaynak Makineleri" }, T2)).toEqual(stale);

      expect(await redirects(client)).toEqual([
        { old_path: "/ekipmanlar/kaynak-makineleri", target_type: "group", target_id: "g1" },
        { old_path: "/ekipmanlar/kaynak-makineleri/kategori-c1", target_type: "category", target_id: "c1" },
      ]);
      const panel = await readCatalogPanel(db);
      expect(panel.categoryGroups.find((g) => g.id === "g1")).toMatchObject({ section: "ekipmanlar", slug: "kaynak", name: "Kaynak" });
      expect(panel.categories.find((c) => c.id === "c1")).toMatchObject({ group: "kaynak" });

      // Yeni grup bolumun sonuna eklenir.
      const created = await adminSaveGroup(db, admin, { section: "aksesuarlar", name: "Torçlar", slug: "torclar" }, T1);
      expect(created).toMatchObject({ ok: true });
      expect((await readCatalogPanel(db)).categoryGroups.find((g) => g.id === (created as { id: string }).id)).toMatchObject({
        section: "aksesuarlar",
        order: 1,
      });
      expect(await adminSaveGroup(db, admin, { section: "uydurma", name: "X", slug: "x" }, T1)).toMatchObject({ status: 400 });

      const rows = await audit(client);
      expect(rows.map((r) => [r.action, r.entity_type, r.entity_label])).toEqual([
        ["update", "category_groups", "Kaynak"],
        ["create", "category_groups", "Torçlar"],
      ]);
      expect(rows[0].changes).toEqual({ name: ["Grup", "Kaynak"], slug: ["kaynak-makineleri", "kaynak"] });
    });
  });

  it("kategorisi olan grup silinmez; boş grup silinir; oklar sırayı değiştirir", async () => {
    await withCatalog(async (db, client) => {
      await group(client, "g2", "plazma");
      await client.query("UPDATE category_groups SET position = 2, updated_at = $1 WHERE id = 'g2'", [T0]);

      expect(await adminDeleteGroup(db, admin, ref("g1"), T1)).toEqual({ ok: false, status: 409, error: GROUP_HAS_CATEGORIES });
      expect(await adminMoveGroup(db, admin, { id: "g2", direction: -1 }, T1)).toEqual({ ok: true });
      expect((await client.query("SELECT id FROM category_groups ORDER BY position")).rows.map((r) => r.id)).toEqual(["g2", "g1"]);
      expect(await adminDeleteGroup(db, admin, ref("g2"), T1)).toEqual({ ok: true });
      expect((await client.query("SELECT id FROM category_groups")).rows).toEqual([{ id: "g1" }]);
      expect((await audit(client)).map((r) => [r.action, r.entity_id])).toEqual([
        ["update", "g2"],
        ["update", "g1"],
        ["delete", "g2"],
      ]);
    });
  });
});

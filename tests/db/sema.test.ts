import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import {
  category,
  closePool,
  expectFailure,
  group,
  inTransaction,
  optionDefinition,
  product,
  user,
  variant,
} from "./ortak";

/* docs/VERITABANI.md: tablolar ve veritabaninda saglanan kurallar */

afterAll(closePool);

const doc = (name: string) => readFileSync(new URL(`../../docs/${name}`, import.meta.url), "utf8");

describe("tablolar belgeyle aynı", () => {
  it("veritabanındaki tablolar VERITABANI.md › Tablo listesi ile aynı", async () => {
    const list = doc("VERITABANI.md").split("## 12. Tablo listesi")[1].split("\n## ")[0];
    const documented = [...list.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]).sort();
    await inTransaction(async (db) => {
      const { rows } = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
      );
      expect(rows.map((r) => r.table_name).sort()).toEqual(documented);
    });
  });

  it("her kolon belgede yazılı (VERITABANI.md, stok tabloları STOK.md)", async () => {
    const text = doc("VERITABANI.md") + doc("STOK.md");
    await inTransaction(async (db) => {
      const { rows } = await db.query(
        "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'",
      );
      const missing = rows
        .filter((r) => !text.includes(`\`${r.column_name}\``) && !new RegExp(`\\b${r.column_name}\\b`).test(stockSql(text)))
        .map((r) => `${r.table_name}.${r.column_name}`);
      expect(missing).toEqual([]);
    });
  });
});

/** STOK.md'deki SQL bloklari (kolonlar orada tirnaksiz yazili). */
function stockSql(text: string): string {
  return [...text.matchAll(/```sql([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
}

describe("ürün ve varyant kodları tek havuzda", () => {
  it("aynı kod ikinci kez girilemez; boşluk ve büyük/küçük harf fark etmez", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db);
      await optionDefinition(db);
      await product(db, "p1", "ZW-100");
      const sameProductCode = await expectFailure(
        db,
        "INSERT INTO products (id, slug, sku, name, category_id, price_ex_vat, vat_rate, warranty_months) VALUES ('p2', 'p2', 'zw-1 00', 'Ürün', 'c1', 1, 20, 24)",
      );
      expect(sameProductCode.code).toBe("23505");
      expect(sameProductCode.message).toContain("Ürün kodu");

      // Varyant kodu ürün koduyla, başka ürünle ya da başka varyantla aynı olamaz.
      await variant(db, "p1", "3-m", "ZW-100-3M");
      expect((await expectFailure(db, "UPDATE product_variants SET sku = 'ZW-100' WHERE id = '3-m'")).code).toBe("23505");
      await product(db, "p2", "ZW-200");
      expect((await expectFailure(db, "UPDATE products SET sku = 'zw-100-3m' WHERE id = 'p2'")).code).toBe("23505");
    });
  });

  it("kod değişince eski kod boşa çıkar; ürün silinince kodları da silinir", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db);
      await optionDefinition(db);
      await product(db, "p1", "ZW-100");
      await variant(db, "p1", "3-m", "ZW-100-3M");
      await db.query("UPDATE products SET sku = 'ZW-101' WHERE id = 'p1'");
      await product(db, "p2", "ZW-100");
      await db.query("DELETE FROM products WHERE id = 'p1'");
      const { rows } = await db.query("SELECT code FROM sku_codes ORDER BY code");
      expect(rows.map((r) => r.code)).toEqual(["ZW-100"]);
    });
  });
});

describe("Türkçe büyük/küçük harf duyarsız benzersizlik", () => {
  it("seçenek tanımı adı: Işık = IŞIK, İzmir = izmir; Isık farklı", async () => {
    await inTransaction(async (db) => {
      await optionDefinition(db, "a", "Işık");
      expect((await expectFailure(db, "INSERT INTO option_definitions (id, name, position) VALUES ('b', 'IŞIK', 2)")).code).toBe("23505");
      await optionDefinition(db, "c", "İzmir");
      expect((await expectFailure(db, "INSERT INTO option_definitions (id, name, position) VALUES ('d', 'izmir', 3)")).code).toBe("23505");
      await db.query("INSERT INTO option_definitions (id, name, position) VALUES ('e', 'Isık', 4)");
    });
  });

  it("üye e-postası büyük/küçük harf duyarsız benzersiz", async () => {
    await inTransaction(async (db) => {
      await user(db, "u1", "Ahmet@Ornek.com");
      const failure = await expectFailure(
        db,
        "INSERT INTO users (id, role, email, password_hash, first_name, last_name, phone) VALUES ('u2', 'individual', 'ahmet@ornek.COM', 'x', 'A', 'B', '1')",
      );
      expect(failure.code).toBe("23505");
    });
  });
});

describe("silme kuralları (VERI-MODELI › Silme kuralları)", () => {
  it("içinde ürün olan kategori, içinde kategori olan grup silinmez", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db);
      await product(db, "p1", "ZW-1");
      expect((await expectFailure(db, "DELETE FROM categories WHERE id = 'c1'")).code).toBe("23503");
      expect((await expectFailure(db, "DELETE FROM category_groups WHERE id = 'g1'")).code).toBe("23503");
    });
  });

  it("ürün silinince stok ve yönlendirmeleri silinir; sipariş satırı kopyasıyla kalır", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db);
      await product(db, "p1", "ZW-1");
      await db.query(
        `INSERT INTO dealers (id, name, city, district, address, phone, lat, lng, working_hours)
         VALUES ('d1', 'Bayi', 'İzmir', 'Bornova', 'Adres', '1', 38.4, 27.1, '09-18')`,
      );
      await db.query(
        "INSERT INTO dealer_stock (dealer_id, product_id, sku, quantity, updated_at) VALUES ('d1', 'p1', 'ZW-1', 3, now())",
      );
      await db.query("INSERT INTO redirects (old_path, target_type, target_id) VALUES ('/urun/eski', 'product', 'p1')");
      await user(db, "u1", "a@ornek.com");
      await db.query(
        `INSERT INTO orders (id, code, user_id, status, customer_name, email, phone, shipping_address, invoice,
           subtotal, vat, shipping, total, payment_method, terms_accepted_at)
         VALUES ('o1', 'SIP-2026-00001', 'u1', 'preparing', 'Ad', 'a@ornek.com', '1', '{}', '{}', 1200, 200, 0, 1200, 'card', now())`,
      );
      await db.query(
        `INSERT INTO order_items (order_id, line, product_id, product_name, sku, quantity, unit_price_ex_vat, vat_rate, unit_price)
         VALUES ('o1', 0, 'p1', 'Ürün p1', 'ZW-1', 1, 1000, 20, 1200)`,
      );

      await db.query("DELETE FROM products WHERE id = 'p1'");
      const count = async (table: string) => Number((await db.query(`SELECT count(*) FROM ${table}`)).rows[0].count);
      expect(await count("dealer_stock")).toBe(0);
      expect(await count("redirects")).toBe(0);
      const { rows } = await db.query("SELECT product_id, product_name, sku FROM order_items");
      expect(rows).toEqual([{ product_id: null, product_name: "Ürün p1", sku: "ZW-1" }]);
    });
  });

  it("bir üründe kullanılan seçenek tanımı ve değeri silinmez", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db);
      await optionDefinition(db);
      await product(db, "p1", "ZW-1");
      await variant(db, "p1", "3-m", "ZW-1-3M");
      expect((await expectFailure(db, "DELETE FROM option_values WHERE id = '3-m'")).code).toBe("23503");
      expect((await expectFailure(db, "DELETE FROM option_definitions WHERE id = 'uzunluk'")).code).toBe("23503");
      // Kullanılmayan değer silinir.
      await db.query("DELETE FROM option_values WHERE id = '5-m'");
    });
  });
});

describe("kategori filtreleri (KARARLAR K-76)", () => {
  it("ürüne yalnızca kendi kategorisinin filtre değeri işaretlenir; taşınınca eski değerler silinir", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db, "c1");
      await category(db, "c2");
      for (const c of ["c1", "c2"]) {
        await db.query("INSERT INTO category_filters (category_id, id, name, position) VALUES ($1, 'seri', 'Seri', 1)", [c]);
        await db.query(
          "INSERT INTO category_filter_values (category_id, filter_id, id, label, position) VALUES ($1, 'seri', 'ultimate', 'Ultimate', 1)",
          [c],
        );
      }
      await product(db, "p1", "ZW-1", "c1");
      const wrong = await expectFailure(
        db,
        "INSERT INTO product_filter_values (product_id, category_id, filter_id, value_id) VALUES ('p1', 'c2', 'seri', 'ultimate')",
      );
      expect(wrong.code).toBe("23514");
      await db.query(
        "INSERT INTO product_filter_values (product_id, category_id, filter_id, value_id) VALUES ('p1', 'c1', 'seri', 'ultimate')",
      );
      await db.query("UPDATE products SET category_id = 'c2' WHERE id = 'p1'");
      expect((await db.query("SELECT * FROM product_filter_values")).rows).toEqual([]);
    });
  });
});

describe("tek olması gerekenler", () => {
  it("üyenin en fazla bir varsayılan adresi, en fazla bir varsayılan POS", async () => {
    await inTransaction(async (db) => {
      await user(db, "u1", "a@ornek.com");
      const address = (id: string) =>
        `INSERT INTO addresses (id, user_id, title, full_name, phone, city, district, line, is_default)
         VALUES ('${id}', 'u1', 'Ev', 'Ad', '1', 'İzmir', 'Bornova', 'Adres', true)`;
      await db.query(address("a1"));
      expect((await expectFailure(db, address("a2"))).code).toBe("23505");
      const pos = (id: string) =>
        `INSERT INTO payment_pos (id, bank_short_name, name, merchant_no, pos_name, is_default, position)
         VALUES ('${id}', 'Banka', 'Banka', '000', 'POS', true, 1)`;
      await db.query(pos("pos1"));
      expect((await expectFailure(db, pos("pos2"))).code).toBe("23505");
    });
  });

  it("kayıt numarası tek işlemde artar; silinen numara yeniden verilmez", async () => {
    await inTransaction(async (db) => {
      const next = async (prefix: string) => (await db.query("SELECT next_record_number($1) AS n", [prefix])).rows[0].n;
      expect(await next("TKL-2026-")).toBe(1);
      expect(await next("TKL-2026-")).toBe(2);
      await db.query("UPDATE record_counters SET last_number = 49 WHERE prefix = 'TKL-2026-'");
      expect(await next("TKL-2026-")).toBe(50);
      expect(await next("SIP-2026-")).toBe(1);
    });
  });
});

describe("değişiklik kaydı (audit_log, KARARLAR K-81)", () => {
  it("yalnızca eklenir: değiştirilemez, elle silinemez", async () => {
    await inTransaction(async (db) => {
      await db.query(
        "INSERT INTO audit_log (actor_name, action, entity_type, entity_id) VALUES ('Yönetici', 'update', 'products', 'p1')",
      );
      expect((await expectFailure(db, "UPDATE audit_log SET actor_name = 'Başkası'")).code).toBe("42501");
      expect((await expectFailure(db, "DELETE FROM audit_log")).code).toBe("42501");
      expect((await expectFailure(db, "TRUNCATE audit_log")).code).toBe("42501");
    });
  });

  it("2 yıldan eski kayıtları yalnızca purge_audit_log() siler", async () => {
    await inTransaction(async (db) => {
      await db.query(
        `INSERT INTO audit_log (at, actor_name, action, entity_type, entity_id) VALUES
           (now() - interval '3 years', 'Yönetici', 'login', 'users', 'u1'),
           (now() - interval '1 year', 'Yönetici', 'login', 'users', 'u1')`,
      );
      expect((await db.query("SELECT purge_audit_log() AS n")).rows[0].n).toBe(1);
      expect(Number((await db.query("SELECT count(*) FROM audit_log")).rows[0].count)).toBe(1);
      // Temizlikten sonra koruma yine çalışır.
      expect((await expectFailure(db, "DELETE FROM audit_log")).code).toBe("42501");
    });
  });
});

describe("değer kontrolleri", () => {
  it("geçersiz değerler kaydedilmez", async () => {
    await inTransaction(async (db) => {
      await group(db);
      await category(db);
      await product(db, "p1", "ZW-1");
      expect((await expectFailure(db, "UPDATE products SET discount_percent = 95 WHERE id = 'p1'")).code).toBe("23514");
      expect((await expectFailure(db, "UPDATE products SET currency = 'USD' WHERE id = 'p1'")).code).toBe("23514");
      expect((await expectFailure(db, "UPDATE category_groups SET section = 'baska'")).code).toBe("23514");
      expect(
        (await expectFailure(db, "INSERT INTO email_recipients (type, recipients) VALUES ('teklif', ARRAY[]::text[])")).code,
      ).toBe("23514");
    });
  });
});

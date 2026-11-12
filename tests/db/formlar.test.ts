import { afterAll, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { quoteCodePrefix, serviceCodePrefix } from "@zenweld/data";
import {
  createQuote,
  createReview,
  createServiceRequest,
  findWarranty,
  logEmail,
  memberQuotes,
  memberWarranties,
  readCatalog,
  registerWarranty,
  saveDealerApplication,
  saveSupportMessage,
  type FormCatalog,
  type Member,
} from "../../packages/db/src";
import * as schema from "../../packages/db/src/schema";
import { category, closePool, expectFailure, group, inTransaction, optionDefinition, product, user, variant } from "./ortak";

/*
 * FORMLAR SUNUCUDA (packages/db/src/forms.ts; Asama 5.3). Her test kendi
 * isleminde calisir ve sonunda geri alinir.
 */

afterAll(closePool);

type Db = NodePgDatabase<typeof schema>;

const member: Member = { id: "u-a", role: "individual", email: "a@ornek.com", firstName: "Ad", lastName: "Soyad", phone: "0555" };

async function withCatalog(run: (db: Db, client: PoolClient, catalog: FormCatalog) => Promise<void>) {
  await inTransaction(async (client) => {
    await user(client, "u-a", "a@ornek.com");
    await group(client);
    await category(client, "c1", "g1", "mig");
    await product(client, "p1", "ZW-P1");
    await product(client, "torc", "ZW-TORC");
    await optionDefinition(client);
    await variant(client, "torc", "5-m", "ZW-TORC-5M");
    const db = drizzle(client, { schema });
    await run(db, client, await readCatalog(db));
  });
}

const contact = {
  companyName: "Firma",
  contactName: "Ad Soyad",
  email: "firma@ornek.com",
  phone: "0555",
  city: "Konya",
  paymentPreference: "vadeli",
  termDays: 60,
};

describe("Teklif Al", () => {
  it("kaydedilir; ürün adı, kod ve seçenek katalogdan alınır; numara TKL; üyenin tekliflerinde görünür", async () => {
    await withCatalog(async (db, _client, catalog) => {
      const at = new Date();
      const result = await createQuote(
        db,
        member,
        { ...contact, companyName: "", items: [{ productId: "torc", variantId: "5-m", quantity: 2, productName: "sahte ad" }] },
        at,
        catalog,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.quote).toMatchObject({
        code: expect.stringMatching(new RegExp(`^${quoteCodePrefix(at)}\\d{4}$`)),
        userId: "u-a",
        status: "new",
        termDays: 60,
        items: [{ productId: "torc", productName: "Ürün torc", sku: "ZW-TORC-5M", variantLabel: "Uzunluk: 5 m", quantity: 2 }],
      });
      expect((await memberQuotes(db, "u-a")).map((q) => q.code)).toEqual([result.quote.code]);
    });
  });

  it("eksik bilgi, geçersiz e-posta, boş liste, satıştan kalkan ürün ya da seçenek kabul edilmez", async () => {
    await withCatalog(async (db, client, catalog) => {
      const at = new Date();
      const items = [{ productId: "p1", quantity: 1 }];
      const error = async (input: Record<string, unknown>, who: Member | null = null) => {
        const result = await createQuote(db, who, { ...contact, items, ...input }, at, catalog);
        return result.ok ? "kaydedildi" : result.error;
      };
      // Ziyaretci ve kurumsal uyede firma adi zorunlu; bireysel uyede degil.
      expect(await error({ companyName: "" })).toMatch(/zorunlu alanları/);
      expect(await error({ companyName: "" }, member)).toBe("kaydedildi");
      expect(await error({ email: "yok" })).toBe("Lütfen geçerli bir e-posta adresi girin.");
      expect(await error({ items: [] })).toMatch(/Teklif listeniz boş/);
      expect(await error({ items: [{ productId: "torc", quantity: 1 }] })).toMatch(/Teklif listenizdeki bazı ürünler/);
      expect(await error({ items: [{ productId: "p1", quantity: 0 }] })).toMatch(/Teklif listenizdeki bazı ürünler/);
      expect(await error({ termDays: 7 })).toMatch(/zorunlu alanları/);
      await client.query("UPDATE products SET active = false WHERE id = 'p1'");
      expect(await error({}, null)).toBe("kaydedildi"); // katalog ayni (onbellek); yeni katalogla:
      const fresh = await readCatalog(db);
      const refused = await createQuote(db, null, { ...contact, items }, at, fresh);
      expect(refused).toMatchObject({ ok: false, status: 409 });
    });
  });
});

describe("Servis talebi", () => {
  const request = {
    categorySlug: "mig",
    productId: "p1",
    complaint: "Çalışmıyor",
    companyName: "Firma",
    address: "Adres",
    city: "Konya",
    district: "Selçuklu",
    email: "firma@ornek.com",
    phone: "0555",
    contactName: "Yetkili",
    contactGsm: "0532",
    reasons: ["onarim", "uydurma"],
    consent: true,
  };

  it("kaydedilir (numara SRV, model adı katalogdan); eksik alan, neden ya da onay yoksa kabul edilmez", async () => {
    await withCatalog(async (db, _client, catalog) => {
      const at = new Date();
      const ok = await createServiceRequest(db, null, request, at, catalog);
      expect(ok.ok && ok.request).toMatchObject({
        code: expect.stringMatching(new RegExp(`^${serviceCodePrefix(at)}\\d{4}$`)),
        categorySlug: "mig",
        productName: "Ürün p1",
        reasons: ["onarim"],
        status: "new",
      });
      const error = async (input: Record<string, unknown>) => {
        const result = await createServiceRequest(db, null, { ...request, ...input }, at, catalog);
        return result.ok ? "kaydedildi" : result.error;
      };
      expect(await error({ district: " " })).toBe("Lütfen zorunlu alanları doldurun.");
      expect(await error({ categorySlug: "baska" })).toBe("Lütfen zorunlu alanları doldurun.");
      expect(await error({ reasons: [] })).toBe("En az bir servis talep nedeni seçin.");
      expect(await error({ consent: false })).toMatch(/gizlilik sözleşmesini/);
    });
  });
});

describe("Garanti", () => {
  const warranty = {
    ownerName: "Ad Soyad",
    email: "A@Ornek.com",
    phone: "0555",
    city: "Konya",
    postalCode: "42000",
    address: "Adres",
    categorySlug: "mig",
    productId: "p1",
    serialNumber: " zw-2026-001 ",
    sellerTaxNumber: "1234567890",
    extended: true,
  };

  it("kayıt: seri no büyük harfle, bitiş Türkiye günü + garanti + 12 ay; aynı seri ikinci kez kaydedilmez", async () => {
    await withCatalog(async (db, _client, catalog) => {
      // 15.03 00:30 Turkiye = 14.03 21:30 UTC.
      const at = new Date("2026-03-15T00:30:00+03:00");
      const saved = await registerWarranty(db, warranty, at, catalog);
      expect(saved.ok && saved.warranty).toMatchObject({
        serialNumber: "ZW-2026-001",
        email: "a@ornek.com",
        expiresAt: "2029-03-15",
        extended: true,
      });
      expect(await registerWarranty(db, { ...warranty, serialNumber: "ZW-2026-001" }, at, catalog)).toEqual({
        ok: false,
        status: 409,
        error: "Bu seri numarası daha önce kaydedilmiş.",
      });
      const error = async (input: Record<string, unknown>) => {
        const result = await registerWarranty(db, { ...warranty, serialNumber: "YENI-1", ...input }, at, catalog);
        return result.ok ? "kaydedildi" : result.error;
      };
      expect(await error({ postalCode: "420" })).toBe("Posta kodu 5 haneli olmalıdır.");
      expect(await error({ sellerTaxNumber: "123" })).toMatch(/Satıcı VKN/);
      expect(await error({ address: "" })).toBe("Lütfen zorunlu alanları doldurun.");

      // Sorgulama: yalnizca karttaki bilgiler; buyuk/kucuk harf ve bosluk fark etmez.
      expect(await findWarranty(db, "  zw-2026-001")).toEqual({
        serialNumber: "ZW-2026-001",
        productId: "p1",
        ownerName: "Ad Soyad",
        registeredAt: at.toISOString(),
        expiresAt: "2029-03-15",
        extended: true,
      });
      expect(await findWarranty(db, "YOK")).toBeNull();
      expect(await memberWarranties(db, "A@ORNEK.COM")).toHaveLength(1);
    });
  });
});

describe("Ürün yorumu", () => {
  it("onay bekler; üyenin yorumu doğrulanmış alıcı; geçersiz puan, dosya ya da ürün kabul edilmez", async () => {
    await withCatalog(async (db, client, catalog) => {
      const at = new Date();
      const input = { productId: "p1", rating: 4, authorName: "Ad", body: "İyi", media: [{ kind: "image", url: "data:image/webp;base64,AAAA" }] };
      const saved = await createReview(db, member, input, at, catalog);
      expect(saved.ok && saved.review).toMatchObject({ approved: false, featured: false, verifiedPurchase: true, rating: 4, userId: "u-a" });
      const guest = await createReview(db, null, input, at, catalog);
      expect(guest.ok && guest.review.verifiedPurchase).toBe(false);
      expect(await createReview(db, null, { ...input, rating: 6 }, at, catalog)).toMatchObject({ error: "Lütfen puan verin." });
      expect(await createReview(db, null, { ...input, media: [{ kind: "image", url: "https://baska.site/x.jpg" }] }, at, catalog)).toMatchObject({
        ok: false,
        status: 400,
      });
      expect(await createReview(db, null, { ...input, productId: "yok" }, at, catalog)).toMatchObject({ status: 404 });
      expect((await client.query("SELECT count(*)::int AS n FROM reviews")).rows[0].n).toBe(2);
    });
  });
});

describe("E-postaya giden formlar ve e-posta kaydı", () => {
  it("bayilik, iletişim ve ürün sorusu kendi tablolarına yazılır; e-posta kaydı tutulur", async () => {
    await withCatalog(async (db, client) => {
      const at = new Date();
      await saveDealerApplication(
        db,
        member,
        { company: "Firma", taxOffice: "Konya / 1", years: "3-5", hasShowroom: "evet", hasService: "", email: "f@ornek.com" },
        at,
      );
      const [application] = (await client.query("SELECT company_name, years_in_sector, has_showroom, has_service, user_id FROM dealer_applications")).rows;
      expect(application).toEqual({ company_name: "Firma", years_in_sector: "3-5", has_showroom: true, has_service: null, user_id: "u-a" });

      await saveSupportMessage(db, null, { type: "urun-destek", email: "z@ornek.com", message: "Soru", productSku: "ZW-P1" }, at);
      await saveSupportMessage(db, null, { type: "iletisim", name: "Z", email: "z@ornek.com", subject: "Konu", message: "Merhaba", pageUrl: "/iletisim" }, at);
      expect((await client.query("SELECT type, product_id FROM support_messages ORDER BY type")).rows).toEqual([
        { type: "iletisim", product_id: null },
        { type: "urun-destek", product_id: "p1" },
      ]);

      await logEmail(db, { type: "sifre-sifirlama", recipients: ["a@ornek.com"], subject: "Zenweld şifre sıfırlama", status: "skipped" });
      await logEmail(db, {
        type: "teklif",
        sourcePath: "/teklif-al",
        entityType: "quotes",
        entityId: "q-1",
        recipients: ["info@zenweld.com"],
        subject: "Yeni teklif talebi",
        status: "sent",
        providerMessageId: "re_1",
      });
      expect((await client.query("SELECT type, status FROM email_log ORDER BY id")).rows).toEqual([
        { type: "sifre-sifirlama", status: "skipped" },
        { type: "teklif", status: "sent" },
      ]);
      // Bilinmeyen tur kabul edilmez.
      await expectFailure(client, "INSERT INTO email_log (type, recipients, subject, status) VALUES ('uydurma', '{a}', 'x', 'sent')");
    });
  });
});

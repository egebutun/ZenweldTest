import { describe, expect, it } from "vitest";
import { createSeedDatabase, dealerApplicationFields, type ZenweldDatabase } from "@zenweld/data";

/* docs/IS-KURALLARI.md › 18. Form e-postaları (bayilik başvurusunun kaydı; KARARLAR K-109) */
describe("Bayilik başvurusunun kaydı", () => {
  it("form alanları kayda çevrilir; boş alan kaydedilmez", () => {
    expect(
      dealerApplicationFields({
        company: "Demo Hırdavat",
        taxOffice: "",
        city: "Bursa",
        years: "6-10",
        hasShowroom: "evet",
        hasService: "hayir",
        contactName: "Mehmet",
        email: "bayi@ornek.com",
        phone: "",
        message: "",
      }),
    ).toEqual({
      companyName: "Demo Hırdavat",
      taxInfo: undefined,
      city: "Bursa",
      sector: undefined,
      yearsInSector: "6-10",
      brands: undefined,
      hasShowroom: true,
      hasService: false,
      contactName: "Mehmet",
      email: "bayi@ornek.com",
      phone: undefined,
      message: undefined,
    });
  });

  it("listede olmayan yıl alınmaz; seçilmeyen showroom/servis boş kalır", () => {
    const f = dealerApplicationFields({ company: "A", email: "a@ornek.com", years: "20", hasShowroom: "" });
    expect([f.yearsInSector, f.hasShowroom, f.hasService]).toEqual([undefined, undefined, undefined]);
  });
});

describe("Form kayıtları tarayıcı verisinde isteğe bağlıdır", () => {
  it("örnek veride ve eski kayıtlarda yoktur (veri sürümü değişmeden eklenir)", () => {
    const db: ZenweldDatabase = createSeedDatabase();
    expect([db.dealerApplications, db.supportMessages, db.weldersClub]).toEqual([undefined, undefined, undefined]);
  });
});

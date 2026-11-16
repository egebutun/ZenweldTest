import { describe, expect, it } from "vitest";
import {
  createSeedDatabase,
  distanceKm,
  memberServiceRequest,
  PROVINCE_NAMES,
  PROVINCES,
  placeKey,
  provinceName,
  serviceAssignmentError,
  serviceCandidates,
  serviceCreatedMail,
  serviceCustomerMail,
  serviceMatchText,
  serviceNoticeMail,
  type Dealer,
  type ServiceRequest,
} from "@zenweld/data";
import { TURKIYE_ILLERI } from "@/lib/turkiye-haritasi";

/**
 * SERVIS TALEPLERI (docs/IS-KURALLARI.md › Servis talepleri; KARARLAR K-117)
 */

const dealer = (id: string, city: string, district: string, lat: number, lng: number, extra: Partial<Dealer> = {}): Dealer => ({
  id,
  name: `Servis ${id}`,
  city,
  district,
  address: "",
  phone: "",
  lat,
  lng,
  badges: ["yetkili-servis"],
  workingHours: "",
  forceDealer: false,
  active: true,
  ...extra,
});

const request: ServiceRequest = {
  id: "srv-1",
  code: "SRV-2026-0042",
  status: "new",
  categorySlug: "mig-mag",
  productId: "p1",
  productName: "Evomig 205",
  reasons: ["onarim", "bakim"],
  complaint: "Ark kesiliyor.",
  companyName: "Kaya Metal Ltd. Şti.",
  address: "Örnek Sanayi Sitesi 4. Blok No:7",
  city: "İstanbul",
  district: "Maltepe",
  email: "musteri@example.com",
  phone: "+90 532 000 00 01",
  contactName: "Mehmet Kaya",
  contactGsm: "+90 532 000 00 02",
  adminNote: "İç not",
  serviceDealerId: "d1",
  createdAt: "2026-11-10T10:00:00+03:00",
  updatedAt: "2026-11-10T10:00:00+03:00",
};

describe("il listesi", () => {
  it("81 il var, her biri bir kez; haritadaki illerle aynı", () => {
    expect(PROVINCES).toHaveLength(81);
    expect(new Set(PROVINCES.map((p) => p.name)).size).toBe(81);
    expect(new Set(PROVINCES.map((p) => placeKey(p.name)))).toEqual(new Set(TURKIYE_ILLERI.map((p) => placeKey(p.name))));
  });

  it("açılır liste alfabetik (Türkçe sıra)", () => {
    expect(PROVINCE_NAMES.slice(0, 4)).toEqual(["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı"]);
    expect(PROVINCE_NAMES.indexOf("Çanakkale")).toBeGreaterThan(PROVINCE_NAMES.indexOf("Burdur"));
    expect(PROVINCE_NAMES.indexOf("İstanbul")).toBeGreaterThan(PROVINCE_NAMES.indexOf("Iğdır"));
  });

  it("yazılan il büyük/küçük harf ve şapkadan bağımsız bulunur; listede yoksa null", () => {
    expect(provinceName(" istanbul ")).toBe("İstanbul");
    expect(provinceName("IĞDIR")).toBe("Iğdır");
    expect(provinceName("Hakkâri")).toBe("Hakkari");
    expect(provinceName("izmır")).toBe("İzmir");
    expect(provinceName("Ostim")).toBeNull();
    expect(provinceName("")).toBeNull();
  });

  it("kuş uçuşu uzaklık: İstanbul–Ankara il merkezleri yaklaşık 350 km", () => {
    const ist = PROVINCES.find((p) => p.name === "İstanbul")!;
    const ank = PROVINCES.find((p) => p.name === "Ankara")!;
    expect(distanceKm(ist, ank)).toBeGreaterThan(340);
    expect(distanceKm(ist, ank)).toBeLessThan(360);
  });
});

describe("en yakın yetkili servis", () => {
  const dealers = [
    dealer("uzak", "Ankara", "Yenimahalle", 39.97, 32.75),
    dealer("ayni-il", "İstanbul", "Başakşehir", 41.09, 28.8),
    dealer("ayni-ilce", "istanbul", "MALTEPE", 40.93, 29.13),
    dealer("yakin", "Kocaeli", "Gebze", 40.8, 29.43),
    dealer("kapali", "İstanbul", "Maltepe", 40.93, 29.13, { active: false }),
    dealer("bayi", "İstanbul", "Maltepe", 40.93, 29.13, { badges: ["yetkili-satici"] }),
  ];

  it("önce aynı ilçe, sonra aynı il, sonra il merkezine uzaklık; yayında olmayan ve servis olmayan yok", () => {
    const list = serviceCandidates(request, dealers);
    expect(list.map((c) => c.dealer.id)).toEqual(["ayni-ilce", "ayni-il", "yakin", "uzak"]);
    expect(list.map((c) => c.match)).toEqual(["district", "city", "distance", "distance"]);
    expect(list.map((c) => serviceMatchText(c)).slice(0, 2)).toEqual(["aynı ilçe", "aynı il"]);
    expect(serviceMatchText(list[2])).toMatch(/^yaklaşık \d+ km$/);
  });

  it("örnek veri: İstanbul'da yetkili servis yok, öneri yaklaşık 45 km'deki Gebze", () => {
    const db = createSeedDatabase();
    const [first] = serviceCandidates({ city: "İstanbul", district: "Maltepe" }, db.dealers);
    expect(first.dealer.district).toBe("Gebze");
    expect(first.match).toBe("distance");
    expect(first.km).toBeGreaterThan(35);
    expect(first.km).toBeLessThan(55);
  });

  it("il listede yoksa (eski kayıt) uzaklık bilinmez; eşleşmeyenler ada göre", () => {
    const list = serviceCandidates({ city: "Lorem", district: "" }, dealers);
    expect(list.every((c) => c.km === null && c.match === "distance")).toBe(true);
    expect(serviceMatchText(list[0])).toBe("uzaklık bilinmiyor");
  });
});

describe("durum ve servis", () => {
  const dealers = [dealer("d1", "Kocaeli", "Gebze", 40.8, 29.43), dealer("d2", "Bursa", "Nilüfer", 40.2, 28.9, { active: false })];

  it("“Yetkili servis atandı” servis seçilmeden kaydedilmez", () => {
    expect(serviceAssignmentError("assigned", undefined, dealers)).toMatch(/önce yetkili servisi seçin/);
    expect(serviceAssignmentError("assigned", "d1", dealers)).toBeNull();
    expect(serviceAssignmentError("new", undefined, dealers)).toBeNull();
    expect(serviceAssignmentError("done", undefined, dealers)).toBeNull();
  });

  it("yeni seçilen kayıt yayındaki bir yetkili servis olmalı; zaten kayıtlı olan değişmeden kalabilir", () => {
    expect(serviceAssignmentError("assigned", "d2", dealers)).toMatch(/yetkili servis değil/);
    expect(serviceAssignmentError("assigned", "yok", dealers)).toMatch(/yetkili servis değil/);
    expect(serviceAssignmentError("done", "d2", dealers, "d2")).toBeNull();
  });
});

describe("e-postalar", () => {
  const candidate = { dealer: dealer("d1", "Kocaeli", "Gebze", 40.8, 29.43), match: "distance" as const, km: 45 };
  const personal = [request.email, request.phone, request.contactName, request.contactGsm, request.companyName, request.address];

  it("müşteriye: talep alındı, talep no ve özet; servis bilgisi yok", () => {
    const mail = serviceCreatedMail(request, "MIG/MAG");
    expect(mail.subject).toContain(request.code);
    expect(mail.body).toContain("Talebiniz başarıyla oluşturulmuştur. En yakın yetkili servisimiz sizinle iletişime geçecektir.");
    expect(mail.body).toContain("Evomig 205 (MIG/MAG)");
    expect(mail.body).toContain("Onarım, Bakım");
    expect(mail.body).not.toContain(candidate.dealer.name);
  });

  it("servise talep bildirimi: talep no, makine, şikayet, ilçe/il; müşterinin kişisel bilgileri yok", () => {
    const mail = serviceNoticeMail(request, candidate);
    expect(mail.subject).toBe("Zenweld servis talebi — SRV-2026-0042 — Maltepe / İstanbul");
    expect(mail.body).toContain("Merhaba Servis d1,");
    expect(mail.body).toContain("Ark kesiliyor.");
    expect(mail.body).toContain("size uzaklığı yaklaşık 45 km");
    for (const value of personal) expect(mail.body).not.toContain(value);
  });

  it("servise müşteri bilgileri: kişisel bilgilerin hepsi ve talep no", () => {
    const mail = serviceCustomerMail(request, candidate.dealer);
    expect(mail.subject).toContain(request.code);
    for (const value of personal) expect(mail.body).toContain(value);
  });
});

describe("Hesabım › Servis Taleplerim", () => {
  it("müşteriye iç not ve atanan servis gitmez", () => {
    const view = memberServiceRequest(request);
    expect(view).not.toHaveProperty("adminNote");
    expect(view).not.toHaveProperty("serviceDealerId");
    expect(view).not.toHaveProperty("email");
    expect(view).toMatchObject({ code: request.code, status: "new", productName: "Evomig 205" });
  });

  it("örnek veri: atanan ve tamamlanan taleplerin servisi yetkili servis; demo bireysel üyenin her durumdan talebi var", () => {
    const db = createSeedDatabase();
    const servicePoints = new Set(db.dealers.filter((d) => d.badges.includes("yetkili-servis")).map((d) => d.id));
    for (const r of db.serviceRequests.filter((x) => x.status !== "new")) expect(servicePoints.has(r.serviceDealerId ?? "")).toBe(true);
    const member = db.serviceRequests.filter((r) => r.userId === "u-bireysel");
    expect(new Set(member.map((r) => r.status))).toEqual(new Set(["new", "assigned", "done"]));
    expect(db.serviceRequests.every((r) => provinceName(r.city) === r.city)).toBe(true);
  });
});

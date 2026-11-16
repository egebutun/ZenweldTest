import type { Dealer, ServiceReason, ServiceRequest, ServiceRequestStatus } from "./types";

/**
 * SERVIS TALEPLERI (KARARLAR K-117; docs/IS-KURALLARI.md › Servis talepleri)
 *
 * - Il, 81 illik listeden secilir (PROVINCES).
 * - Durumlar: Yetkili servis atanmasi bekleniyor → Yetkili servis atandi →
 *   Tamamlandi. Musteri de ayni durumu gorur; servis bilgisi gosterilmez.
 * - Panel en yakin yetkili servisi onerir: once ayni ilce, sonra ayni il,
 *   sonra musterinin il merkezine kus ucusu en yakin servis.
 * - Servise iki hazir e-posta: once kisisel bilgi icermeyen talep bildirimi,
 *   servis talebi ustlenince (durum "atandi") musteri bilgileri.
 */

/** 81 il ve il merkezinin enlem/boylami (plaka sirasiyla). */
export const PROVINCES: readonly { name: string; lat: number; lng: number }[] = [
  { name: "Adana", lat: 37.0, lng: 35.3213 },
  { name: "Adıyaman", lat: 37.7648, lng: 38.2786 },
  { name: "Afyonkarahisar", lat: 38.7507, lng: 30.5567 },
  { name: "Ağrı", lat: 39.7191, lng: 43.0503 },
  { name: "Amasya", lat: 40.6499, lng: 35.8353 },
  { name: "Ankara", lat: 39.9334, lng: 32.8597 },
  { name: "Antalya", lat: 36.8969, lng: 30.7133 },
  { name: "Artvin", lat: 41.1828, lng: 41.8183 },
  { name: "Aydın", lat: 37.856, lng: 27.8416 },
  { name: "Balıkesir", lat: 39.6484, lng: 27.8826 },
  { name: "Bilecik", lat: 40.1451, lng: 29.9799 },
  { name: "Bingöl", lat: 38.8847, lng: 40.4939 },
  { name: "Bitlis", lat: 38.4006, lng: 42.1095 },
  { name: "Bolu", lat: 40.7392, lng: 31.6089 },
  { name: "Burdur", lat: 37.7203, lng: 30.2908 },
  { name: "Bursa", lat: 40.1885, lng: 29.061 },
  { name: "Çanakkale", lat: 40.1553, lng: 26.4142 },
  { name: "Çankırı", lat: 40.6013, lng: 33.6134 },
  { name: "Çorum", lat: 40.5506, lng: 34.9556 },
  { name: "Denizli", lat: 37.7765, lng: 29.0864 },
  { name: "Diyarbakır", lat: 37.9144, lng: 40.2306 },
  { name: "Edirne", lat: 41.6818, lng: 26.5623 },
  { name: "Elazığ", lat: 38.681, lng: 39.2264 },
  { name: "Erzincan", lat: 39.75, lng: 39.5 },
  { name: "Erzurum", lat: 39.9043, lng: 41.2679 },
  { name: "Eskişehir", lat: 39.7767, lng: 30.5206 },
  { name: "Gaziantep", lat: 37.0662, lng: 37.3833 },
  { name: "Giresun", lat: 40.9128, lng: 38.3895 },
  { name: "Gümüşhane", lat: 40.4386, lng: 39.5086 },
  { name: "Hakkari", lat: 37.5744, lng: 43.7408 },
  { name: "Hatay", lat: 36.2028, lng: 36.1606 },
  { name: "Isparta", lat: 37.7648, lng: 30.5566 },
  { name: "Mersin", lat: 36.8121, lng: 34.6415 },
  { name: "İstanbul", lat: 41.0082, lng: 28.9784 },
  { name: "İzmir", lat: 38.4237, lng: 27.1428 },
  { name: "Kars", lat: 40.6013, lng: 43.0975 },
  { name: "Kastamonu", lat: 41.3887, lng: 33.7827 },
  { name: "Kayseri", lat: 38.7312, lng: 35.4787 },
  { name: "Kırklareli", lat: 41.7333, lng: 27.2167 },
  { name: "Kırşehir", lat: 39.1425, lng: 34.1709 },
  { name: "Kocaeli", lat: 40.7654, lng: 29.9408 },
  { name: "Konya", lat: 37.8746, lng: 32.4932 },
  { name: "Kütahya", lat: 39.4167, lng: 29.9833 },
  { name: "Malatya", lat: 38.3552, lng: 38.3095 },
  { name: "Manisa", lat: 38.6191, lng: 27.4289 },
  { name: "Kahramanmaraş", lat: 37.5858, lng: 36.9371 },
  { name: "Mardin", lat: 37.3212, lng: 40.7245 },
  { name: "Muğla", lat: 37.2153, lng: 28.3636 },
  { name: "Muş", lat: 38.9462, lng: 41.7539 },
  { name: "Nevşehir", lat: 38.6939, lng: 34.6857 },
  { name: "Niğde", lat: 37.9667, lng: 34.6833 },
  { name: "Ordu", lat: 40.9839, lng: 37.8764 },
  { name: "Rize", lat: 41.0201, lng: 40.5234 },
  { name: "Sakarya", lat: 40.7569, lng: 30.3781 },
  { name: "Samsun", lat: 41.2928, lng: 36.3313 },
  { name: "Siirt", lat: 37.9333, lng: 41.95 },
  { name: "Sinop", lat: 42.0231, lng: 35.1531 },
  { name: "Sivas", lat: 39.7477, lng: 37.0179 },
  { name: "Tekirdağ", lat: 40.9833, lng: 27.5167 },
  { name: "Tokat", lat: 40.3167, lng: 36.55 },
  { name: "Trabzon", lat: 41.0015, lng: 39.7178 },
  { name: "Tunceli", lat: 39.1079, lng: 39.5401 },
  { name: "Şanlıurfa", lat: 37.1591, lng: 38.7969 },
  { name: "Uşak", lat: 38.6823, lng: 29.4082 },
  { name: "Van", lat: 38.4891, lng: 43.4089 },
  { name: "Yozgat", lat: 39.8181, lng: 34.8147 },
  { name: "Zonguldak", lat: 41.4564, lng: 31.7987 },
  { name: "Aksaray", lat: 38.3687, lng: 34.037 },
  { name: "Bayburt", lat: 40.2552, lng: 40.2249 },
  { name: "Karaman", lat: 37.1759, lng: 33.2287 },
  { name: "Kırıkkale", lat: 39.8468, lng: 33.5153 },
  { name: "Batman", lat: 37.8812, lng: 41.1351 },
  { name: "Şırnak", lat: 37.5164, lng: 42.4611 },
  { name: "Bartın", lat: 41.6344, lng: 32.3375 },
  { name: "Ardahan", lat: 41.1105, lng: 42.7022 },
  { name: "Iğdır", lat: 39.9237, lng: 44.045 },
  { name: "Yalova", lat: 40.65, lng: 29.2667 },
  { name: "Karabük", lat: 41.2061, lng: 32.6204 },
  { name: "Kilis", lat: 36.7184, lng: 37.1212 },
  { name: "Osmaniye", lat: 37.0742, lng: 36.2478 },
  { name: "Düzce", lat: 40.8438, lng: 31.1565 },
];

/** Il adlari alfabetik (formdaki acilir liste). */
export const PROVINCE_NAMES: readonly string[] = PROVINCES.map((p) => p.name).sort((a, b) => a.localeCompare(b, "tr"));

/**
 * Yer adlarini karsilastirma bicimi: buyuk/kucuk harf, sapka ve Turkce
 * harfler fark etmez ("ISTANBUL", "istanbul", "İstanbul"; "Hakkâri", "Hakkari").
 */
export function placeKey(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ");
}

const BY_KEY = new Map(PROVINCES.map((p) => [placeKey(p.name), p]));

/** Yazilan il adinin listedeki hali; listede yoksa null. */
export function provinceName(name: string | undefined | null): string | null {
  return (name && BY_KEY.get(placeKey(name))?.name) || null;
}

/** Iki nokta arasindaki kus ucusu uzaklik (km). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ------------------------------ Durumlar ------------------------------ */

export const SERVICE_STATUS_LIST: readonly ServiceRequestStatus[] = ["new", "assigned", "done"];

/** Panelde ve Hesabim › Servis Taleplerim'de ayni yazilir. */
export const SERVICE_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: "Yetkili servis atanması bekleniyor",
  assigned: "Yetkili servis atandı",
  done: "Tamamlandı",
};

export const SERVICE_REASON_LABELS: Record<ServiceReason, string> = {
  kurulum: "Kurulum",
  bakim: "Bakım",
  onarim: "Onarım",
  egitim: "Kullanım/Bakım Eğitimi",
};

export const isServicePoint = (d: Pick<Dealer, "active" | "badges">) => d.active && d.badges.includes("yetkili-servis");

/**
 * Panelde kaydedilmeden once: "Yetkili servis atandı" icin servis secilmis
 * olmali ve secilen kayit yetkili servis olmali. Sorun yoksa null.
 */
export function serviceAssignmentError(
  status: ServiceRequestStatus,
  serviceDealerId: string | undefined,
  dealers: Pick<Dealer, "id" | "active" | "badges">[],
  previousDealerId?: string,
): string | null {
  if (status === "assigned" && !serviceDealerId) return "“Yetkili servis atandı” için önce yetkili servisi seçin.";
  if (serviceDealerId && serviceDealerId !== previousDealerId) {
    const dealer = dealers.find((d) => d.id === serviceDealerId);
    if (!dealer || !isServicePoint(dealer)) return "Seçilen kayıt yayında bir yetkili servis değil.";
  }
  return null;
}

/* ---------------------------- En yakin servis ---------------------------- */

export type ServiceMatch = "district" | "city" | "distance";

export interface ServiceCandidate {
  dealer: Dealer;
  match: ServiceMatch;
  /** Musterinin il merkezinden servise kus ucusu (km); il listede yoksa null */
  km: number | null;
}

const RANK: Record<ServiceMatch, number> = { district: 0, city: 1, distance: 2 };

/**
 * Yayindaki yetkili servisler, talebe yakindan uzaga: once ayni ilce, sonra
 * ayni il, sonra il merkezine kus ucusu uzaklik. Ilk satir onerilen servistir.
 */
export function serviceCandidates(location: { city: string; district: string }, dealers: Dealer[]): ServiceCandidate[] {
  const province = BY_KEY.get(placeKey(location.city));
  const city = placeKey(location.city);
  const district = placeKey(location.district);
  return dealers
    .filter(isServicePoint)
    .map((dealer) => {
      const sameCity = placeKey(dealer.city) === city;
      const match: ServiceMatch = sameCity && placeKey(dealer.district) === district ? "district" : sameCity ? "city" : "distance";
      return { dealer, match, km: province ? Math.round(distanceKm(province, dealer)) : null };
    })
    .sort(
      (a, b) =>
        RANK[a.match] - RANK[b.match] ||
        (a.km ?? Number.MAX_SAFE_INTEGER) - (b.km ?? Number.MAX_SAFE_INTEGER) ||
        a.dealer.name.localeCompare(b.dealer.name, "tr"),
    );
}

/** "aynı ilçe", "aynı il" ya da "yaklaşık 45 km" */
export function serviceMatchText(c: Pick<ServiceCandidate, "match" | "km">): string {
  if (c.match === "district") return "aynı ilçe";
  if (c.match === "city") return "aynı il";
  return c.km === null ? "uzaklık bilinmiyor" : `yaklaşık ${c.km} km`;
}

/* ------------------------------ E-postalar ------------------------------ */

export interface ServiceMail {
  subject: string;
  body: string;
}

type RequestFields = Pick<
  ServiceRequest,
  "code" | "productName" | "reasons" | "complaint" | "city" | "district" | "companyName" | "contactName" | "contactGsm" | "phone" | "email" | "address"
>;

const reasonsText = (r: Pick<ServiceRequest, "reasons">) => r.reasons.map((x) => SERVICE_REASON_LABELS[x]).join(", ");
const machineText = (r: Pick<ServiceRequest, "productName">, categoryName?: string) =>
  categoryName ? `${r.productName} (${categoryName})` : r.productName;

/**
 * Musteriye talep alininca giden e-posta. Servis bilgisi icermez
 * (KARARLAR K-117). Konudaki talep numarasi sayesinde musterinin yaniti
 * talebin yazismalarina girer (K-116).
 */
export function serviceCreatedMail(r: RequestFields, categoryName?: string): ServiceMail {
  return {
    subject: `Servis talebiniz alındı — ${r.code}`,
    body: [
      `Merhaba ${r.contactName},`,
      "",
      "Talebiniz başarıyla oluşturulmuştur. En yakın yetkili servisimiz sizinle iletişime geçecektir.",
      "",
      `Talep no: ${r.code}`,
      `Makine: ${machineText(r, categoryName)}`,
      `Talep konusu: ${reasonsText(r)}`,
      `Şikayet: ${r.complaint}`,
      `Konum: ${r.district} / ${r.city}`,
      "",
      "Bu e-postayı yanıtlayarak bize ulaşabilirsiniz. Üyeyseniz talebinizi Hesabım › Servis Taleplerim'den izleyebilirsiniz.",
      "",
      "Zenweld",
    ].join("\n"),
  };
}

/**
 * Servise talep bildirimi: musterinin kisisel bilgileri yok; talep no,
 * makine, sikayet ve ilce/il (KARARLAR K-117).
 */
export function serviceNoticeMail(r: RequestFields, candidate: Pick<ServiceCandidate, "dealer" | "match" | "km">, categoryName?: string): ServiceMail {
  const distance = candidate.match === "distance" && candidate.km !== null ? ` · size uzaklığı yaklaşık ${candidate.km} km` : "";
  return {
    subject: `Zenweld servis talebi — ${r.code} — ${r.district} / ${r.city}`,
    body: [
      `Merhaba ${candidate.dealer.name},`,
      "",
      "Bölgenizdeki bir müşterimiz Zenweld'e servis talebi gönderdi. Talebi size en yakın yetkili servis noktası olarak yönlendiriyoruz.",
      "",
      `Talep no: ${r.code}`,
      `Talep konusu: ${reasonsText(r)}`,
      `Makine: ${machineText(r, categoryName)}`,
      `Müşteri şikayeti: ${r.complaint}`,
      `Konum: ${r.district} / ${r.city}${distance}`,
      "",
      "Bu talebi üstlenip üstlenemeyeceğinizi bu e-postayı yanıtlayarak bildirir misiniz? Uygun değilseniz nedenini kısaca yazmanız yeterli; talebi başka bir servis noktasına yönlendiririz.",
      "",
      "Talebi üstlenirseniz müşterinin iletişim bilgilerini ayrı bir e-postayla göndereceğiz.",
      "",
      "Zenweld",
    ].join("\n"),
  };
}

/** Servis talebi ustlenince musteri bilgileri (KARARLAR K-117). */
export function serviceCustomerMail(r: RequestFields, dealer: Pick<Dealer, "name">, categoryName?: string): ServiceMail {
  return {
    subject: `Talep ${r.code} size verildi — ${r.companyName}`,
    body: [
      `Merhaba ${dealer.name},`,
      "",
      `${r.code} numaralı talebi üstlendiğiniz için teşekkür ederiz. Müşterinin bilgileri:`,
      "",
      `Firma / Ad Soyad: ${r.companyName}`,
      `Yetkili kişi: ${r.contactName}`,
      `Yetkili GSM: ${r.contactGsm}`,
      `Telefon: ${r.phone}`,
      `E-posta: ${r.email}`,
      `Adres: ${r.address}, ${r.district} / ${r.city}`,
      "",
      `Makine: ${machineText(r, categoryName)}`,
      `Talep konusu: ${reasonsText(r)}`,
      `Müşteri şikayeti: ${r.complaint}`,
      "",
      "Lütfen müşteriyle en kısa sürede iletişime geçin. Talep tamamlanınca bu e-postayı yanıtlayarak bize bildirin.",
      "",
      "Zenweld",
    ].join("\n"),
  };
}

/* ------------------------- Hesabim › Servis Taleplerim ------------------------- */

/** Musterinin gordugu alanlar: ic not ve atanan servis yok (KARARLAR K-117). */
export type MemberServiceRequest = Pick<
  ServiceRequest,
  "id" | "code" | "status" | "categorySlug" | "productName" | "reasons" | "complaint" | "city" | "district" | "createdAt" | "updatedAt"
>;

export function memberServiceRequest(r: ServiceRequest): MemberServiceRequest {
  return {
    id: r.id,
    code: r.code,
    status: r.status,
    categorySlug: r.categorySlug,
    productName: r.productName,
    reasons: r.reasons,
    complaint: r.complaint,
    city: r.city,
    district: r.district,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

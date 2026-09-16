import type { Address, User } from "../types";

/**
 * DEMO hesaplar.
 *
 * !! UYARI !! Sifreler tarayicida basit bir hash ile saklanir; bu yapi
 * yalnizca sunum/demo icindir, gercek kimlik dogrulama degildir.
 * Sifreler README.md ve /admin/giris ekraninda yazilidir.
 */

/** demoHash("admin123") gibi — packages/auth/src/hash.ts ile ayni algoritma. */
function demoHash(input: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  let h2 = 0x0;
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `zw1$${h1.toString(16)}${h2.toString(16)}`;
}

export const DEMO_PASSWORDS = {
  admin: "admin123",
  bireysel: "demo123",
  kurumsal: "demo123",
  bayi: "bayi123",
} as const;

export const users: User[] = [
  {
    id: "u-admin",
    role: "admin",
    status: "active",
    email: "admin@zenweld.com",
    passwordHash: demoHash("admin123"),
    firstName: "Zenweld",
    lastName: "Yönetici",
    phone: "+90 850 000 00 00",
    city: "İstanbul",
    createdAt: "2026-01-02T09:00:00+03:00",
    lastLoginAt: "2026-09-16T08:10:00+03:00",
    newsletter: false,
  },
  {
    id: "u-bireysel",
    role: "individual",
    status: "active",
    email: "bireysel@demo.com",
    passwordHash: demoHash("demo123"),
    firstName: "Ahmet",
    lastName: "Yılmaz",
    phone: "+90 532 111 11 11",
    city: "İstanbul",
    createdAt: "2026-03-14T11:20:00+03:00",
    newsletter: true,
  },
  {
    id: "u-kurumsal",
    role: "business",
    status: "active",
    email: "kurumsal@demo.com",
    passwordHash: demoHash("demo123"),
    firstName: "Elif",
    lastName: "Demir",
    phone: "+90 533 222 22 22",
    companyName: "Demir Metal Sanayi A.Ş.",
    taxOffice: "Kadıköy",
    taxNumber: "1234567890",
    sector: "Metal İmalat",
    city: "İstanbul",
    createdAt: "2026-02-08T14:05:00+03:00",
    newsletter: true,
  },
  {
    id: "u-bayi-a",
    role: "dealer",
    status: "active",
    email: "bayi@zenweld-bayi-a.com",
    passwordHash: demoHash("bayi123"),
    firstName: "Murat",
    lastName: "Kaya",
    phone: "+90 532 000 00 02",
    companyName: "ZENWELD-BAYİ-A Kaynak Teknolojileri",
    taxOffice: "Başakşehir",
    taxNumber: "9876543210",
    dealerId: "d-zenweld-bayi-a",
    dealerCode: "BYA-001",
    retailerId: "r-zenweld-bayi-a",
    city: "İstanbul",
    createdAt: "2025-11-20T10:00:00+03:00",
    newsletter: false,
  },
  {
    id: "u-bayi-basak",
    role: "dealer",
    status: "active",
    email: "bayi@basakhirdavat.com",
    passwordHash: demoHash("bayi123"),
    firstName: "Serkan",
    lastName: "Aydın",
    phone: "+90 532 000 00 01",
    companyName: "Başak Hırdavat",
    taxOffice: "Bayrampaşa",
    taxNumber: "5566778899",
    dealerId: "d-basak-hirdavat",
    dealerCode: "BSK-002",
    retailerId: "r-basak-hirdavat",
    city: "İstanbul",
    createdAt: "2025-09-05T09:30:00+03:00",
    newsletter: false,
  },
  {
    id: "u-kurumsal-2",
    role: "business",
    status: "pending",
    email: "satinalma@ornekfirma.com",
    passwordHash: demoHash("demo123"),
    firstName: "Burak",
    lastName: "Şahin",
    phone: "+90 535 333 33 33",
    companyName: "Örnek Makina Ltd. Şti.",
    taxOffice: "Nilüfer",
    taxNumber: "1122334455",
    sector: "Otomotiv Yan Sanayi",
    city: "Bursa",
    createdAt: "2026-09-10T16:40:00+03:00",
    newsletter: false,
  },
  {
    id: "u-bireysel-2",
    role: "individual",
    status: "active",
    email: "hobi@demo.com",
    passwordHash: demoHash("demo123"),
    firstName: "Zeynep",
    lastName: "Arslan",
    phone: "+90 536 444 44 44",
    city: "Ankara",
    createdAt: "2026-07-01T18:15:00+03:00",
    newsletter: true,
  },
];

export const addresses: Address[] = [
  { id: "a1", userId: "u-kurumsal", title: "Fabrika", fullName: "Elif Demir", phone: "+90 533 222 22 22", city: "İstanbul", district: "Tuzla", line: "Lorem OSB 3. Cadde No:17", isDefault: true },
  { id: "a2", userId: "u-bireysel", title: "Ev", fullName: "Ahmet Yılmaz", phone: "+90 532 111 11 11", city: "İstanbul", district: "Maltepe", line: "Lorem Mah. 12. Sok. No:5 D:8", isDefault: true },
];

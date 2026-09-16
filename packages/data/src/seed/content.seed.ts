import type { BlogPost, FaqItem, Order, Quote, WarrantyRecord } from "../types";
import { stockPhotos } from "./images";

const lorem = {
  tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
};

const loremShort = {
  tr: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
};

export const blogPosts: BlogPost[] = [
  { id: "b1", slug: "mig-kaynaginda-gaz-secimi", title: { tr: "MIG Kaynağında Doğru Gaz Seçimi", en: "Choosing the Right Gas for MIG Welding" }, excerpt: loremShort, body: lorem, coverUrl: stockPhotos.weldingSparks, category: { tr: "Teknik Rehber", en: "Technical Guide" }, author: "Zenweld Teknik Ekip", publishedAt: "2026-08-28T10:00:00+03:00" },
  { id: "b2", slug: "alu-kaynaginda-5-ipucu", title: { tr: "Alüminyum Kaynağında 5 Pratik İpucu", en: "5 Practical Tips for Aluminium Welding" }, excerpt: loremShort, body: lorem, coverUrl: stockPhotos.metalWork, category: { tr: "İpuçları", en: "Tips" }, author: "Zenweld Teknik Ekip", publishedAt: "2026-08-14T10:00:00+03:00" },
  { id: "b3", slug: "plazma-kesmede-sarf-omru", title: { tr: "Plazma Kesmede Sarf Malzeme Ömrünü Uzatmak", en: "Extending Consumable Life in Plasma Cutting" }, excerpt: loremShort, body: lorem, coverUrl: stockPhotos.factoryLine, category: { tr: "Bakım", en: "Maintenance" }, author: "Zenweld Servis", publishedAt: "2026-07-30T10:00:00+03:00" },
  { id: "b4", slug: "kaynakci-guvenligi", title: { tr: "Atölyede Kaynakçı Güvenliği Kontrol Listesi", en: "Welder Safety Checklist for the Workshop" }, excerpt: loremShort, body: lorem, coverUrl: stockPhotos.welderAtWork, category: { tr: "Güvenlik", en: "Safety" }, author: "Zenweld İSG", publishedAt: "2026-07-11T10:00:00+03:00" },
  { id: "b5", slug: "pulse-mig-nedir", title: { tr: "Pulse MIG Nedir, Ne Zaman Kullanılır?", en: "What Is Pulse MIG and When Should You Use It?" }, excerpt: loremShort, body: lorem, coverUrl: stockPhotos.engineer, category: { tr: "Teknik Rehber", en: "Technical Guide" }, author: "Zenweld Teknik Ekip", publishedAt: "2026-06-25T10:00:00+03:00" },
  { id: "b6", slug: "atolye-kurulumu", title: { tr: "Sıfırdan Atölye Kurulumu: Ekipman Listesi", en: "Setting Up a Workshop From Scratch: Equipment List" }, excerpt: loremShort, body: lorem, coverUrl: stockPhotos.workshop, category: { tr: "Rehber", en: "Guide" }, author: "Zenweld", publishedAt: "2026-06-02T10:00:00+03:00" },
];

export const faqs: FaqItem[] = [
  { id: "f1", topic: "genel", question: { tr: "Zenweld ürünlerini doğrudan siteden satın alabilir miyim?", en: "Can I buy Zenweld products directly from this website?" }, answer: { tr: "Hayır. Zenweld ürünleri yetkili bayilerimiz ve anlaşmalı online satış noktaları üzerinden satılmaktadır. Ürün sayfasındaki \"Nereden Alabilirim\" butonundan size en yakın bayiyi bulabilir veya stokta olan online satıcılara yönlenebilirsiniz.", en: "No. Zenweld products are sold through our authorised dealers and partner online stores. Use the \"Where to Buy\" button on any product page to find your nearest dealer or jump to an online retailer that has stock." } },
  { id: "f2", topic: "siparis", question: { tr: "Vadeli veya çekle ödeme yapabilir miyim?", en: "Can I pay on deferred terms or by cheque?" }, answer: { tr: "Kurumsal müşterilerimiz için vadeli ödeme ve çek ile ödeme seçenekleri mevcuttur. \"Teklif Al\" formunu doldurduğunuzda satış ekibimiz sizinle iletişime geçer.", en: "Deferred payment and payment by cheque are available for corporate customers. Fill in the \"Request a Quote\" form and our sales team will contact you." } },
  { id: "f3", topic: "garanti", question: { tr: "Makinemin garantisi ne kadar?", en: "How long is my machine's warranty?" }, answer: { tr: "Zenweld kaynak makineleri 24 ay, aksesuar ve sarf ürünleri 12 ay garantilidir. Ürününüzü online kaydettirerek garanti sürenizi uzatabilirsiniz.", en: "Zenweld welding machines carry a 24-month warranty; accessories and consumables carry 12 months. Register your product online to extend your warranty." } },
  { id: "f4", topic: "garanti", question: { tr: "Garanti kaydımı nasıl yaparım?", en: "How do I register my warranty?" }, answer: { tr: "Keşfet > Garanti Kaydı sayfasından seri numaranız ve satın alma bilgilerinizle kayıt oluşturabilirsiniz.", en: "Go to Explore > Register Your Warranty and create a record with your serial number and purchase details." } },
  { id: "f5", topic: "teknik", question: { tr: "Makinem hangi şebekede çalışır?", en: "What mains supply does my machine need?" }, answer: lorem, },
  { id: "f6", topic: "teknik", question: { tr: "Jeneratör ile kullanabilir miyim?", en: "Can I run it from a generator?" }, answer: lorem },
  { id: "f7", topic: "siparis", question: { tr: "Teklifim ne kadar sürede yanıtlanır?", en: "How quickly will my quote be answered?" }, answer: { tr: "Teklif talepleriniz iş günlerinde ortalama 24 saat içinde yanıtlanır.", en: "Quote requests are answered within 24 hours on business days on average." } },
  { id: "f8", topic: "genel", question: { tr: "Bayi olmak için ne yapmalıyım?", en: "How can I become a dealer?" }, answer: { tr: "Bayilik başvurusu için \"Bayi\" hesabı oluşturabilir veya Destek > İletişim sayfasından bize ulaşabilirsiniz.", en: "Create a \"Dealer\" account or contact us through Support > Contact to apply for a dealership." } },
];

export const quotes: Quote[] = [
  {
    id: "q1", code: "TKL-2026-0001", userId: "u-kurumsal", status: "reviewing",
    companyName: "Demir Metal Sanayi A.Ş.", contactName: "Elif Demir", email: "kurumsal@demo.com",
    phone: "+90 533 222 22 22", taxNumber: "1234567890", city: "İstanbul",
    paymentPreference: "vadeli", termDays: 60,
    items: [
      { productId: "p-ultimate-250-mtc", productName: "Zenweld Ultimate 250 MTC", quantity: 4 },
      { productId: "p-zenmask-auto-9000", productName: "Zenweld ZenMask Auto 9000", quantity: 8 },
    ],
    message: "Lorem ipsum dolor sit amet, teslimat Eylül sonuna kadar yapılabilir mi?",
    assignedTo: "Satış – Mehmet B.",
    adminNote: "Müşteri 60 gün vade talep ediyor, finans onayı bekleniyor.",
    createdAt: "2026-09-12T10:24:00+03:00", updatedAt: "2026-09-14T09:05:00+03:00",
  },
  {
    id: "q2", code: "TKL-2026-0002", status: "new",
    companyName: "Örnek Makina Ltd. Şti.", contactName: "Burak Şahin", email: "satinalma@ornekfirma.com",
    phone: "+90 535 333 33 33", taxNumber: "1122334455", city: "Bursa",
    paymentPreference: "cek",
    items: [{ productId: "p-multicut-40-cnc", productName: "Zenweld Multicut 40 CNC", quantity: 2 }],
    message: "Lorem ipsum dolor sit amet.",
    createdAt: "2026-09-15T15:02:00+03:00", updatedAt: "2026-09-15T15:02:00+03:00",
  },
  {
    id: "q3", code: "TKL-2026-0003", userId: "u-bayi-a", status: "sent",
    companyName: "ZENWELD-BAYİ-A Kaynak Teknolojileri", contactName: "Murat Kaya",
    email: "bayi@zenweld-bayi-a.com", phone: "+90 532 000 00 02", taxNumber: "9876543210",
    city: "İstanbul", paymentPreference: "havale",
    items: [
      { productId: "p-arc-200", productName: "Zenweld ARC 200", quantity: 20 },
      { productId: "p-ultimate-th-200", productName: "Zenweld Ultimate TH 200", quantity: 10 },
    ],
    message: "Bayi stok tazeleme siparişi.",
    assignedTo: "Bayi Kanalı – Ayşe K.",
    createdAt: "2026-09-08T08:40:00+03:00", updatedAt: "2026-09-09T11:15:00+03:00",
  },
];

export const orders: Order[] = [
  {
    id: "o1", code: "SIP-2026-0001", userId: "u-bayi-a", channel: "zenweld", status: "shipped",
    customerName: "ZENWELD-BAYİ-A Kaynak Teknolojileri", email: "bayi@zenweld-bayi-a.com",
    phone: "+90 532 000 00 02", city: "İstanbul", address: "Lorem OSB 5. Blok No:44, Başakşehir",
    items: [
      { productId: "p-arc-200", productName: "Zenweld ARC 200", quantity: 20, unitPrice: 8400 },
      { productId: "p-ultimate-th-200", productName: "Zenweld Ultimate TH 200", quantity: 10, unitPrice: 20800 },
    ],
    subtotal: 376000, vat: 75200, shipping: 0, total: 451200,
    createdAt: "2026-09-09T12:00:00+03:00",
  },
  {
    id: "o2", code: "SIP-2026-0002", userId: "u-bireysel", channel: "bayi-shop", status: "delivered",
    customerName: "Ahmet Yılmaz", email: "bireysel@demo.com", phone: "+90 532 111 11 11",
    city: "İstanbul", address: "Lorem Mah. 12. Sok. No:5 D:8, Maltepe",
    items: [{ productId: "p-arc-120", productName: "Zenweld ARC 120", quantity: 1, unitPrice: 7080 }],
    subtotal: 5900, vat: 1180, shipping: 250, total: 7330,
    createdAt: "2026-08-21T19:30:00+03:00",
  },
];

export const warranties: WarrantyRecord[] = [
  {
    id: "w1", serialNumber: "ZW250-2026-004821", productId: "p-ultimate-250-mtc",
    ownerName: "Ahmet Yılmaz", email: "bireysel@demo.com", phone: "+90 532 111 11 11",
    purchaseDate: "2026-04-18", dealerName: "Başak Hırdavat",
    registeredAt: "2026-04-20T12:00:00+03:00", expiresAt: "2029-04-18", extended: true,
  },
  {
    id: "w2", serialNumber: "ZWARC-2025-113407", productId: "p-arc-200",
    ownerName: "Zeynep Arslan", email: "hobi@demo.com", phone: "+90 536 444 44 44",
    purchaseDate: "2025-12-02", dealerName: "Ostim Kaynak Ekipmanları",
    registeredAt: "2025-12-05T09:20:00+03:00", expiresAt: "2027-12-02", extended: false,
  },
];

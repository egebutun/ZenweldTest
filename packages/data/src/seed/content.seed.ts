import type { BlogPost, FaqItem, Quote, WarrantyRecord } from "../types";
import { stockPhotos } from "./images";

const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

const loremShort = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.";

export const blogPosts: BlogPost[] = [
  { id: "b1", slug: "mig-kaynaginda-gaz-secimi", title: "MIG Kaynağında Doğru Gaz Seçimi", excerpt: loremShort, body: lorem, coverUrl: stockPhotos.weldingSparks, category: "Teknik Rehber", author: "Zenweld Teknik Ekip", publishedAt: "2026-08-28T10:00:00+03:00" },
  { id: "b2", slug: "alu-kaynaginda-5-ipucu", title: "Alüminyum Kaynağında 5 Pratik İpucu", excerpt: loremShort, body: lorem, coverUrl: stockPhotos.metalWork, category: "İpuçları", author: "Zenweld Teknik Ekip", publishedAt: "2026-08-14T10:00:00+03:00" },
  { id: "b3", slug: "plazma-kesmede-sarf-omru", title: "Plazma Kesmede Sarf Malzeme Ömrünü Uzatmak", excerpt: loremShort, body: lorem, coverUrl: stockPhotos.factoryLine, category: "Bakım", author: "Zenweld Servis", publishedAt: "2026-07-30T10:00:00+03:00" },
  { id: "b4", slug: "kaynakci-guvenligi", title: "Atölyede Kaynakçı Güvenliği Kontrol Listesi", excerpt: loremShort, body: lorem, coverUrl: stockPhotos.welderAtWork, category: "Güvenlik", author: "Zenweld İSG", publishedAt: "2026-07-11T10:00:00+03:00" },
  { id: "b5", slug: "pulse-mig-nedir", title: "Pulse MIG Nedir, Ne Zaman Kullanılır?", excerpt: loremShort, body: lorem, coverUrl: stockPhotos.engineer, category: "Teknik Rehber", author: "Zenweld Teknik Ekip", publishedAt: "2026-06-25T10:00:00+03:00" },
  { id: "b6", slug: "atolye-kurulumu", title: "Sıfırdan Atölye Kurulumu: Ekipman Listesi", excerpt: loremShort, body: lorem, coverUrl: stockPhotos.workshop, category: "Rehber", author: "Zenweld", publishedAt: "2026-06-02T10:00:00+03:00" },
];

export const faqs: FaqItem[] = [
  { id: "f1", topic: "genel", question: "Zenweld ürünlerini doğrudan siteden satın alabilir miyim?", answer: "Evet. Üye girişi yaparak ürünleri sepete ekleyip kredi kartı (taksit seçenekleriyle) veya havale/EFT ile ödeyebilirsiniz. Siparişinizin durumunu ve kargo takip numarasını Hesabım > Siparişlerim sayfasından izlersiniz. Ürünlerimiz ayrıca yetkili bayilerimizde ve anlaşmalı online satıcılarda da bulunur; ürün sayfasındaki \"Stoktaki Bayileri Gör\" butonundan size en yakın bayiyi bulabilirsiniz." },
  { id: "f2", topic: "siparis", question: "Vadeli veya çekle ödeme yapabilir miyim?", answer: "Kurumsal müşterilerimiz için vadeli ödeme ve çek ile ödeme seçenekleri mevcuttur. \"Teklif Al\" formunu doldurduğunuzda satış ekibimiz sizinle iletişime geçer." },
  { id: "f3", topic: "garanti", question: "Makinemin garantisi ne kadar?", answer: "Zenweld kaynak makineleri 24 ay, aksesuar ve sarf ürünleri 12 ay garantilidir. Ürününüzü online kaydettirerek garanti sürenizi uzatabilirsiniz." },
  { id: "f4", topic: "garanti", question: "Garanti kaydımı nasıl yaparım?", answer: "Keşfet > Garanti Kaydı sayfasından seri numaranız ve satın alma bilgilerinizle kayıt oluşturabilirsiniz." },
  { id: "f5", topic: "teknik", question: "Makinem hangi şebekede çalışır?", answer: lorem, },
  { id: "f6", topic: "teknik", question: "Jeneratör ile kullanabilir miyim?", answer: lorem },
  { id: "f7", topic: "siparis", question: "Teklifim ne kadar sürede yanıtlanır?", answer: "Teklif talepleriniz iş günlerinde ortalama 24 saat içinde yanıtlanır." },
  { id: "f8", topic: "genel", question: "Bayi olmak için ne yapmalıyım?", answer: "Keşfet > Bayilik Başvurusu sayfasındaki formu doldurun; ekibimiz başvurunuzu inceleyip sizinle iletişime geçer." },
];

export const quotes: Quote[] = [
  {
    id: "q1", code: "TKL-2026-0001", userId: "u-kurumsal", status: "reviewing",
    companyName: "Demir Metal Sanayi A.Ş.", contactName: "Elif Demir", email: "kurumsal@demo.com",
    phone: "+90 533 222 22 22", taxNumber: "1234567890", city: "İstanbul",
    paymentPreference: "vadeli", termDays: 60,
    items: [
      { productId: "p-ultimate-250-mtc", productName: "Ultimate 250 MTC", quantity: 4 },
      { productId: "p-zenmask-auto-9000", productName: "ZenMask Auto 9000", quantity: 8 },
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
    items: [{ productId: "p-multicut-40-cnc", productName: "Multicut 40 CNC", quantity: 2 }],
    message: "Lorem ipsum dolor sit amet.",
    createdAt: "2026-09-15T15:02:00+03:00", updatedAt: "2026-09-15T15:02:00+03:00",
  },
];

export const warranties: WarrantyRecord[] = [
  {
    id: "w1", serialNumber: "ZW250-2026-004821", categorySlug: "mig-gazalti-kaynak-makineleri", productId: "p-ultimate-250-mtc",
    ownerName: "Ahmet Yılmaz", email: "bireysel@demo.com", phone: "+90 532 111 11 11",
    city: "İstanbul", postalCode: "34840", address: "Lorem Mah. 12. Sok. No:5 D:8 Maltepe", sellerTaxNumber: "1112223334",
    registeredAt: "2026-04-20T12:00:00+03:00", expiresAt: "2029-04-20", extended: true,
  },
  {
    id: "w2", serialNumber: "ZWARC-2025-113407", categorySlug: "mma-ortulu-elektrod-kaynak-makineleri", productId: "p-arc-200",
    ownerName: "Zeynep Arslan", email: "hobi@demo.com", phone: "+90 536 444 44 44",
    city: "Ankara", postalCode: "06370", address: "Lorem Cad. No:3 Yenimahalle", sellerTaxNumber: "5556667778",
    registeredAt: "2025-12-05T09:20:00+03:00", expiresAt: "2027-12-05", extended: false,
  },
];

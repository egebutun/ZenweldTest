import type { NewsItem, ZenweldEvent } from "../types";
import { stockPhotos } from "./images";

/**
 * ETKINLIK TAKVIMI
 *
 * Veriler Zenweld'in katildigi gercek fuarlardan derlendi.
 * Logolar: apps/zenweld-web/public/images/events/<slug>.png
 * Fotograflar: apps/zenweld-web/public/images/events/<slug>/1.jpg ...
 *
 * !! DOGRULANMALI !! isaretli alanlar (mekan adi, aciklama) eksik veya
 * tahminidir; kesin bilgiyle degistirilmelidir.
 */

const logo = (slug: string) => `/images/events/${slug}.png`;

export const events: ZenweldEvent[] = [
  {
    id: "e-big5-global-2025",
    slug: "big-5-global-2025",
    title: { tr: "Big 5 Global 2025", en: "Big 5 Global 2025" },
    summary: {
      tr: "Big 5 Global, dünyanın en büyük ve en prestijli yapı ve inşaat fuarı.",
      en: "Big 5 Global is the world's largest and most prestigious construction industry event.",
    },
    description: {
      tr: "Big 5 Global, dünyanın en büyük ve en prestijli yapı ve inşaat fuarıdır. Dubai World Trade Centre'da düzenlenen fuarda Zenweld olarak kaynak makineleri ve plazma kesme sistemlerimizi Orta Doğu pazarındaki iş ortaklarımızla buluşturuyoruz.",
      en: "Big 5 Global is the world's largest and most prestigious construction industry event. At Dubai World Trade Centre, Zenweld presents its welding machines and plasma cutting systems to partners across the Middle East market.",
    },
    startDate: "2025-11-24",
    endDate: "2025-11-27",
    venue: { tr: "Dubai World Trade Centre", en: "Dubai World Trade Centre" },
    city: "Dubai",
    country: "Birleşik Arap Emirlikleri",
    logoUrl: logo("big-5-global-2025"),
    images: [stockPhotos.factoryLine, stockPhotos.industrialShop],
    featured: true,
    active: true,
  },
  {
    id: "e-international-hardware-riyad-2025",
    slug: "international-hardware-riyad-2025",
    title: { tr: "International Hardware Riyad", en: "International Hardware Riyadh" },
    summary: {
      tr: "International Hardware Riyadh 2025, Orta Doğu'nun en büyük donanım, el aletleri, yapı malzemeleri ve endüstriyel ekipman fuarlarından biridir.",
      en: "International Hardware Riyadh 2025 is one of the Middle East's largest hardware, hand tools, building materials and industrial equipment fairs.",
    },
    description: {
      tr: "International Hardware Riyadh 2025, Orta Doğu'nun en büyük donanım, el aletleri, yapı malzemeleri ve endüstriyel ekipman fuarlarından biridir. Zenweld olarak bölgedeki dağıtım ağımızı genişletmek ve yeni ürünlerimizi tanıtmak için fuarda yer aldık.",
      en: "International Hardware Riyadh 2025 is one of the Middle East's largest hardware, hand tools, building materials and industrial equipment fairs. Zenweld took part to expand its regional distribution network and present its new products.",
    },
    startDate: "2025-06-16",
    endDate: "2025-06-18",
    venue: {
      tr: "Riyadh International Convention and Exhibition Center",
      en: "Riyadh International Convention and Exhibition Center",
    },
    city: "Riyad",
    country: "Suudi Arabistan",
    logoUrl: logo("international-hardware-riyad-2025"),
    images: [stockPhotos.industrialShop, stockPhotos.teamTalk],
    featured: false,
    active: true,
  },
  {
    id: "e-win-eurasia-2025",
    slug: "win-eurasia-2025",
    title: {
      tr: "WIN EURASIA 2025 Otomasyon ve Makine Teknolojileri Fuarı",
      en: "WIN EURASIA 2025 Automation and Machine Technologies Fair",
    },
    summary: {
      tr: "Avrasya Bölgesi'nin lider endüstri fuarı olarak 30 yıldır imalat sanayinin rotasını çizen WIN EURASIA Otomasyon ve Makine Teknolojileri Fuarı.",
      en: "WIN EURASIA, the leading industrial fair of the Eurasia region, has been charting the course of manufacturing for 30 years.",
    },
    description: {
      tr: "Avrasya Bölgesi'nin lider endüstri fuarı olarak 30 yıldır imalat sanayinin rotasını çizen WIN EURASIA Otomasyon ve Makine Teknolojileri Fuarı'nda Zenweld standında en yeni kaynak ve kesme teknolojilerimizi sergiledik.",
      en: "At WIN EURASIA, the leading industrial fair of the Eurasia region that has charted the course of manufacturing for 30 years, Zenweld showcased its newest welding and cutting technologies.",
    },
    startDate: "2025-05-28",
    endDate: "2025-05-31",
    venue: { tr: "İstanbul Fuar Merkezi", en: "Istanbul Expo Center" },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2025"),
    images: [stockPhotos.factoryLine, stockPhotos.engineer, stockPhotos.teamTalk],
    featured: true,
    active: true,
  },
  {
    id: "e-imatech-2025",
    slug: "imatech-2025",
    title: {
      tr: "İmatech 2025 — 3. Endüstriyel Üretim Teknolojileri Fuarı",
      en: "İmatech 2025 — 3rd Industrial Production Technologies Fair",
    },
    summary: {
      tr: "Zenweld olarak, sektörün en prestijli endüstriyel üretim ve kaynak teknolojileri etkinliklerinden biri olan İmatech 2025 Fuarı'nda yer alıyoruz.",
      en: "Zenweld takes part in İmatech 2025, one of the sector's most prestigious industrial production and welding technology events.",
    },
    description: {
      tr: "Zenweld olarak, sektörün en prestijli endüstriyel üretim ve kaynak teknolojileri etkinliklerinden biri olan İmatech 2025 Fuarı'nda yer alıyoruz. Fuar İzmir'de düzenlenen etkinlikte yeni nesil inverter kaynak makinelerimizi ve plazma kesme sistemlerimizi ziyaretçilerle buluşturduk.",
      en: "Zenweld took part in İmatech 2025, one of the sector's most prestigious industrial production and welding technology events. At Fuar İzmir we introduced our new generation inverter welding machines and plasma cutting systems to visitors.",
    },
    startDate: "2025-02-20",
    endDate: "2025-02-23",
    venue: { tr: "Fuar İzmir", en: "Fuar İzmir" },
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2025"),
    images: [stockPhotos.engineer, stockPhotos.metalWork],
    featured: false,
    active: true,
  },
  {
    id: "e-istanbul-hirdavat-2024",
    slug: "istanbul-hirdavat-fuari-2024",
    title: {
      tr: "2024 Uluslararası İstanbul Hırdavat Fuarı",
      en: "2024 International Istanbul Hardware Fair",
    },
    summary: {
      tr: "Yeni ürünlerimizi görmek ve sektördeki en son yenilikleri keşfetmek için standımıza bekliyoruz.",
      en: "Visit our stand to see our new products and discover the latest innovations in the sector.",
    },
    description: {
      tr: "2024 Uluslararası İstanbul Hırdavat Fuarı'nda yeni ürünlerimizi ve sektördeki en son yenilikleri ziyaretçilerimizle paylaştık. IFM Yeşilköy'de düzenlenen fuarda bayilerimiz ve iş ortaklarımızla bir araya geldik.",
      en: "At the 2024 International Istanbul Hardware Fair we shared our new products and the latest sector innovations with our visitors, meeting our dealers and partners at IFM Yeşilköy.",
    },
    startDate: "2024-11-20",
    endDate: "2024-11-23",
    venue: { tr: "IFM — Yeşilköy", en: "IFM — Yeşilköy" },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("istanbul-hirdavat-fuari-2024"),
    images: [stockPhotos.toolsFlatlay, stockPhotos.workshop],
    featured: false,
    active: true,
  },
  {
    id: "e-win-eurasia-2024",
    slug: "win-eurasia-2024",
    title: {
      tr: "WIN EURASIA 2024 Otomasyon ve Makine Teknolojileri Fuarı",
      en: "WIN EURASIA 2024 Automation and Machine Technologies Fair",
    },
    summary: {
      tr: "İmalat sanayinin Avrasya'daki en büyük buluşmasında Zenweld standıyla yerimizi aldık.",
      en: "Zenweld had its stand at Eurasia's largest gathering of the manufacturing industry.",
    },
    description: {
      tr: "İmalat sanayinin Avrasya'daki en büyük buluşması olan WIN EURASIA 2024'te Zenweld standıyla yerimizi aldık. Ziyaretçilerimize kaynak ve kesme çözümlerimizi canlı demolarla tanıttık. /* DOĞRULANMALI — etkinlik metni onaylanmalı */",
      en: "Zenweld had its stand at WIN EURASIA 2024, Eurasia's largest gathering of the manufacturing industry, introducing our welding and cutting solutions with live demonstrations.",
    },
    startDate: "2024-06-05",
    endDate: "2024-06-08",
    venue: { tr: "İstanbul Fuar Merkezi", en: "Istanbul Expo Center" },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2024"),
    images: [stockPhotos.factoryLine],
    featured: false,
    active: true,
  },
  {
    id: "e-konya-makine-2024",
    slug: "konya-makine-teknolojileri-fuari-2024",
    title: {
      tr: "Konya Makine Teknolojileri Fuarı 2024",
      en: "Konya Machine Technologies Fair 2024",
    },
    summary: {
      tr: "İç Anadolu'nun en büyük makine ve imalat teknolojileri fuarında bayilerimizle buluştuk.",
      en: "We met our dealers at Central Anatolia's largest machine and manufacturing technologies fair.",
    },
    description: {
      tr: "İç Anadolu'nun en büyük makine ve imalat teknolojileri fuarında bayilerimiz ve bölge müşterilerimizle buluştuk. /* DOĞRULANMALI — mekan adı ve etkinlik metni onaylanmalı */",
      en: "We met our dealers and regional customers at Central Anatolia's largest machine and manufacturing technologies fair.",
    },
    startDate: "2024-05-08",
    endDate: "2024-05-11",
    venue: { tr: "Konya Fuar Merkezi", en: "Konya Fair Center" },
    city: "Konya",
    country: "Türkiye",
    logoUrl: logo("konya-makine-teknolojileri-fuari-2024"),
    images: [stockPhotos.workshop],
    featured: false,
    active: true,
  },
  {
    id: "e-imatech-2024",
    slug: "imatech-2024",
    title: {
      tr: "İmatech 2024 — 2. Endüstriyel Üretim Teknolojileri Fuarı",
      en: "İmatech 2024 — 2nd Industrial Production Technologies Fair",
    },
    summary: {
      tr: "Zenweld ve Önder Kaynak Makina ve Malzemeleri'nin birlikte katıldığı 2. Endüstriyel Üretim Teknolojileri Fuarı, sektörde önemli bir etkinlik olarak dikkat çekti.",
      en: "The 2nd Industrial Production Technologies Fair, attended jointly by Zenweld and Önder Kaynak, stood out as a significant sector event.",
    },
    description: {
      tr: "Zenweld ve Önder Kaynak Makina ve Malzemeleri'nin birlikte katıldığı 2. Endüstriyel Üretim Teknolojileri Fuarı, sektörde önemli bir etkinlik olarak dikkat çekti. Fuar İzmir'de ürün gamımızı ziyaretçilerle paylaştık.",
      en: "The 2nd Industrial Production Technologies Fair, attended jointly by Zenweld and Önder Kaynak, stood out as a significant sector event. We shared our product range with visitors at Fuar İzmir.",
    },
    startDate: "2024-02-22",
    endDate: "2024-02-25",
    venue: { tr: "Fuar İzmir", en: "Fuar İzmir" },
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2024"),
    images: [stockPhotos.metalWork, stockPhotos.teamTalk],
    featured: false,
    active: true,
  },

  /* ---- Yaklasan etkinlikler (ornek — tarihler dogrulanmalidir) ---- */
  {
    id: "e-win-eurasia-2027",
    slug: "win-eurasia-2027",
    title: {
      tr: "WIN EURASIA 2027 Otomasyon ve Makine Teknolojileri Fuarı",
      en: "WIN EURASIA 2027 Automation and Machine Technologies Fair",
    },
    summary: {
      tr: "Avrasya'nın lider endüstri fuarında yeni nesil pulse MIG ve plazma kesme sistemlerimizi tanıtacağız.",
      en: "We will introduce our new generation pulse MIG and plasma cutting systems at Eurasia's leading industrial fair.",
    },
    description: {
      tr: "Avrasya'nın lider endüstri fuarında yeni nesil pulse MIG ve plazma kesme sistemlerimizi tanıtacağız. Standımızda canlı kaynak demoları ve teknik ekibimizle birebir görüşme imkânı olacak. /* DOĞRULANMALI — tarih ve stant bilgisi kesinleşmedi */",
      en: "We will introduce our new generation pulse MIG and plasma cutting systems at Eurasia's leading industrial fair, with live welding demonstrations and one-to-one meetings with our technical team.",
    },
    startDate: "2027-05-26",
    endDate: "2027-05-29",
    venue: { tr: "İstanbul Fuar Merkezi", en: "Istanbul Expo Center" },
    city: "İstanbul",
    country: "Türkiye",
    logoUrl: logo("win-eurasia-2027"),
    images: [stockPhotos.factoryLine, stockPhotos.engineer],
    booth: "Hall 9 / B-14",
    featured: true,
    active: true,
  },
  {
    id: "e-imatech-2027",
    slug: "imatech-2027",
    title: {
      tr: "İmatech 2027 — Endüstriyel Üretim Teknolojileri Fuarı",
      en: "İmatech 2027 — Industrial Production Technologies Fair",
    },
    summary: {
      tr: "Fuar İzmir'de düzenlenecek İmatech 2027'de bayilerimiz ve müşterilerimizle buluşuyoruz.",
      en: "We meet our dealers and customers at İmatech 2027, held at Fuar İzmir.",
    },
    description: {
      tr: "Fuar İzmir'de düzenlenecek İmatech 2027'de bayilerimiz ve müşterilerimizle buluşuyoruz. /* DOĞRULANMALI — tarih kesinleşmedi */",
      en: "We meet our dealers and customers at İmatech 2027, held at Fuar İzmir.",
    },
    startDate: "2027-02-17",
    endDate: "2027-02-20",
    venue: { tr: "Fuar İzmir", en: "Fuar İzmir" },
    city: "İzmir",
    country: "Türkiye",
    logoUrl: logo("imatech-2027"),
    images: [stockPhotos.metalWork],
    featured: false,
    active: true,
  },
];

/* ------------------------------------------------------------------ */
/* Haberler                                                            */
/* ------------------------------------------------------------------ */

export const news: NewsItem[] = [
  {
    id: "n1",
    slug: "yeni-bayi-agi-genislemesi",
    title: {
      tr: "Bayi ağımız 30 noktaya ulaştı",
      en: "Our dealer network reaches 30 locations",
    },
    summary: {
      tr: "Türkiye genelindeki yetkili satış ve servis noktalarımızın sayısı 30'a ulaştı.",
      en: "Our authorised sales and service points across Türkiye have reached 30.",
    },
    body: {
      tr: "Türkiye genelindeki yetkili satış ve servis noktalarımızın sayısı 30'a ulaştı. Yeni açılan noktalarla birlikte müşterilerimize daha hızlı servis ve stoktan teslim imkânı sunuyoruz.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      en: "Our authorised sales and service points across Türkiye have reached 30. With the newly opened locations we offer faster service and stock availability to our customers.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    coverUrl: stockPhotos.industrialShop,
    category: { tr: "Kurumsal", en: "Corporate" },
    publishedAt: "2026-08-12T09:00:00+03:00",
    featured: true,
    active: true,
  },
  {
    id: "n2",
    slug: "evomig-205-p-tanitildi",
    title: {
      tr: "Evomig 205 P Pulse MIG ürün gamımıza katıldı",
      en: "Evomig 205 P Pulse MIG joins our range",
    },
    summary: {
      tr: "Double pulse desteği ve renkli sinerjik ekranıyla Evomig 205 P satışa sunuldu.",
      en: "With double pulse support and a colour synergic display, the Evomig 205 P is now available.",
    },
    body: {
      tr: "Double pulse desteği ve renkli sinerjik ekranıyla Evomig 205 P satışa sunuldu. Özellikle alüminyum ve paslanmaz uygulamalarında dekoratif dikiş görünümü sağlıyor.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
      en: "With double pulse support and a colour synergic display, the Evomig 205 P is now available, delivering a decorative bead appearance especially on aluminium and stainless applications.\n\nLorem ipsum dolor sit amet.",
    },
    coverUrl: stockPhotos.engineer,
    category: { tr: "Ürün", en: "Product" },
    publishedAt: "2026-06-03T09:00:00+03:00",
    featured: false,
    active: true,
  },
  {
    id: "n3",
    slug: "ihracat-pazarlari-genisliyor",
    title: {
      tr: "İhracat pazarlarımız Orta Doğu'da genişliyor",
      en: "Our export markets expand in the Middle East",
    },
    summary: {
      tr: "Riyad ve Dubai fuarlarının ardından bölgedeki dağıtım ağımızı büyütüyoruz.",
      en: "Following the Riyadh and Dubai fairs, we are growing our regional distribution network.",
    },
    body: {
      tr: "Riyad ve Dubai fuarlarının ardından bölgedeki dağıtım ağımızı büyütüyoruz.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
      en: "Following the Riyadh and Dubai fairs, we are growing our regional distribution network.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    coverUrl: stockPhotos.factoryLine,
    category: { tr: "İhracat", en: "Export" },
    publishedAt: "2026-01-20T09:00:00+03:00",
    featured: false,
    active: true,
  },
];

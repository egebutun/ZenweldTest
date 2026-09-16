import type { Retailer } from "../types";

/**
 * Urun sayfasindaki "Ayrica online alisveris olarak surada da mevcuttur"
 * bolumunde listelenen e-ticaret siteleri.
 *
 * isOwnStore = true olan kayit, bu monorepo icindeki bayi-shop uygulamasidir.
 */
export const retailers: Retailer[] = [
  { id: "r-basak-hirdavat", name: "Başak Hırdavat", websiteUrl: "https://www.basakhirdavat.com/", logoText: "BAŞAK HIRDAVAT", isOwnStore: false, city: "İstanbul", active: true },
  { id: "r-zenweld-bayi-a", name: "ZENWELD-BAYİ-A", websiteUrl: "http://localhost:3001", logoText: "ZENWELD-BAYİ-A", isOwnStore: true, city: "İstanbul", active: true },
  { id: "r-ostim-online", name: "Ostim Kaynak Online", websiteUrl: "https://example.com/ostim-kaynak", logoText: "OSTİM KAYNAK", isOwnStore: false, city: "Ankara", active: true },
  { id: "r-ege-kaynak", name: "Ege Kaynak Store", websiteUrl: "https://example.com/ege-kaynak", logoText: "EGE KAYNAK", isOwnStore: false, city: "İzmir", active: true },
  { id: "r-konya-teknik", name: "Konya Teknik Online", websiteUrl: "https://example.com/konya-teknik", logoText: "KONYA TEKNİK", isOwnStore: false, city: "Konya", active: true },
  { id: "r-kocaeli-endustri", name: "Kocaeli Endüstri Market", websiteUrl: "https://example.com/kocaeli-endustri", logoText: "KOCAELİ ENDÜSTRİ", isOwnStore: false, city: "Kocaeli", active: true },
  { id: "r-kaynakmakinem", name: "Kaynakmakinem.com", websiteUrl: "https://kaynakmakinem.com/", logoText: "KAYNAKMAKİNEM", isOwnStore: false, active: true },
  { id: "r-kaynakekipmanlari", name: "Kaynak Ekipmanları", websiteUrl: "https://www.kaynakekipmanlari.com/", logoText: "KAYNAK EKİPMANLARI", isOwnStore: false, active: true },
  { id: "r-act-kaynak", name: "ACT Kaynak", websiteUrl: "https://www.actkaynak.com/", logoText: "ACT KAYNAK", isOwnStore: false, active: true },
  { id: "r-bares", name: "Bares Makina", websiteUrl: "https://www.bares.com.tr/", logoText: "BARES", isOwnStore: false, active: true },
];

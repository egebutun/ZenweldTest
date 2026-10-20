import type { CardProgram } from "../checkout";
import type { PaymentPos, SiteSettings } from "../types";

/** [taksit sayisi, vade farki %] — null: o taksit sunulmuyor */
const customerRates = (rates: [number, number | null][]) =>
  rates.map(([count, rate]) => ({ count, ratePercent: rate ?? 0, enabled: rate !== null }));

/** Firma taksit oranlari: tek cekim, 2, 3, 6, 9, 12 taksit icin komisyon % */
const firmRates = (rates: number[]) => [1, 2, 3, 6, 9, 12].map((count, i) => ({ count, ratePercent: rates[i] }));

const bank = (
  id: string,
  bankShortName: string,
  name: string,
  program: CardProgram,
  merchantNo: string,
  customer: [number, number | null][],
  firm: number[],
): PaymentPos => ({
  id,
  bankShortName,
  name,
  program,
  merchantNo,
  posName: name.toLocaleUpperCase("tr"),
  active: true,
  isDefault: false,
  installments: customerRates(customer),
  commissions: firmRates(firm),
});

const STANDARD: [number, number | null][] = [[2, 0], [3, 0], [6, 4.5], [9, 7.5], [12, 10.5]];

/** Ornek banka POS'lari: Turkiye'deki 8 kart programi + diger kartlar icin iyzico */
const samplePos: PaymentPos[] = [
  bank("pos-garanti", "Garanti", "Garanti Bonus", "Bonus", "1000000001", STANDARD, [1.79, 3.19, 4.29, 7.49, 10.69, 13.89]),
  bank("pos-yapikredi", "Yapı Kredi", "Yapı Kredi World", "World", "1000000002", STANDARD, [1.75, 3.15, 4.25, 7.39, 10.59, 13.79]),
  bank("pos-isbank", "İş Bankası", "İş Bankası Maximum", "Maximum", "1000000003", STANDARD, [1.79, 3.29, 4.39, 7.59, 10.79, 13.99]),
  bank("pos-akbank", "Akbank", "Akbank Axess", "Axess", "1000000004", STANDARD, [1.69, 3.09, 4.19, 7.29, 10.49, 13.69]),
  bank("pos-qnb", "QNB", "QNB CardFinans", "CardFinans", "1000000005", [[2, 0], [3, 0], [6, 4.9], [9, 7.9], [12, 10.9]], [1.85, 3.25, 4.35, 7.55, 10.75, 13.95]),
  bank("pos-halkbank", "Halkbank", "Halkbank Paraf", "Paraf", "1000000006", [[2, 0], [3, 0], [6, 4.5], [9, 7.5], [12, null]], [1.69, 2.99, 4.09, 7.19, 10.39, 13.59]),
  bank("pos-hsbc", "HSBC", "HSBC Advantage", "Advantage", "1000000007", [[2, 0], [3, 0], [6, 5], [9, null], [12, null]], [1.89, 3.39, 4.49, 7.69, 10.89, 14.09]),
  bank("pos-ziraat", "Ziraat", "Ziraat Bankkart Combo", "BankkartCombo", "1000000008", [[2, 0], [3, 0], [6, 4.5], [9, 7.5], [12, 10.5]], [1.59, 2.89, 3.99, 7.09, 10.29, 13.49]),
  {
    id: "pos-iyzico",
    bankShortName: "iyzico",
    name: "iyzico",
    merchantNo: "1000000009",
    posName: "İYZİCO",
    active: true,
    isDefault: true,
    installments: [],
    commissions: [{ count: 1, ratePercent: 2.99 }],
  },
];

/**
 * Site ayarlarinin fabrika degerleri. Yonetim panelindeki "Varsayilana
 * don" dugmeleri bu degerleri geri yukler.
 */
export const defaultSettings: SiteSettings = {
  richText: {
    headingSize: 18,
    headingColor: "#141619",
    headingUppercase: true,
    accentColor: "#b82429",
    accentWidth: 40,
    leadSize: 18,
    bodySize: 15,
    bodyColor: "#3d4348",
    strongColor: "#141619",
  },

  // !! Kargo ucreti, banka POS'lari ve oranlari ve IBAN'lar ORNEKTIR; yonetim
  // panelindeki Magaza Ayarlari sayfasindan gercek degerler girilmelidir.
  shop: {
    freeShippingThreshold: 5000,
    shippingFee: 250,
    pos: samplePos,
    minInstallmentAmount: 1000,
    bankAccounts: [
      {
        id: "ba-1",
        bankName: "Örnek Banka A.Ş.",
        accountHolder: "Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş.",
        iban: "TR00 0000 0000 0000 0000 0000 01",
      },
      {
        id: "ba-2",
        bankName: "Örnek Katılım Bankası",
        accountHolder: "Zenweld Kaynak ve Kesme Ekip İnş San Tic A.Ş.",
        iban: "TR00 0000 0000 0000 0000 0000 02",
      },
    ],
    transferDueDays: 3,
    carriers: ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo", "UPS"],
  },
  stock: {
    // Bayi/satici bu kadar gun dosya gondermezse stogu sitede gizlenir.
    staleDays: 3,
  },
};

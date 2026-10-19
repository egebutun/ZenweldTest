import type { SiteSettings } from "../types";

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

  // !! Kargo ucreti, vade farki oranlari ve IBAN'lar ORNEKTIR; yonetim
  // panelindeki Magaza Ayarlari sayfasindan gercek degerler girilmelidir.
  shop: {
    freeShippingThreshold: 5000,
    shippingFee: 250,
    installments: [
      { count: 2, ratePercent: 0, enabled: true },
      { count: 3, ratePercent: 0, enabled: true },
      { count: 6, ratePercent: 4.5, enabled: true },
      { count: 9, ratePercent: 7.5, enabled: true },
      { count: 12, ratePercent: 10.5, enabled: true },
    ],
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

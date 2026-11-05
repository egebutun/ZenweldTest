import { describe, expect, it } from "vitest";
import {
  TITLE_REQUIRED,
  defaultSettings,
  documentAddressError,
  documentFileFromAddress,
  documentPageError,
  isDocumentAddress,
  legalDraftError,
  richTextStyleError,
} from "@zenweld/data";

/* docs/IS-KURALLARI.md › 22. Panelde kayıt düzenleme (Yasal Metinler, Belgeler, Görünüm) */

describe("yasal metin ve belge sayfası", () => {
  it("başlık zorunlu; yasal metinde metin de zorunlu", () => {
    expect(legalDraftError({ title: " ", body: "Metin" })).toBe(TITLE_REQUIRED);
    expect(legalDraftError({ title: "KVKK", body: " " })).toBe("Metin zorunludur.");
    expect(legalDraftError({ title: "KVKK", body: "Metin" })).toBeNull();
    expect(documentPageError({ title: "" })).toBe(TITLE_REQUIRED);
    expect(documentPageError({ title: "MSDS" })).toBeNull();
  });
});

describe("belge adresi (veritabanı modu, KARARLAR K-104)", () => {
  it("https://, http:// ya da / ile başlar, boşluk içermez", () => {
    expect(documentAddressError("")).toBe("Dosyanın adresini girin.");
    expect(documentAddressError("https://dosya.ornek/a.pdf")).toBeNull();
    expect(documentAddressError(" /belgeler/a.pdf ")).toBeNull();
    for (const bad of ["dosya.pdf", "ftp://a/b.pdf", "data:application/pdf;base64,AA", "https://a/b c.pdf", "javascript:alert(1)"]) {
      expect(documentAddressError(bad)).toBe("Dosya adresi https:// ile başlamalı ve boşluk içermemeli.");
    }
  });

  it("tarayıcıya yüklenen dosyanın anahtarı adres sayılmaz", () => {
    expect(isDocumentAddress("doc-abc-l2x9")).toBe(false);
    expect(isDocumentAddress("https://dosya.ornek/a.pdf")).toBe(true);
  });

  it("dosya adı ve türü adresin son parçasından; boyut bilinmez (0)", () => {
    expect(documentFileFromAddress("https://dosya.ornek/msds/ER70S-6%20Tel.pdf?v=2#s1", "Başlık")).toEqual({
      fileName: "ER70S-6 Tel.pdf",
      mimeType: "application/pdf",
      size: 0,
    });
    expect(documentFileFromAddress("https://dosya.ornek/Rehber.XLSX", "").mimeType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    // Son parca yoksa baslik; uzantisi bilinmeyen dosya genel ikili dosya.
    expect(documentFileFromAddress("https://dosya.ornek/", "Kaynak Rehberi")).toEqual({
      fileName: "Kaynak Rehberi",
      mimeType: "application/octet-stream",
      size: 0,
    });
    expect(documentFileFromAddress("https://dosya.ornek/%E0%A4%A.pdf", "").fileName).toBe("%E0%A4%A.pdf");
  });
});

describe("Görünüm", () => {
  const style = { ...defaultSettings.richText };

  it("varsayılan ayarlar geçerli", () => {
    expect(richTextStyleError(style)).toBeNull();
  });

  it("renkler #RRGGBB", () => {
    expect(richTextStyleError({ ...style, bodyColor: "#fff" })).toBe("Gövde rengi #RRGGBB biçiminde olmalı (örnek: #141619).");
    expect(richTextStyleError({ ...style, accentColor: "red" })).toBe("Vurgu rengi #RRGGBB biçiminde olmalı (örnek: #141619).");
    expect(richTextStyleError({ ...style, strongColor: "#A1B2C3" })).toBeNull();
  });

  it("puntolar ve çizgi genişliği sınırlar içinde tam sayı", () => {
    expect(richTextStyleError({ ...style, headingSize: 33 })).toBe("Punto ve genişlik değerleri 14–32 arasında olmalı.");
    expect(richTextStyleError({ ...style, bodySize: 11 })).toBe("Punto ve genişlik değerleri 12–22 arasında olmalı.");
    expect(richTextStyleError({ ...style, leadSize: 15.5 })).toBe("Punto ve genişlik değerleri 14–26 arasında olmalı.");
    expect(richTextStyleError({ ...style, accentWidth: 0 })).toBeNull();
    expect(richTextStyleError({ ...style, accentWidth: 161 })).toBe("Punto ve genişlik değerleri 0–160 arasında olmalı.");
  });
});

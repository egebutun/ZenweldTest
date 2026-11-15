import { describe, expect, it } from "vitest";
import {
  baseSubject,
  emailSettingsVersion,
  findRecordCodes,
  notificationText,
  parseOutgoingEmail,
  parseRecipients,
  parseSender,
  quotedReply,
  replySubject,
} from "@zenweld/data";

/* docs/IS-KURALLARI.md › 18. E-postalar (KARARLAR K-116) */
describe("E-posta adresleri", () => {
  it("alıcılar virgül, noktalı virgül, boşluk ya da satır sonuyla ayrılır; küçük harfe çevrilir; aynı adres bir kez", () => {
    expect(parseRecipients(" Satis@Zenweld.com, satis@zenweld.com;\nmuhasebe@zenweld.com ")).toEqual({
      ok: true,
      value: ["satis@zenweld.com", "muhasebe@zenweld.com"],
    });
    expect(parseRecipients("  ")).toEqual({ ok: true, value: [] });
  });

  it("geçersiz adres ve 10'dan fazla adres reddedilir", () => {
    expect(parseRecipients("satis@zenweld")).toEqual({ ok: false, error: '"satis@zenweld" geçerli bir e-posta adresi değil.' });
    const eleven = Array.from({ length: 11 }, (_, i) => `a${i}@zenweld.com`).join(",");
    expect(parseRecipients(eleven)).toEqual({ ok: false, error: "En fazla 10 adres yazılabilir." });
  });

  it("gönderici tek adrestir; boşsa varsayılan", () => {
    expect(parseSender(" Servis@Zenweld.com ")).toEqual({ ok: true, value: "servis@zenweld.com" });
    expect(parseSender("")).toEqual({ ok: true, value: undefined });
    expect(parseSender("a@b.com c@d.com")).toMatchObject({ ok: false });
  });

  it("listenin hali: satır sayısı ve en son değişen satır", () => {
    expect(emailSettingsVersion([])).toBe("0|");
    expect(emailSettingsVersion([{ updatedAt: "2026-11-05T09:00:00.000Z" }, { updatedAt: "2026-11-05T10:00:00.000Z" }])).toBe(
      "2|2026-11-05T10:00:00.000Z",
    );
  });
});

describe("Panelden yazılan e-posta", () => {
  const base = { type: "servis", to: "musteri@ornek.com", subject: " Servis   talebiniz ", body: " Merhaba\r\n" };

  it("alıcı, konu ve metin denetlenir; konu tek satıra indirilir", () => {
    expect(parseOutgoingEmail({ ...base, entity: { type: "service_requests", id: "sr-1" }, parentId: "12" })).toEqual({
      ok: true,
      value: { type: "servis", to: ["musteri@ornek.com"], subject: "Servis talebiniz", body: "Merhaba", entity: { type: "service_requests", id: "sr-1" }, parentId: "12" },
    });
    expect(parseOutgoingEmail({ ...base, to: "" })).toEqual({ ok: false, error: "Alıcı adresi yazın." });
    expect(parseOutgoingEmail({ ...base, subject: " " })).toEqual({ ok: false, error: "Konu yazın." });
    expect(parseOutgoingEmail({ ...base, body: "" })).toEqual({ ok: false, error: "E-postanın metnini yazın." });
    expect(parseOutgoingEmail({ ...base, type: "uydurma" })).toEqual({ ok: false, error: null });
  });

  it("yanıtın konusu 'Re:' ile başlar (zaten yanıtsa eklenmez); önceki e-posta '> ' ile alıntılanır", () => {
    expect(replySubject("Servis talebiniz")).toBe("Re: Servis talebiniz");
    expect(replySubject("YNT: Servis talebiniz")).toBe("YNT: Servis talebiniz");
    expect(quotedReply({ at: "2026-03-10T09:00:00.000Z", from: "a@ornek.com", body: "Bir\nİki" })).toMatch(/a@ornek\.com yazdı:\n> Bir\n> İki$/);
    expect(quotedReply({ at: "2026-03-10T09:00:00.000Z", from: "a@ornek.com" })).toBe("");
  });
});

describe("Gelen e-postanın eşleşmesi", () => {
  it("konunun yanıt ve iletme ekleri atılır", () => {
    expect(baseSubject("YNT: RE: Fwd:  Teklifiniz   hazır")).toBe("teklifiniz hazır");
    expect(baseSubject("İLT: Sipariş")).toBe("sipariş");
  });

  it("kayıt numaraları bulunur (büyük harfe çevrilir, bir kez)", () => {
    expect(findRecordCodes("srv-2026-0012 ve SIP-2026-00045, yine SRV-2026-0012; XYZ-2026-0001")).toEqual([
      { code: "SRV-2026-0012", prefix: "SRV" },
      { code: "SIP-2026-00045", prefix: "SIP" },
    ]);
    expect(findRecordCodes("TKL-26-1")).toEqual([]);
  });
});

describe("Bildirimin metni", () => {
  it("başlık, 'Alan: değer' satırları ve uzun metin; boş değer '—'", () => {
    expect(notificationText({ title: "Yeni servis talebi", rows: [["Talep no", "SRV-1"], ["Adres", ""]], note: ["Şikayet", "Çalışmıyor"] })).toBe(
      "Yeni servis talebi\n\nTalep no: SRV-1\nAdres: —\n\nŞikayet:\nÇalışmıyor",
    );
  });
});

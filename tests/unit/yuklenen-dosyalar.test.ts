import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  UPLOAD_EMPTY,
  checkUpload,
  detectFileType,
  isUploadKey,
  uploadAddress,
  uploadFileName,
  uploadKey,
  uploadKeyOf,
  uploadSizeError,
  uploadTypeError,
} from "@zenweld/data";
import { diskStorage, fileStorageFromEnv } from "../../packages/db/src/file-storage";

/* docs/IS-KURALLARI.md › 23. Yüklenen dosyalar (KARARLAR K-108) */

const bytes = (...values: (number | string)[]) =>
  Uint8Array.from(values.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));
const JPG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const WEBP = bytes("RIFF", 0, 0, 0, 0, "WEBPVP8 ");
const PDF = bytes("%PDF-1.7\n");
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0);
const OLE = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);

describe("dosyanın türü içeriğinden bulunur", () => {
  it("görsel ve PDF imzaları; adı ya da bildirilen türü önemli değil", () => {
    expect(detectFileType(JPG, "a.png")).toBe("jpg");
    expect(detectFileType(PNG, "foto.jpg")).toBe("png");
    expect(detectFileType(WEBP, "x")).toBe("webp");
    expect(detectFileType(bytes("GIF89a"), "x.gif")).toBe("gif");
    expect(detectFileType(bytes(0, 0, 0, 0x1c, "ftypavif"), "x.avif")).toBe("avif");
    expect(detectFileType(PDF, "belge.doc")).toBe("pdf");
  });

  it("Word, Excel ve ZIP: kabuğu uyan adın uzantısı; uymayan ZIP sayılır ya da tanınmaz", () => {
    expect(detectFileType(ZIP, "rapor.docx")).toBe("docx");
    expect(detectFileType(ZIP, "liste.XLSX")).toBe("xlsx");
    expect(detectFileType(ZIP, "arsiv.zip")).toBe("zip");
    expect(detectFileType(ZIP, "rapor.pdf")).toBe("zip");
    expect(detectFileType(OLE, "eski.doc")).toBe("doc");
    expect(detectFileType(OLE, "eski.xls")).toBe("xls");
    expect(detectFileType(OLE, "eski.msg")).toBeNull();
  });

  it("HTML, SVG ve bilinmeyen içerik tanınmaz", () => {
    expect(detectFileType(bytes("<html>"), "a.png")).toBeNull();
    expect(detectFileType(bytes('<svg xmlns="http://www.w3.org/2000/svg"/>'), "logo.svg")).toBeNull();
    expect(detectFileType(bytes(), "a.pdf")).toBeNull();
  });
});

describe("yükleme kuralları: tür ve boyut", () => {
  it("görsel: JPG, PNG, WebP, GIF, AVIF; en fazla 5 MB", () => {
    expect(checkUpload("gorsel", "a.png", PNG)).toEqual({ ok: true, ext: "png" });
    expect(checkUpload("gorsel", "a.pdf", PDF)).toEqual({ ok: false, error: uploadTypeError("gorsel") });
    expect(checkUpload("gorsel", "a.png", new Uint8Array(0))).toEqual({ ok: false, error: UPLOAD_EMPTY });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PNG);
    expect(checkUpload("gorsel", "a.png", big)).toEqual({ ok: false, error: uploadSizeError("gorsel") });
    expect(uploadSizeError("gorsel")).toBe("Dosya çok büyük; en fazla 5 MB.");
    expect(uploadTypeError("gorsel")).toBe("Bu dosya türü yüklenemez. Yüklenebilenler: JPG, PNG, WebP, GIF ya da AVIF.");
  });

  it("belge: PDF, Word, Excel, JPG, PNG, ZIP; en fazla 25 MB", () => {
    for (const [name, file, ext] of [
      ["a.pdf", PDF, "pdf"],
      ["a.docx", ZIP, "docx"],
      ["a.xls", OLE, "xls"],
      ["a.jpg", JPG, "jpg"],
      ["a.zip", ZIP, "zip"],
    ] as const) {
      expect(checkUpload("belge", name, file)).toEqual({ ok: true, ext });
    }
    expect(checkUpload("belge", "a.webp", WEBP)).toEqual({ ok: false, error: uploadTypeError("belge") });
    expect(uploadSizeError("belge")).toBe("Dosya çok büyük; en fazla 25 MB.");
  });
});

describe("depodaki anahtar ve sitedeki adres", () => {
  const at = new Date("2026-11-05T10:00:00.000Z");

  it("belgenin dosya adı sadeleşir; uzantı gerçek türdür", () => {
    expect(uploadFileName("MSDS ER70S-6 (2026).PDF", "pdf")).toBe("MSDS-ER70S-6-2026.pdf");
    expect(uploadFileName("Kaynak Rehberi Çalışma Şartları.docx", "docx")).toBe("Kaynak-Rehberi-Calisma-Sartlari.docx");
    expect(uploadFileName("../../etc/passwd", "pdf")).toBe("passwd.pdf");
    expect(uploadFileName("C:\\Belgeler\\rapor.pdf", "pdf")).toBe("rapor.pdf");
    expect(uploadFileName("ğüşıöç", "pdf")).toBe("gusioc.pdf");
    expect(uploadFileName("...", "pdf")).toBe("dosya.pdf");
    expect(uploadFileName(`${"a".repeat(200)}.pdf`, "pdf")).toBe(`${"a".repeat(80)}.pdf`);
  });

  it("görsel ve belge anahtarı; adres /dosya/ ile başlar", () => {
    const image = uploadKey("gorsel", at, "0123456789abcdef", "kapak.jpeg", "webp");
    expect(image).toBe("gorsel/2026/11/0123456789abcdef.webp");
    const doc = uploadKey("belge", at, "0123456789abcdef", "MSDS ER70S-6.pdf", "pdf");
    expect(doc).toBe("belge/2026/11/0123456789abcdef/MSDS-ER70S-6.pdf");
    expect([image, doc].every(isUploadKey)).toBe(true);
    expect(uploadAddress(doc)).toBe("/dosya/belge/2026/11/0123456789abcdef/MSDS-ER70S-6.pdf");
    expect(uploadKeyOf(uploadAddress(doc))).toBe(doc);
    expect(uploadKeyOf("https://dosya.ornek/a.pdf")).toBeNull();
  });

  it("başka klasöre çıkan, eksik ya da bilinmeyen türdeki anahtar geçersiz", () => {
    for (const key of [
      "gorsel/2026/11/0123456789abcdef.exe",
      "gorsel/2026/11/../../../x.png",
      "belge/2026/11/0123456789abcdef/../a.pdf",
      "belge/2026/11/0123456789abcdef/.gizli.pdf",
      "baska/2026/11/0123456789abcdef.png",
      "gorsel/2026/11/0123456789ABCDEF.png",
      "/gorsel/2026/11/0123456789abcdef.png",
    ]) {
      expect(isUploadKey(key), key).toBe(false);
    }
  });
});

describe("dosya deposu: sunucunun diski", () => {
  it("yazar, okur, boyutunu verir; olmayan dosya null; geçersiz anahtar reddedilir", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zenweld-depo-"));
    try {
      const storage = diskStorage(dir);
      const key = "belge/2026/11/0123456789abcdef/MSDS.pdf";
      await storage.put(key, PDF);
      expect(await storage.get(key)).toEqual(PDF);
      expect(await storage.size(key)).toBe(PDF.length);
      // Gecici dosya kalmaz.
      expect(await readdir(join(dir, "belge/2026/11/0123456789abcdef"))).toEqual(["MSDS.pdf"]);
      expect(await storage.get("gorsel/2026/11/0123456789abcdef.png")).toBeNull();
      expect(await storage.size("gorsel/2026/11/0123456789abcdef.png")).toBeNull();
      await expect(storage.put("../disari.png", PNG)).rejects.toThrow("Geçersiz dosya anahtarı");
      await expect(storage.get("gorsel/../../x.png")).rejects.toThrow("Geçersiz dosya anahtarı");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("ortam değişkeni yoksa depo yok", () => {
    expect(fileStorageFromEnv({})).toBeNull();
    expect(fileStorageFromEnv({ DOSYA_KLASORU: "/tmp/zenweld-dosyalar" })?.id).toBe("disk");
  });
});

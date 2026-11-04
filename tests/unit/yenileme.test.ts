import { describe, expect, it } from "vitest";
import { parseRefreshRequest } from "@/lib/server/refresh-request";
import { CACHE_KINDS } from "@/lib/server/tags";

/*
 * Siteyi yenileme ucu (app/api/yenile; KARARLAR K-88, Asama 3.6): yalnizca
 * sunucudaki gizli anahtarla calisir; hangi kayit turlerinin yenilenecegi
 * istekte verilir.
 */
const SECRET = "deneme-anahtari-123";
const ask = (authorization: string | null, body?: unknown) =>
  parseRefreshRequest({ secret: SECRET, authorization, body });

describe("Siteyi yenileme ucu", () => {
  it("anahtar sunucuda tanımlı değilse uç kapalıdır (404)", () => {
    for (const secret of [undefined, ""]) {
      expect(parseRefreshRequest({ secret, authorization: `Bearer ${SECRET}`, body: {} })).toMatchObject({
        ok: false,
        status: 404,
      });
    }
  });

  it("anahtarsız ya da yanlış anahtarlı istek reddedilir (401)", () => {
    expect(ask(null)).toMatchObject({ ok: false, status: 401 });
    expect(ask("Bearer yanlis")).toMatchObject({ ok: false, status: 401 });
    expect(ask(SECRET)).toMatchObject({ ok: false, status: 401 });
  });

  it("doğru anahtarla tür verilmezse bütün türler yenilenir", () => {
    expect(ask(`Bearer ${SECRET}`)).toEqual({ ok: true, kinds: CACHE_KINDS });
    expect(ask(`Bearer ${SECRET}`, { kayitlar: [] })).toEqual({ ok: true, kinds: CACHE_KINDS });
  });

  it("yalnızca istenen türler yenilenir; tekrar eden bir kez", () => {
    expect(ask(`Bearer ${SECRET}`, { kayitlar: ["katalog", "icerik", "katalog"] })).toEqual({
      ok: true,
      kinds: ["katalog", "icerik"],
    });
  });

  it("bilinmeyen tür reddedilir (400)", () => {
    expect(ask(`Bearer ${SECRET}`, { kayitlar: ["siparisler"] })).toMatchObject({ ok: false, status: 400 });
    expect(ask(`Bearer ${SECRET}`, { kayitlar: "katalog" })).toMatchObject({ ok: false, status: 400 });
  });
});

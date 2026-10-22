import { afterEach, describe, expect, it, vi } from "vitest";
import { createQuote, createServiceRequest, deleteQuote, mutate } from "@zenweld/store";

/* docs/IS-KURALLARI.md › 17. Kayıt numaraları */
describe("Kayıt numaraları", () => {
  const quote = {
    company: "",
    contactName: "Test",
    email: "test@ornek.com",
    phone: "",
    items: [],
    paymentPreference: "talk",
    status: "new",
  } as unknown as Parameters<typeof createQuote>[0];
  const request = { name: "Test", email: "test@ornek.com", reasons: [] } as unknown as Parameters<
    typeof createServiceRequest
  >[0];
  const numberOf = (code: string) => Number(code.split("-").at(-1));

  afterEach(() => {
    vi.useRealTimers();
  });

  it("biçim: TKL-<yıl>-<4 hane>, SRV-<yıl>-<4 hane>", () => {
    const year = new Date().getFullYear();
    expect(createQuote(quote).code).toMatch(new RegExp(`^TKL-${year}-\\d{4}$`));
    expect(createServiceRequest(request).code).toMatch(new RegExp(`^SRV-${year}-\\d{4}$`));
  });

  it("numara bir öncekinin bir fazlasıdır", () => {
    const first = createQuote(quote);
    const second = createQuote(quote);
    expect(numberOf(second.code)).toBe(numberOf(first.code) + 1);
  });

  it("en son kayıt silinse de numarası yeniden verilmez", () => {
    const latest = createQuote(quote);
    deleteQuote(latest.id);
    expect(numberOf(createQuote(quote).code)).toBe(numberOf(latest.code) + 1);

    const service = createServiceRequest(request);
    mutate((db) => {
      db.serviceRequests = db.serviceRequests.filter((r) => r.id !== service.id);
    });
    expect(numberOf(createServiceRequest(request).code)).toBe(numberOf(service.code) + 1);
  });

  it("her yıl 1'den başlar", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2099, 0, 1, 10, 0));
    expect(createQuote(quote).code).toBe("TKL-2099-0001");
    expect(createQuote(quote).code).toBe("TKL-2099-0002");
  });
});

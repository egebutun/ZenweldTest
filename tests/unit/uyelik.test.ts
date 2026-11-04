import { describe, expect, it } from "vitest";
import { PASSWORD_MIN_LENGTH, passwordProblem } from "../../packages/auth/src/rules";

/* docs/IS-KURALLARI.md › Üyelik (KARARLAR K-94) */

describe("yeni şifre", () => {
  it("en az 8 karakter", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(passwordProblem("1234567")).toBe("Şifre en az 8 karakter olmalıdır.");
    expect(passwordProblem("12345678")).toBeNull();
  });
});

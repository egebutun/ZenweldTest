import { describe, expect, it } from "vitest";
import {
  AUTH_ERRORS,
  LOGIN_LIMIT,
  NO_FAILED_LOGINS,
  PASSWORD_MIN_LENGTH,
  afterFailedLogin,
  isLoginLocked,
  passwordProblem,
  type LoginAttempts,
} from "../../packages/auth/src/rules";

/* docs/IS-KURALLARI.md › 16. Üyelik ve oturum (KARARLAR K-94) */

const MIN = 60_000;
const at = (minutes: number) => new Date(Date.UTC(2026, 10, 4, 9, 0) + minutes * MIN);

describe("yeni şifre", () => {
  it("en az 8 karakter", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(passwordProblem("1234567")).toBe("Şifre en az 8 karakter olmalıdır.");
    expect(passwordProblem("12345678")).toBeNull();
  });

  it("giriş hatasında hesap olup olmadığı belli olmaz: tek mesaj", () => {
    expect(AUTH_ERRORS.invalidLogin).toBe("E-posta ya da şifre hatalı.");
  });
});

describe("yanlış şifre sınırı (15 dakikada 10 yanlış → 15 dakika bekleme)", () => {
  const fail = (state: LoginAttempts, minute: number) => afterFailedLogin(state, at(minute));

  it("10. yanlış denemede kilitlenir; kilit 15 dakika sürer; sayaç sıfırlanır", () => {
    let state = NO_FAILED_LOGINS;
    for (let i = 0; i < 9; i++) state = fail(state, i);
    expect(state).toEqual({ failedCount: 9, failedSince: at(0), lockedUntil: null });
    expect(isLoginLocked(state, at(9))).toBe(false);
    state = fail(state, 10);
    expect(state).toEqual({ failedCount: 0, failedSince: null, lockedUntil: at(25) });
    expect(isLoginLocked(state, at(24))).toBe(true);
    expect(isLoginLocked(state, at(25))).toBe(false);
    expect(LOGIN_LIMIT).toEqual({ attempts: 10, windowMs: 15 * MIN, lockMs: 15 * MIN });
  });

  it("15 dakikalık pencere ilk yanlış denemeyle başlar; pencere geçince sayaç baştan", () => {
    let state = NO_FAILED_LOGINS;
    for (let i = 0; i < 9; i++) state = fail(state, i);
    // 15. dakikada pencere dolmus: bu deneme yeni pencerenin ilki.
    expect(fail(state, 15)).toEqual({ failedCount: 1, failedSince: at(15), lockedUntil: null });
  });
});

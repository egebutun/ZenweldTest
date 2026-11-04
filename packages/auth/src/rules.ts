import { tr } from "@zenweld/i18n";

/**
 * UYELIK KURALLARI (IS-KURALLARI › 16; KARARLAR K-94)
 *
 * Tarayicida ve sunucuda ayni kurallar ve ayni mesajlar kullanilir.
 */

export const AUTH_ERRORS = tr.auth.errors;

/** Yeni sifrede en az karakter (K-94). Var olan sifreler etkilenmez. */
export const PASSWORD_MIN_LENGTH = 8;

/** Yeni sifre kurala uymuyorsa nedeni; uyuyorsa null. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return AUTH_ERRORS.passwordTooShort.replace("{min}", String(PASSWORD_MIN_LENGTH));
  }
  return null;
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Uye basina en fazla adres ve favori (KARARLAR K-96). */
export const ACCOUNT_LIMITS = { addresses: 20, favourites: 500 };

/* ------------------------- Yanlis sifre siniri ------------------------- */

/** Bir hesaba 15 dakikada 10 yanlis denemeden sonra 15 dakika giris yok (K-94). */
export const LOGIN_LIMIT = { attempts: 10, windowMs: 15 * 60_000, lockMs: 15 * 60_000 };

export interface LoginAttempts {
  failedCount: number;
  /** Sayilan ilk yanlis denemenin ani */
  failedSince: Date | null;
  lockedUntil: Date | null;
}

export const NO_FAILED_LOGINS: LoginAttempts = { failedCount: 0, failedSince: null, lockedUntil: null };

export const isLoginLocked = (state: LoginAttempts, now: Date) => Boolean(state.lockedUntil && state.lockedUntil > now);

/**
 * Yanlis denemeden sonraki durum. 15 dakikalik pencere ilk yanlis denemeyle
 * baslar; pencere icinde 10. yanlis denemede hesap 15 dakika kilitlenir ve
 * sayac sifirlanir. Pencere gecmisse sayac bastan baslar.
 */
export function afterFailedLogin(state: LoginAttempts, now: Date): LoginAttempts {
  const inWindow = state.failedSince !== null && now.getTime() - state.failedSince.getTime() < LOGIN_LIMIT.windowMs;
  const failedCount = inWindow ? state.failedCount + 1 : 1;
  if (failedCount >= LOGIN_LIMIT.attempts) {
    return { failedCount: 0, failedSince: null, lockedUntil: new Date(now.getTime() + LOGIN_LIMIT.lockMs) };
  }
  return { failedCount, failedSince: inWindow ? state.failedSince : now, lockedUntil: null };
}

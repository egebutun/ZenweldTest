/**
 * UYELIK KURALLARI (IS-KURALLARI › Uyelik; KARARLAR K-94)
 *
 * Tarayicida ve sunucuda ayni kurallar kullanilir.
 */

/** Yeni sifrede en az karakter (K-94). Var olan sifreler etkilenmez. */
export const PASSWORD_MIN_LENGTH = 8;

/** Yeni sifre kurala uymuyorsa nedeni; uyuyorsa null. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`;
  return null;
}

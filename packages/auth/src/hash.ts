/**
 * DEMO amacli basit hash.
 *
 * !! UYARI !! Bu gercek bir sifre guvenligi saglamaz. Tarayicida calisir ve
 * geri dondurulebilir degildir ama kriptografik olarak guvenli de degildir.
 * Canliya cikmadan once gercek bir kimlik dogrulama servisi (Supabase Auth,
 * Auth0, kendi backend'iniz) kullanilmalidir.
 */
export function demoHash(input: string): string {
  let h1 = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  let h2 = 0x0;
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `zw1$${h1.toString(16)}${h2.toString(16)}`;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return demoHash(plain) === hash;
}

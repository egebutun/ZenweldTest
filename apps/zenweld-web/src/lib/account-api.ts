import { tr } from "@zenweld/i18n";

/**
 * Uyenin sunucudaki hesap uclarina istek (veritabani modu; /api/uyelik).
 * Basarisizsa sunucunun mesaji, ulasilamazsa genel mesaj doner.
 */
export async function accountRequest<T extends object>(
  api: string,
  action: string,
  body?: unknown,
): Promise<({ ok: true } & T) | { ok: false; error: string }> {
  try {
    const response = await fetch(`${api}/${action}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const answer = (await response.json().catch(() => ({}))) as T & { error?: string };
    return response.ok ? { ...answer, ok: true } : { ok: false, error: answer.error ?? tr.auth.errors.failed };
  } catch {
    return { ok: false, error: tr.auth.errors.unreachable };
  }
}

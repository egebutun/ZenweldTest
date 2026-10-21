"use client";

/**
 * FORMLARDAN ZENWELD'E E-POSTA (info@zenweld.com)
 *
 * Sunucu tarafi: app/api/bildirim (form turleri ve alanlari orada).
 * Kayit tutan formlar (teklif, servis, garanti, yorum, uyelik, siparis)
 * e-postayi haber vermek icin gonderir ve sonucunu beklemez; kaydi
 * olmayan formlar (iletisim, bayilik, Welders Club) sonuca gore basari ya da hata
 * gosterir (reached).
 */

export type NotifyType =
  | "iletisim"
  | "teklif"
  | "servis"
  | "garanti"
  | "yorum"
  | "uye"
  | "siparis"
  | "welders-club";

export interface SendResult {
  ok: boolean;
  delivered: boolean;
  demo: boolean;
}

/** Form ucuna gonderir; ag ya da sunucu hatasinda ok: false. */
export async function postForm(url: string, body: unknown): Promise<SendResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<SendResult>;
    return { ok: res.ok && data.ok === true, delivered: data.delivered === true, demo: data.demo === true };
  } catch {
    return { ok: false, delivered: false, demo: false };
  }
}

export function notifyZenweld(
  type: NotifyType,
  data: Record<string, string | number | boolean | string[] | undefined>,
): Promise<SendResult> {
  return postForm("/api/bildirim", { type, data });
}

/**
 * Ziyaretci acisindan form ulasti mi: e-posta gitti ya da demo adresinde
 * e-posta servisi tanimli degil (canlida tanimli degilse hata gosterilir).
 */
export const reached = (result: SendResult) => result.ok && (result.delivered || result.demo);

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { tr } from "@zenweld/i18n";

/**
 * PANEL ISTEKLERININ ORTAK PARCASI (veritabani modu; Asama 5, KARARLAR K-99)
 *
 * Panelin her alani (lib/admin-sales.ts, lib/admin-requests.ts) islemi
 * buradan sunucuya gonderir: /api/yonetim/<alan>/<islem>. Basarili olunca
 * ekranin verisi sunucudan yeniden okunur (router.refresh).
 *
 * Istek, ekranin gordugu son degisiklik anini (updatedAt) tasir. Ekran bir
 * kaydi kaydettikten hemen sonra, yenileme gelmeden ayni kaydi yeniden
 * kaydederse (or. once durum, hemen ardindan not) sunucunun dondurdugu yeni
 * an kullanilir; yoneticinin kendi degisikligi "baskasinin degisikligi"
 * sayilmaz.
 *
 * Demo modunda (server: false) ekranlar tarayicidaki veriye yazar.
 */

export type PanelAnswer = { ok: true; id?: string; updatedAt?: string } | { ok: false; error: string };

/** Bu sekmede kaydedilen kayitlarin sunucudaki son degisiklik ani ("tur:kimlik"). */
const written = new Map<string, string>();

/** Kaydin kimligi ve gonderilecek son degisiklik ani. kind: kayit turu (or. "orders"). */
export function recordRef(kind: string, record: { id: string; updatedAt?: string }) {
  const seen = record.updatedAt ?? "";
  const own = written.get(`${kind}:${record.id}`);
  return { id: record.id, updatedAt: own && own > seen ? own : seen };
}

/** Demo modunda tarayiciya yazilan islemin sonucu. */
export const localAnswer = (ok = true, id?: string): Promise<PanelAnswer> =>
  Promise.resolve(ok ? { ok: true, id } : { ok: false, error: tr.panel.failed });

/**
 * area: /api/yonetim altindaki uc ("satis", "talepler").
 * pending: istek ya da ardindan gelen yenileme surerken true (dugmeler
 * kapatilir, ayni islem iki kez gonderilmez).
 */
export function usePanelCall(area: string) {
  const { api } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  /** kind verilirse basarida kaydin yeni son degisiklik ani saklanir. */
  const call = async (action: string, body: { id?: string; [field: string]: unknown }, kind?: string): Promise<PanelAnswer> => {
    setSending(true);
    try {
      const response = await fetch(`/api/yonetim/${area}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const answer = (await response.json().catch(() => null)) as PanelAnswer | null;
      if (!answer || typeof answer.ok !== "boolean") return { ok: false, error: tr.panel.failed };
      if (answer.ok) {
        const id = answer.id ?? body.id;
        if (kind && id && answer.updatedAt) written.set(`${kind}:${id}`, answer.updatedAt);
        startRefresh(() => router.refresh());
      }
      return answer;
    } catch {
      return { ok: false, error: tr.panel.failed };
    } finally {
      setSending(false);
    }
  };

  return { server: api !== null, pending: sending || refreshing, call };
}

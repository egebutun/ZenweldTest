"use client";

import { useState } from "react";
import {
  emailSettingOf,
  emailSettingsVersion,
  parseRecipients,
  parseSender,
  type EmailMessage,
  type EmailSetting,
  type OutgoingEmail,
} from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import { tr } from "@zenweld/i18n";
import { addEmailMessage, getEmailSettings, saveEmailSettings, useDatabase } from "@zenweld/store";
import { localAnswer, usePanelCall, type PanelAnswer } from "./admin-panel";

/**
 * PANEL › E-POSTA ISLEMLERI (KARARLAR K-116)
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/eposta): adresler
 * kaydedilir, e-posta turun gondericisinden gonderilir ve metniyle
 * kaydedilir. Demo modunda tarayicidaki veriye yazilir; e-posta
 * gonderilmez, "Gönderilmedi" olarak kaydedilir.
 */

export type SendAnswer = { ok: true; id?: string; status: EmailMessage["status"]; error?: string } | { ok: false; error: string };

export function useEmailActions() {
  const db = useDatabase();
  const { user } = useAuth();
  const { server, pending, call } = usePanelCall("eposta");
  return {
    server,
    pending,
    /** Turun adresleri; yazilanlar once denetlenir (hata metni ekranda gosterilir). */
    saveSetting: async (type: string, sender: string, recipients: string, zenweld: boolean): Promise<PanelAnswer> => {
      const from = parseSender(sender);
      if (!from.ok) return { ok: false, error: `Gönderici: ${from.error ?? tr.panel.invalidRequest}` };
      const to = parseRecipients(zenweld ? recipients : "");
      if (!to.ok) return { ok: false, error: `Alıcılar: ${to.error ?? tr.panel.invalidRequest}` };
      const stored = getEmailSettings(db);
      if (server) {
        return call("adresler", { type, sender: from.value ?? "", recipients: to.value.join(", "), version: emailSettingsVersion(stored) });
      }
      const next: EmailSetting = { type, ...(from.value && { sender: from.value }), recipients: to.value };
      return localAnswer(saveEmailSettings([...stored.filter((s) => s.type !== type), next]));
    },
    /** Yeni e-posta ya da yanit (OutgoingEmail: packages/data › parseOutgoingEmail ile denetlenmis). */
    send: async (email: OutgoingEmail, fallbackFrom: string): Promise<SendAnswer> => {
      if (server) return (await call("gonder", { ...email, to: email.to.join(", ") })) as SendAnswer;
      const id = addEmailMessage({
        type: email.type,
        direction: "out",
        from: emailSettingOf(getEmailSettings(db), email.type).sender ?? fallbackFrom,
        to: email.to,
        subject: email.subject,
        body: email.body,
        status: "skipped",
        error: tr.panel.emailNotSent,
        entityType: email.entity?.type,
        entityId: email.entity?.id,
        parentId: email.parentId,
        actorName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      });
      return id ? { ok: true, id, status: "skipped" } : { ok: false, error: tr.panel.failed };
    },
  };
}

/** Posta kutusunu hemen okur (veritabani modu). */
export function useMailboxRead() {
  const { pending, call } = usePanelCall("eposta");
  const [message, setMessage] = useState<string | null>(null);
  const read = async () => {
    setMessage(null);
    const answer = (await call("oku", {})) as { ok: true; imported: number } | { ok: false; error: string };
    setMessage(answer.ok ? `Posta kutusu okundu: ${answer.imported} yeni e-posta panele alındı.` : answer.error);
  };
  return { pending, read, message };
}

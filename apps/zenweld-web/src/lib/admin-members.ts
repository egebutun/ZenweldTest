"use client";

import type { User } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { deleteUser, saveUser } from "@zenweld/store";
import { recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › UYELER ISLEMLERI
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/uyeler; Asama 5,
 * 6. alan, KARARLAR K-99; ortak akis lib/admin-panel.ts). Demo modunda
 * tarayicidaki veriye yazilir (packages/store › repo/users.ts). Iki modda
 * ayni kurallar: kendi rolu ve durumu degismez, son aktif yonetici
 * korunur (K-35), yonetici silinmez.
 */
export function useMembersActions() {
  const { server, pending, call } = usePanelCall("uyeler");
  const member = (u: User) => recordRef("users", u);

  return {
    server,
    pending,
    save: (u: User, change: Pick<User, "role" | "status">): Promise<PanelAnswer> => {
      if (server) return call("uye", { ...member(u), ...change }, "users");
      return Promise.resolve(saveUser({ ...u, ...change }) ? { ok: true } : { ok: false, error: tr.panel.lastAdmin });
    },
    remove: (u: User): Promise<PanelAnswer> => {
      if (server) return call("uye-sil", member(u));
      return Promise.resolve(deleteUser(u.id) ? { ok: true } : { ok: false, error: tr.panel.adminNotDeletable });
    },
  };
}

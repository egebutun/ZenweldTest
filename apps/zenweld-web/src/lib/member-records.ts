"use client";

import { useEffect, useState } from "react";
import type { Quote, WarrantyRecord } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import { quotesForUser, useDatabase, warrantiesForEmail } from "@zenweld/store";
import { accountRequest } from "./account-api";

/**
 * UYENIN TEKLIFLERI VE GARANTILERI (Hesabim)
 *
 * Veritabani modunda sunucudan okunur (/api/formlar/teklifler ve
 * /api/formlar/garantiler; Asama 5.3). Garantiler uyenin e-postasiyla
 * eslesir. Demo modunda tarayicidaki veriden.
 */
export function useMemberRecords() {
  const { user, api } = useAuth();
  const db = useDatabase();
  const server = api !== null;
  const userId = user?.id ?? null;
  const [remote, setRemote] = useState<{ quotes: Quote[]; warranties: WarrantyRecord[] } | null>(null);

  useEffect(() => {
    if (!server || !userId) {
      setRemote(null);
      return;
    }
    let active = true;
    void Promise.all([
      accountRequest<{ quotes: Quote[] }>("/api/formlar", "teklifler"),
      accountRequest<{ warranties: WarrantyRecord[] }>("/api/formlar", "garantiler"),
    ]).then(([quotes, warranties]) => {
      if (!active) return;
      setRemote({ quotes: quotes.ok ? quotes.quotes : [], warranties: warranties.ok ? warranties.warranties : [] });
    });
    return () => {
      active = false;
    };
  }, [server, userId]);

  return {
    quotes: server ? (remote?.quotes ?? []) : user ? quotesForUser(user.id, db) : [],
    warranties: server ? (remote?.warranties ?? []) : user ? warrantiesForEmail(user.email, db) : [],
    ready: !server || !userId || remote !== null,
  };
}

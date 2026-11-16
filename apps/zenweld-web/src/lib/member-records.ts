"use client";

import { useEffect, useState } from "react";
import type { MemberServiceRequest, Quote, WarrantyRecord } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import { quotesForUser, serviceRequestsForUser, useDatabase, warrantiesForEmail } from "@zenweld/store";
import { accountRequest } from "./account-api";

/**
 * UYENIN TEKLIFLERI, GARANTILERI VE SERVIS TALEPLERI (Hesabim)
 *
 * Veritabani modunda sunucudan okunur (/api/formlar/teklifler,
 * /api/formlar/garantiler, /api/formlar/servis-talepleri; Asama 5.3).
 * Garantiler uyenin e-postasiyla, teklif ve servis talepleri uye
 * hesabiyla eslesir. Servis talebinde ic not ve atanan servis gelmez
 * (KARARLAR K-117). Demo modunda tarayicidaki veriden.
 */
export function useMemberRecords() {
  const { user, api } = useAuth();
  const db = useDatabase();
  const server = api !== null;
  const userId = user?.id ?? null;
  const [remote, setRemote] = useState<{ quotes: Quote[]; warranties: WarrantyRecord[]; serviceRequests: MemberServiceRequest[] } | null>(
    null,
  );

  useEffect(() => {
    if (!server || !userId) {
      setRemote(null);
      return;
    }
    let active = true;
    void Promise.all([
      accountRequest<{ quotes: Quote[] }>("/api/formlar", "teklifler"),
      accountRequest<{ warranties: WarrantyRecord[] }>("/api/formlar", "garantiler"),
      accountRequest<{ serviceRequests: MemberServiceRequest[] }>("/api/formlar", "servis-talepleri"),
    ]).then(([quotes, warranties, services]) => {
      if (!active) return;
      setRemote({
        quotes: quotes.ok ? quotes.quotes : [],
        warranties: warranties.ok ? warranties.warranties : [],
        serviceRequests: services.ok ? services.serviceRequests : [],
      });
    });
    return () => {
      active = false;
    };
  }, [server, userId]);

  return {
    quotes: server ? (remote?.quotes ?? []) : user ? quotesForUser(user.id, db) : [],
    warranties: server ? (remote?.warranties ?? []) : user ? warrantiesForEmail(user.email, db) : [],
    serviceRequests: server ? (remote?.serviceRequests ?? []) : user ? serviceRequestsForUser(user.id, db) : [],
    ready: !server || !userId || remote !== null,
  };
}

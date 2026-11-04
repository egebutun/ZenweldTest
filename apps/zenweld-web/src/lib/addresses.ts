"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "@zenweld/data";
import { ACCOUNT_LIMITS, useAuth } from "@zenweld/auth";
import { tr } from "@zenweld/i18n";
import { addAddress, addressesForUser, deleteAddress, setDefaultAddress, updateAddress, useDatabase } from "@zenweld/store";
import { accountRequest } from "./account-api";

/**
 * UYENIN ADRESLERI (Hesabim › Adreslerim ve odeme; KARARLAR K-96)
 *
 * Veritabani modunda adresler sunucudadir (/api/uyelik/adres-*; Asama 5.1);
 * demo modunda tarayicidadir. Kurallar iki modda ayni: ilk adres
 * varsayilan, varsayilan silinince kalan ilk adres varsayilan, en fazla 20.
 */
export type AddressInput = Omit<Address, "id" | "userId" | "isDefault">;
export interface AddressResult {
  ok: boolean;
  error?: string;
}

const LIMIT_ERROR = tr.account.errors.addressLimit.replace("{max}", String(ACCOUNT_LIMITS.addresses));

export function useAddresses() {
  const { user, api } = useAuth();
  const db = useDatabase();
  const userId = user?.id ?? null;
  const [remote, setRemote] = useState<Address[] | null>(null);

  useEffect(() => {
    if (!api || !userId) {
      setRemote(null);
      return;
    }
    let active = true;
    void accountRequest<{ addresses: Address[] }>(api, "adresler").then((answer) => {
      if (active) setRemote(answer.ok ? answer.addresses : []);
    });
    return () => {
      active = false;
    };
  }, [api, userId]);

  const addresses = api ? (remote ?? []) : userId ? addressesForUser(userId, db) : [];

  const send = useCallback(
    async (action: string, body: object): Promise<AddressResult> => {
      const answer = await accountRequest<{ addresses: Address[] }>(api!, action, body);
      if (!answer.ok) return { ok: false, error: answer.error };
      setRemote(answer.addresses);
      return { ok: true };
    },
    [api],
  );

  /** Yeni adres (id yoksa) ya da duzenleme. */
  const save = useCallback(
    async (fields: AddressInput, id?: string): Promise<AddressResult> => {
      if (api) return send("adres-kaydet", { ...fields, id });
      if (!userId) return { ok: false, error: tr.auth.errors.sessionEnded };
      if (id) updateAddress(userId, id, fields);
      else if (addressesForUser(userId).length >= ACCOUNT_LIMITS.addresses) return { ok: false, error: LIMIT_ERROR };
      else addAddress({ ...fields, userId });
      return { ok: true };
    },
    [api, send, userId],
  );

  const remove = useCallback(
    async (id: string): Promise<AddressResult> => {
      if (api) return send("adres-sil", { id });
      if (userId) deleteAddress(userId, id);
      return { ok: true };
    },
    [api, send, userId],
  );

  const makeDefault = useCallback(
    async (id: string): Promise<AddressResult> => {
      if (api) return send("adres-varsayilan", { id });
      if (userId) setDefaultAddress(userId, id);
      return { ok: true };
    },
    [api, send, userId],
  );

  return { addresses, ready: !api || !userId || remote !== null, save, remove, makeDefault };
}

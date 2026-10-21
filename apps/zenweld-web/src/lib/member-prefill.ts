"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { User } from "@zenweld/data";

/**
 * Uye girisliyse formun iletisim alanlarini doldurur (Teklif Al, Bayilik,
 * Servis Talebi, Garanti Kaydi). Sayfa yenilenince giris bilgisi ilk
 * cizimden sonra hazir olur; bu yuzden uye gelince yalnizca hala bos olan
 * alanlar doldurulur, ziyaretcinin yazdiklarina dokunulmaz.
 *
 * Yalnizca giris yapan kisi degisince calisir: veritabanina her yazista uye
 * nesnesi yenilenir; ona baglansaydi ziyaretcinin bilerek sildigi alan geri
 * dolardi.
 */
export function useMemberPrefill<F>(
  user: User | null,
  values: (user: User) => Partial<F>,
  setForm: Dispatch<SetStateAction<F>>,
): void {
  const userId = user?.id;
  useEffect(() => {
    if (!user) return;
    const fill = values(user) as Record<string, unknown>;
    setForm((form) => {
      const next = { ...form } as Record<string, unknown>;
      for (const [key, value] of Object.entries(fill)) {
        if (value && !next[key]) next[key] = value;
      }
      return next as F;
    });
    // user ve values her cizimde yeni; giris yapan kisi degisince calismasi yeterli.
  }, [userId, setForm]);
}

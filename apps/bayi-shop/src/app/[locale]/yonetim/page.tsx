"use client";

import { Star } from "lucide-react";
import { RequireAuth } from "@zenweld/auth";
import { LocaleLink } from "@/components/LocaleLink";
import { STORE } from "@/lib/store-config";

/**
 * BAYI YONETIM PANELI
 *
 * Bayinin kendi magazasini yonettigi alan. Su an yalnizca yorum
 * moderasyonu var; ilerideki bolumler (stok, siparis) buraya eklenir.
 * Yalnizca "dealer" ve "admin" rolleri girebilir.
 */
export default function ShopAdminHome() {
  return (
    <RequireAuth
      roles={["dealer", "admin"]}
      fallback={
        <div className="zw-container py-16 text-center">
          <p className="text-zw-grey-600">Bu alana yalnızca bayi yöneticileri erişebilir.</p>
        </div>
      }
    >
      <div className="zw-container py-12">
        <h1 className="font-display text-3xl font-bold uppercase">Yönetim Paneli</h1>
        <p className="mt-2 text-zw-grey-600">{STORE.name}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LocaleLink
            href="/yonetim/yorumlar"
            className="rounded-[6px] border border-zw-grey-200 bg-white p-6 transition-colors hover:border-zw-red-600"
          >
            <Star size={22} className="text-zw-red-600" />
            <h2 className="mt-3 font-display text-lg font-bold uppercase">Yorumlar</h2>
            <p className="mt-1 text-sm text-zw-grey-600">
              Müşteri değerlendirmelerini onaylayın, anasayfada göstereceklerinizi seçin.
            </p>
          </LocaleLink>
        </div>
      </div>
    </RequireAuth>
  );
}

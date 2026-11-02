"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Coupon, CouponStatus } from "@zenweld/data";
import { couponStatusOf, couponUsage, deleteCoupon, listCoupons, saveCoupon, useDatabase, useNow } from "@zenweld/store";
import { Badge, Button, Input, Select } from "@zenweld/ui";
import { formatDate, formatPrice } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";

/**
 * KUPONLAR (Satis > Kuponlar; KARARLAR K-85)
 *
 * Kullanilmis kupon silinmez, pasife alinir; kullanimlari siparislerle
 * birlikte saklanir.
 */

const STATUS: Record<CouponStatus, { label: string; tone: "green" | "amber" | "outline" | "grey" }> = {
  active: { label: "Geçerli", tone: "green" },
  scheduled: { label: "Planlandı", tone: "amber" },
  expired: { label: "Süresi doldu", tone: "outline" },
  exhausted: { label: "Sınır doldu", tone: "outline" },
  inactive: { label: "Pasif", tone: "grey" },
};

export default function AdminCouponsPage() {
  const db = useDatabase();
  const now = useNow();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return listCoupons(db)
      .map((c) => ({ coupon: c, status: couponStatusOf(c, db, now), used: couponUsage(c.id, db) }))
      .filter(
        (r) =>
          (!status || r.status === status) &&
          (!q || r.coupon.code.toLocaleLowerCase("tr").includes(q) || (r.coupon.name ?? "").toLocaleLowerCase("tr").includes(q)),
      );
  }, [db, now, query, status]);

  return (
    <>
      <AdminPageHeader
        title="Kuponlar"
        description={`${rows.length} kupon listeleniyor`}
        action={
          <Link href="/yonetim/kuponlar/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Kupon</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kupon kodu veya ad ara…"
            className="pl-9"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-56">
          <option value="">Tüm durumlar</option>
          {Object.entries(STATUS).map(([value, s]) => (
            <option key={value} value={value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Kupon</th>
              <th className="px-4 py-3">İndirim</th>
              <th className="px-4 py-3">Geçerlilik</th>
              <th className="px-4 py-3">Kullanım</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {rows.map(({ coupon: c, status: s, used }) => (
              <tr key={c.id} className={c.active ? "" : "opacity-60"}>
                <td className="px-4 py-2.5">
                  <Link href={`/yonetim/kuponlar/${c.id}`} className="font-mono font-semibold hover:text-zw-red-600">
                    {c.code}
                  </Link>
                  {c.name && <div className="text-xs text-zw-grey-500">{c.name}</div>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{discountText(c)}</div>
                  <div className="text-xs text-zw-grey-500">{scopeText(c)}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">{periodText(c)}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {used}
                  {c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : ""}
                  {c.perUserLimit && <div className="text-xs text-zw-grey-500">kişi başı {c.perUserLimit}</div>}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS[s].tone}>{STATUS[s].label}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title={c.active ? "Pasife al" : "Aktif yap"}
                      onClick={() => saveCoupon({ ...c, active: !c.active })}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                    >
                      {c.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <Link
                      href={`/yonetim/kuponlar/${c.id}`}
                      title="Düzenle"
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteButton coupon={c} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zw-grey-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Kullanilmis kupon silinmez (kullanimlar siparislerle saklanir); pasife alinir. */
function DeleteButton({ coupon }: { coupon: Coupon }) {
  const db = useDatabase();
  const used = db.couponRedemptions.some((r) => r.couponId === coupon.id);
  if (used) {
    return (
      <span
        title="Siparişlerde kullanılan kupon silinemez; pasife alabilirsiniz."
        className="cursor-not-allowed rounded-[3px] p-1.5 text-zw-grey-300"
      >
        <Trash2 size={16} />
      </span>
    );
  }
  return (
    <button
      title="Sil"
      onClick={() => {
        if (confirm(`"${coupon.code}" kuponu silinsin mi? Bu işlem geri alınamaz.`)) deleteCoupon(coupon.id);
      }}
      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-red-50 hover:text-zw-red-600"
    >
      <Trash2 size={16} />
    </button>
  );
}

const discountText = (c: Coupon) =>
  c.discountType === "percent" ? `%${c.discountValue}` : formatPrice(c.discountValue);

function scopeText(c: Coupon): string {
  const parts = [
    c.scope === "all" ? "Bütün ürünler" : "",
    c.categoryIds.length ? `${c.categoryIds.length} kategori` : "",
    c.productIds.length ? `${c.productIds.length} ürün` : "",
    c.minCartTotal ? `en az ${formatPrice(c.minCartTotal)}` : "",
    c.audience === "customers" ? `kişiye özel (${c.customerEmails.length} e-posta)` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

function periodText(c: Coupon): string {
  if (!c.startsAt && !c.endsAt) return "Süresiz";
  if (!c.endsAt) return `${formatDate(c.startsAt!)} →`;
  return `${c.startsAt ? formatDate(c.startsAt) : ""} → ${formatDate(c.endsAt)}`;
}

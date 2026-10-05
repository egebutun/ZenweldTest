"use client";

import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import type { WarrantyRecord } from "@zenweld/data";
import {
  deleteWarranty,
  downloadCsv,
  saveWarranty,
  siteMembers,
  useDatabase,
  warrantyExpiry,
} from "@zenweld/store";
import { Badge, Button, Input, Select } from "@zenweld/ui";
import { formatDate } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";

/**
 * GARANTI KAYITLARI
 *
 * Ana sitede (Kesfet > Garanti > Garanti Kaydi) yapilan kayitlar. Burada
 * yapilan degisiklikler musterinin "Hesabim > Garantilerim" sayfasina ve
 * sitedeki garanti sorgulamaya aninda yansir; ayni veriyi kullanirlar.
 */
export default function AdminWarrantiesPage() {
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const memberEmails = useMemo(
    () => new Set(siteMembers(db).map((u) => u.email.toLowerCase())),
    [db],
  );

  const records = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return [...db.warranties]
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .filter((w) => {
        const expired = w.expiresAt < today;
        if (state === "valid" && expired) return false;
        if (state === "expired" && !expired) return false;
        if (state === "extended" && !w.extended) return false;
        if (!q) return true;
        return (
          w.serialNumber.toLocaleLowerCase("tr").includes(q) ||
          w.ownerName.toLocaleLowerCase("tr").includes(q) ||
          w.email.toLocaleLowerCase("tr").includes(q)
        );
      });
  }, [db, query, state, today]);

  const productName = (id: string) => db.products.find((p) => p.id === id)?.name ?? id;

  /** Uzatilmis garanti acilip kapaninca bitis tarihi yeniden hesaplanir (+/- 12 ay). */
  const toggleExtended = (w: WarrantyRecord) => {
    const extended = !w.extended;
    saveWarranty({
      ...w,
      extended,
      expiresAt: warrantyExpiry(w.purchaseDate, w.productId, extended, db),
    });
  };

  return (
    <>
      <AdminPageHeader
        title="Garantiler"
        description={`${db.warranties.length} garanti kaydı · ${
          db.warranties.filter((w) => w.expiresAt >= today).length
        } geçerli`}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                records.map((w) => ({
                  seri_no: w.serialNumber,
                  urun: productName(w.productId),
                  sahibi: w.ownerName,
                  eposta: w.email,
                  telefon: w.phone,
                  satin_alinan_yer: w.dealerName,
                  satin_alma: w.purchaseDate,
                  bitis: w.expiresAt,
                  uzatilmis: w.extended ? "evet" : "hayır",
                  kayit: w.registeredAt,
                })),
                "garanti-kayitlari.csv",
              )
            }
          >
            CSV indir
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            className="pl-9"
            placeholder="Seri no, isim veya e-posta ara…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Tüm kayıtlar</option>
            <option value="valid">Garantisi devam eden</option>
            <option value="expired">Süresi dolan</option>
            <option value="extended">Uzatılmış garanti</option>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün / Seri No</th>
              <th className="px-4 py-3">Sahibi</th>
              <th className="px-4 py-3">Satın Alınan Yer</th>
              <th className="px-4 py-3">Satın Alma</th>
              <th className="px-4 py-3">Garanti Bitişi</th>
              <th className="px-4 py-3">Uzatılmış</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {records.map((w) => {
              const expired = w.expiresAt < today;
              return (
                <tr key={w.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{productName(w.productId)}</div>
                    <div className="font-mono text-xs text-zw-grey-500">{w.serialNumber}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{w.ownerName}</div>
                    <div className="text-xs text-zw-grey-500">{w.email}</div>
                    <div className="text-xs text-zw-grey-400">{w.phone}</div>
                    <div className="mt-1">
                      {memberEmails.has(w.email.toLowerCase()) ? (
                        <Badge tone="grey">Üye</Badge>
                      ) : (
                        <Badge tone="outline">Üye değil</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{w.dealerName}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {formatDate(w.purchaseDate, "tr")}
                    <div className="text-zw-grey-400">
                      Kayıt: {formatDate(w.registeredAt, "tr")}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="date"
                      value={w.expiresAt}
                      onChange={(e) =>
                        e.target.value && saveWarranty({ ...w, expiresAt: e.target.value })
                      }
                      className="rounded-[3px] border border-zw-grey-300 px-2 py-1 text-sm"
                      aria-label="Garanti bitiş tarihi"
                    />
                    <div className="mt-1">
                      <Badge tone={expired ? "outline" : "green"}>
                        {expired ? "Süresi doldu" : "Geçerli"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-zw-red-600"
                        checked={w.extended}
                        onChange={() => toggleExtended(w)}
                      />
                      +12 ay
                    </label>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`${w.serialNumber} seri numaralı kayıt silinsin mi?`)) {
                          deleteWarranty(w.id);
                        }
                      }}
                      className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-red-600"
                      aria-label="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zw-grey-500">
                  {db.warranties.length === 0
                    ? "Henüz garanti kaydı yok."
                    : "Aramanıza uygun kayıt yok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zw-grey-500">
        Bitiş tarihi ve uzatılmış garanti değişiklikleri müşterinin “Hesabım → Garantilerim”
        sayfasına ve sitedeki garanti sorgulamaya anında yansır. “+12 ay” işaretlenince bitiş
        tarihi ürünün garanti süresine göre yeniden hesaplanır.
      </p>
    </>
  );
}

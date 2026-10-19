"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import type { StockSourceType } from "@zenweld/data";
import { getStockSettings, listStockSources, saveStockSettings, sourceStatus, useDatabase, useNow } from "@zenweld/store";
import { Badge, Button, Input } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { FreshnessBadge, SOURCE_TYPE_LABEL, ageText, sourceParam } from "./shared";

/** Stok Matrisi > Bayi ve Satıcılar: her kaynagin durumu. */
export function StockSources() {
  const db = useDatabase();
  const now = useNow().getTime();
  const [type, setType] = useState<"" | StockSourceType>("");
  const [query, setQuery] = useState("");
  const { staleDays } = getStockSettings(db);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return listStockSources(db)
      .filter((s) => !type || s.type === type)
      .filter((s) => !q || s.name.toLocaleLowerCase("tr").includes(q) || (s.city ?? "").toLocaleLowerCase("tr").includes(q))
      .map((s) => ({ source: s, status: sourceStatus(s.type, s.id, db, now) }))
      // Guncellenmemis olanlar ustte: yonetici once onlari gorsun.
      .sort((a, b) => Number(a.status.fresh) - Number(b.status.fresh) || a.source.name.localeCompare(b.source.name, "tr"));
  }, [db, type, query, now]);

  const staleCount = rows.filter((r) => !r.status.fresh).length;

  return (
    <>
      <StaleDaysSetting value={staleDays} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-[4px] border border-zw-grey-300 bg-white p-0.5">
          {([["", "Tümü"], ["dealer", "Bayiler"], ["retailer", "Online satıcılar"]] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-[3px] px-3 py-1.5 text-sm font-semibold ${type === value ? "bg-zw-ink text-white" : "text-zw-grey-600 hover:bg-zw-grey-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bayi/satıcı veya şehir ara…" className="pl-9" />
        </div>
        {staleCount > 0 && (
          <span className="text-sm font-semibold text-amber-700 sm:ml-auto">
            {staleCount} kaynağın stoğu {staleDays} günden eski
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Bayi / Satıcı</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3 text-right">Stoktaki ürün</th>
              <th className="px-4 py-3">Son güncelleme</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {rows.map(({ source, status }) => (
              <tr key={`${source.type}:${source.id}`} className={status.fresh ? "hover:bg-zw-grey-50" : "bg-amber-50/50 hover:bg-amber-50"}>
                <td className="px-4 py-3">
                  <Link href={`/yonetim/stok?kaynak=${sourceParam(source.type, source.id)}`} className="font-semibold hover:text-zw-red-600">
                    {source.name}
                  </Link>
                  {source.city && <div className="text-xs text-zw-grey-500">{source.city}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={source.type === "dealer" ? "grey" : "outline"}>{SOURCE_TYPE_LABEL[source.type]}</Badge>
                  {source.onlineStore && (
                    <Badge tone="outline" className="ml-1">
                      Online mağaza
                    </Badge>
                  )}
                  {source.isOwnStore && (
                    <Badge tone="red" className="ml-1">
                      Kendi mağazamız
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {status.inStock}
                  <span className="font-normal text-zw-grey-400"> / {status.rows}</span>
                </td>
                <td className="px-4 py-3 text-xs text-zw-grey-600">
                  {status.lastUpdate ? (
                    <>
                      <div>{formatDateTime(status.lastUpdate)}</div>
                      <div className="text-zw-grey-400">{ageText(status.lastUpdate, now)}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <FreshnessBadge status={status} staleDays={staleDays} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/yonetim/stok?kaynak=${sourceParam(source.type, source.id)}`}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-zw-red-600 hover:underline"
                  >
                    Stok listesi <ChevronRight size={15} />
                  </Link>
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

/** Sitede gosterilecek stogun en fazla kac gunluk olabilecegi. */
function StaleDaysSetting({ value }: { value: number }) {
  const [draft, setDraft] = useState(String(value));
  const [saved, setSaved] = useState(false);
  const parsed = Number(draft);
  const valid = Number.isInteger(parsed) && parsed >= 0 && parsed <= 365;

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-[4px] border border-zw-grey-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex-1 text-sm text-zw-grey-700">
        <strong className="text-zw-ink">Stok geçerlilik süresi.</strong> Son{" "}
        <strong>{value || "∞"}</strong> gün içinde güncellenen stoklar sitede gösterilir. Bir bayi ya da satıcı bu süre
        içinde yeni dosya göndermezse ürünleri sitede “stokta” görünmez ve burada uyarı çıkar. 0 yazılırsa süre
        sınırı olmaz.
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={365}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
          className="w-20"
          aria-label="Gün"
        />
        <span className="text-sm text-zw-grey-600">gün</span>
        <Button
          size="sm"
          disabled={!valid || parsed === value}
          onClick={() => {
            saveStockSettings({ staleDays: parsed });
            setSaved(true);
          }}
        >
          Kaydet
        </Button>
        {saved && <span className="text-xs font-semibold text-emerald-700">Kaydedildi</span>}
      </div>
    </div>
  );
}

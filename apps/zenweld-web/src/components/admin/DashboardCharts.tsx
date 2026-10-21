"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useDatabase, useNow } from "@zenweld/store";
import { formatPrice } from "@zenweld/utils";
import { RANGES, dashboardStats, makeRange, type RangeKey } from "@/lib/admin-stats";
import {
  BarList,
  ChartCard,
  Legend,
  ShareBar,
  StatTile,
  TimeChart,
  TimeTable,
  VIZ,
  formatMoneyCompact,
  formatPercent,
} from "./charts";

const RANGE_KEY = "zenweld.admin.range";

/**
 * PANEL ANA SAYFASI — SATIS VE MUSTERI GRAFIKLERI
 *
 * Ustteki tarih secimi asagidaki her seyi ayni donemle sinirlar.
 * Secim bu tarayicida hatirlanir.
 */
export function DashboardCharts() {
  const db = useDatabase();
  const now = useNow();
  const [rangeKey, setRangeKey] = useState<RangeKey>("30");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(RANGE_KEY) as RangeKey | null;
      if (saved && RANGES.some((r) => r.key === saved)) setRangeKey(saved);
    } catch {
      /* depolama kapali: varsayilan 30 gun */
    }
  }, []);

  const choose = (key: RangeKey) => {
    setRangeKey(key);
    try {
      window.localStorage.setItem(RANGE_KEY, key);
    } catch {
      /* yok sayilir */
    }
  };

  const range = useMemo(() => makeRange(rangeKey, now), [rangeKey, now]);
  const s = useMemo(() => dashboardStats(db, range), [db, range]);
  const { bins } = range;

  return (
    <div className="space-y-6">
      {/* Tarih secimi: asagidaki tum grafikleri kapsar */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Tarih aralığı" className="grid w-full grid-cols-4 rounded-[4px] border border-zw-grey-300 bg-white p-0.5 sm:inline-flex sm:w-auto">
          {RANGES.map((r) => (
            <button
              key={r.key}
              role="radio"
              aria-checked={rangeKey === r.key}
              onClick={() => choose(r.key)}
              className={`whitespace-nowrap rounded-[3px] px-2 py-1.5 text-sm font-semibold transition-colors sm:px-3 ${
                rangeKey === r.key ? "bg-zw-ink text-white" : "text-zw-grey-600 hover:bg-zw-grey-100 hover:text-zw-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-zw-grey-500">
          Değişimler, bir önceki eşit uzunluktaki dönemin aynı saatine kadarki kısmıyla karşılaştırılır.
        </span>
      </div>

      {/* 1. Ozet */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Ciro"
          value={formatPrice(s.kpis.revenue.value)}
          current={s.kpis.revenue.value}
          previous={s.kpis.revenue.prev}
          hint="İptaller hariç, KDV ve vade farkı dahil"
        />
        <StatTile
          label="Sipariş"
          value={String(s.kpis.orders.value)}
          current={s.kpis.orders.value}
          previous={s.kpis.orders.prev}
          hint="İptal edilenler hariç"
        />
        <StatTile
          label="Ortalama sepet"
          value={formatPrice(Math.round(s.kpis.basket.value))}
          current={s.kpis.basket.value}
          previous={s.kpis.basket.prev}
        />
        <StatTile
          label="Yeni üye"
          value={String(s.kpis.members.value)}
          current={s.kpis.members.value}
          previous={s.kpis.members.prev}
        />
      </div>

      {/* 2. Ciro */}
      <ChartCard title="Ciro" subtitle={`${range.binName} ciro (KDV dahil, iptaller hariç)`}>
        <TimeChart
          kind="columns"
          bins={bins}
          series={[{ key: "revenue", label: "ciro", color: VIZ.s1, values: s.revenueBins.map((b) => b.revenue) }]}
          format={formatPrice}
          axisFormat={formatMoneyCompact}
          extraTip={(i) => [{ value: String(s.revenueBins[i].orders), label: "sipariş" }]}
          labelPeak
        />
        <TimeTable
          bins={bins}
          columns={[
            { label: "Ciro", values: s.revenueBins.map((b) => formatPrice(b.revenue)) },
            { label: "Sipariş", values: s.revenueBins.map((b) => String(b.orders)) },
          ]}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 3. Siparis durumlari */}
        <ChartCard
          title="Sipariş durumları"
          subtitle="Bu dönemde verilen siparişlerin şu anki durumu"
          action={
            s.openNow > 0 ? (
              <Link
                href="/yonetim/siparisler"
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                <AlertCircle size={14} />
                Şu an {s.openNow} sipariş işlem bekliyor
              </Link>
            ) : undefined
          }
        >
          <BarList
            rows={s.statuses.map((st) => ({
              key: st.status,
              label: st.label,
              value: st.count,
              display: String(st.count),
              emphasis: st.actionable,
              badge: st.actionable && st.count > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  <AlertCircle size={11} />
                  İşlem bekliyor
                </span>
              ) : undefined,
            }))}
          />
        </ChartCard>

        {/* 6. Odeme yontemi */}
        <ChartCard title="Ödeme yöntemi" subtitle="Siparişlerin ödeme şekline göre dağılımı">
          <ShareBar
            parts={s.payment.parts.map((p, i) => ({
              key: p.key,
              label: p.label,
              value: p.count,
              color: [VIZ.s1, VIZ.s2, VIZ.s3][i],
              detail: `${p.count} sipariş · ${formatPrice(p.revenue)}`,
            }))}
          />
          {s.payment.installmentCounts.length > 0 && (
            <div className="mt-5 border-t border-zw-grey-100 pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                Taksitli ödemeler
              </div>
              <div className="flex flex-wrap gap-2">
                {s.payment.installmentCounts.map((x) => (
                  <span key={x.n} className="rounded-[4px] border border-zw-grey-200 px-2.5 py-1 text-xs text-zw-grey-600">
                    {x.n} taksit: <strong className="text-zw-ink">{x.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 4a. En cok satanlar */}
        <ChartCard title="En çok satan ürünler" subtitle="Ciroya göre ilk 5">
          <BarList
            rows={s.topProducts.map((p) => ({
              key: p.id,
              label: p.name,
              value: p.revenue,
              display: formatPrice(p.revenue),
              detail: `${p.qty} adet satıldı`,
            }))}
          />
        </ChartCard>

        {/* 4b. Gruba gore ciro */}
        <ChartCard title="Ürün grubuna göre ciro" subtitle="Kaynak Makineleri, Aksesuarlar …">
          <BarList
            rows={s.groupRevenue.map((g) => ({
              key: g.name,
              label: g.name,
              value: g.value,
              display: formatPrice(g.value),
              detail: `Ürün satışlarındaki payı: ${formatPercent(g.value / s.groupRevenue.reduce((a, x) => a + x.value, 0))}`,
            }))}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 5. Teklif hunisi */}
        <ChartCard
          title="Teklif hunisi"
          subtitle={
            s.funnel.winRate === null
              ? "Bu dönemde sonuçlanan teklif yok"
              : `Sonuçlanan tekliflerde kazanma oranı ${formatPercent(s.funnel.winRate)} (${s.funnel.won} kazanılan, ${s.funnel.lost} kaybedilen)`
          }
        >
          <BarList
            rows={s.funnel.stages.map((st) => ({
              key: st.label,
              label: st.label,
              value: st.count,
              display: s.funnel.stages[0].count
                ? `${st.count} · ${formatPercent(st.count / s.funnel.stages[0].count)}`
                : String(st.count),
            }))}
          />
        </ChartCard>

        {/* 7. Yeni uyeler */}
        <ChartCard title="Yeni üyeler" subtitle={`${range.binName} yeni üye kaydı`}>
          <Legend
            items={[
              { label: "Bireysel", color: VIZ.s1, value: String(s.memberBins.reduce((a, b) => a + b.individual, 0)) },
              { label: "Kurumsal", color: VIZ.s2, value: String(s.memberBins.reduce((a, b) => a + b.business, 0)) },
            ]}
          />
          <TimeChart
            kind="columns"
            bins={bins}
            height={190}
            integer
            series={[
              { key: "individual", label: "bireysel", color: VIZ.s1, values: s.memberBins.map((b) => b.individual) },
              { key: "business", label: "kurumsal", color: VIZ.s2, values: s.memberBins.map((b) => b.business) },
            ]}
            format={String}
          />
          <TimeTable
            bins={bins}
            columns={[
              { label: "Bireysel", values: s.memberBins.map((b) => String(b.individual)) },
              { label: "Kurumsal", values: s.memberBins.map((b) => String(b.business)) },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 8. Sehirler */}
        <ChartCard title="Şehirlere göre sipariş" subtitle="Teslimat adresine göre ilk 10 şehir">
          <BarList
            rows={s.cities.map((c) => ({
              key: c.name,
              label: c.name,
              value: c.orders,
              display: `${c.orders} sipariş`,
              detail: `Ciro: ${formatPrice(c.revenue)}`,
            }))}
          />
        </ChartCard>

        {/* 9. Servis ve garanti */}
        <ChartCard title="Servis ve garanti" subtitle={`${range.binName} servis talebi ve garanti kaydı`}>
          <Legend
            items={[
              { label: "Servis talebi", color: VIZ.s1, value: String(s.care.service), mark: "line" },
              { label: "Garanti kaydı", color: VIZ.s2, value: String(s.care.warranty), mark: "line" },
            ]}
          />
          <TimeChart
            kind="lines"
            bins={bins}
            height={190}
            integer
            series={[
              { key: "service", label: "servis talebi", color: VIZ.s1, values: s.care.bins.map((b) => b.service) },
              { key: "warranty", label: "garanti kaydı", color: VIZ.s2, values: s.care.bins.map((b) => b.warranty) },
            ]}
            format={String}
          />
          <TimeTable
            bins={bins}
            columns={[
              { label: "Servis talebi", values: s.care.bins.map((b) => String(b.service)) },
              { label: "Garanti kaydı", values: s.care.bins.map((b) => String(b.warranty)) },
            ]}
          />
          {s.care.serviceModels.length > 0 && (
            <div className="mt-5 border-t border-zw-grey-100 pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
                En çok servis talebi gelen modeller
              </div>
              <BarList
                rows={s.care.serviceModels.map((m) => ({
                  key: m.name,
                  label: m.name,
                  value: m.count,
                  display: `${m.count} talep`,
                }))}
              />
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

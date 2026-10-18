"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Bin } from "@/lib/admin-stats";

/**
 * PANEL GRAFIKLERI
 *
 * Kutuphane kullanmadan, duz SVG/HTML. Kurallar:
 * - Tek serili grafik tek renk (VIZ.s1); 2-3 seri sabit sirayla s1, s2, s3.
 *   Renkler renk korlugu testinden gecirildi; s3 (aqua) acik zeminde dusuk
 *   kontrastli oldugu icin kullanildigi yerde degerler yaziyla da gorunur.
 * - Ince cubuklar (en fazla 24px), uc kismi 4px yuvarlak, taban duz.
 * - Ustune gelince / klavyeyle odaklaninca ipucu kutusu acilir.
 * - Yazilar seri rengini almaz; renk yanindaki isarette durur.
 */

export const VIZ = {
  s1: "#2a78d6",
  s2: "#eb6834",
  s3: "#1baf7a",
  /** Vurgulanmayan cubuklar */
  muted: "#c9cdd2",
  grid: "#e2e5e8",
  tick: "#6b7178",
  surface: "#ffffff",
  hover: "#f1f2f4",
};

const compact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
export const formatCompact = (n: number) => compact.format(n);
export const formatMoneyCompact = (n: number) => `₺${compact.format(n)}`;
const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });
export const formatPercent = (n: number) => percent.format(n);

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 0'dan baslayan, yuvarlak degerli eksen cizgileri. Adet verisinde adim en az 1. */
function niceTicks(max: number, integer: boolean, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = integer ? Math.max(1, max / count) : max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = (integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]).map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Ustu 4px yuvarlak, tabani duz cubuk */
function columnPath(x: number, y: number, w: number, h: number, round: boolean) {
  if (h <= 0) return "";
  const r = round ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/* ------------------------------------------------------------------ */
/* Ipucu                                                               */
/* ------------------------------------------------------------------ */

export interface TipRow {
  value: string;
  label: string;
  color?: string;
  /** Renk isareti: cizgi (cizgi grafik) veya kare (cubuk) */
  mark?: "line" | "box";
}

function Tooltip({ title, rows, x, y, containerWidth }: { title: string; rows: TipRow[]; x: number; y: number; containerWidth: number }) {
  // Sag kenara yakinsa kutu imlecin soluna acilir.
  const flip = x > containerWidth - 200;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-36 rounded-[4px] border border-zw-grey-200 bg-white px-3 py-2 text-xs shadow-lg"
      style={{ left: x, top: y, transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)` }}
    >
      <div className="mb-1 text-zw-grey-500">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 py-0.5">
          {r.color && (
            <span
              className={r.mark === "box" ? "h-2.5 w-2.5 rounded-[2px]" : "h-0.5 w-3 rounded-full"}
              style={{ background: r.color }}
            />
          )}
          <span className="font-semibold text-zw-ink">{r.value}</span>
          <span className="text-zw-grey-500">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kart, lejant, ozet kutusu                                           */
/* ------------------------------------------------------------------ */

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[4px] border border-zw-grey-200 bg-white p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold uppercase">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-zw-grey-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string; mark?: "line" | "box" }[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zw-grey-600">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span
            className={i.mark === "line" ? "h-0.5 w-3.5 rounded-full" : "h-2.5 w-2.5 rounded-[2px]"}
            style={{ background: i.color }}
          />
          {i.label}
          {i.value && <span className="font-semibold text-zw-ink">{i.value}</span>}
        </span>
      ))}
    </div>
  );
}

export function StatTile({
  label,
  value,
  current,
  previous,
  hint,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  hint?: string;
}) {
  // Onceki donemde hic kayit yoksa yuzde anlamsiz; gosterilmez.
  const delta = previous > 0 ? (current - previous) / previous : null;
  const up = delta !== null && delta > 0.005;
  const down = delta !== null && delta < -0.005;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
      <div className="text-sm text-zw-grey-600">{label}</div>
      <div className="mt-1.5 text-3xl font-semibold text-zw-ink">{value}</div>
      <div className="mt-1.5 flex items-center gap-1 text-xs">
        {delta === null ? (
          <span className="text-zw-grey-500">Önceki dönemde kayıt yok</span>
        ) : (
          <>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                up ? "text-zw-success" : down ? "text-zw-red-600" : "text-zw-grey-600"
              }`}
            >
              <Icon size={14} />
              {up ? "+" : ""}
              {formatPercent(delta)}
            </span>
            <span className="text-zw-grey-500">önceki döneme göre</span>
          </>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-zw-grey-500">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zaman grafigi: sutun (yigilmis olabilir) veya cizgi                 */
/* ------------------------------------------------------------------ */

export interface TimeSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export function TimeChart({
  kind,
  bins,
  series,
  format,
  axisFormat = formatCompact,
  extraTip,
  labelPeak = false,
  integer = false,
  height = 220,
}: {
  kind: "columns" | "lines";
  bins: Bin[];
  series: TimeSeries[];
  format: (n: number) => string;
  axisFormat?: (n: number) => string;
  /** Ipucuna eklenecek satirlar (orn. siparis sayisi) */
  extraTip?: (i: number) => TipRow[];
  /** En yuksek sutunun degerini ustune yaz */
  labelPeak?: boolean;
  /** Adet verisi: eksende kusurat yok */
  integer?: boolean;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const n = bins.length;
  const totals = bins.map((_, i) =>
    kind === "columns" ? series.reduce((s, x) => s + x.values[i], 0) : Math.max(...series.map((x) => x.values[i])),
  );
  const ticks = niceTicks(Math.max(...totals, 0), integer);
  const max = ticks[ticks.length - 1] || 1;

  // Sol bosluk en uzun eksen etiketine gore
  const left = Math.max(28, Math.max(...ticks.map((t) => axisFormat(t).length)) * 6.6 + 14);
  const right = 8;
  const top = 18;
  const bottom = 24;
  const plotW = Math.max(0, width - left - right);
  const plotH = height - top - bottom;
  const band = n ? plotW / n : 0;
  const barW = Math.max(2, Math.min(24, band * 0.62));
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const cx = (i: number) => left + band * i + band / 2;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 56))));
  const peak = totals.indexOf(Math.max(...totals));

  const tipRows = (i: number): TipRow[] => [
    ...series.map((s) => ({
      value: format(s.values[i]),
      label: s.label,
      color: s.color,
      mark: kind === "lines" ? ("line" as const) : ("box" as const),
    })),
    ...(extraTip ? extraTip(i) : []),
  ];

  return (
    <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Grafik">
          {/* Eksen cizgileri */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={VIZ.grid} strokeWidth={1} />
              <text
                x={left - 8}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill={VIZ.tick}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {axisFormat(t)}
              </text>
            </g>
          ))}

          {/* Ustune gelinen dilim */}
          {hover !== null &&
            (kind === "columns" ? (
              <rect x={left + band * hover} y={top} width={band} height={plotH} fill={VIZ.hover} />
            ) : (
              <line x1={cx(hover)} x2={cx(hover)} y1={top} y2={top + plotH} stroke={VIZ.muted} strokeWidth={1} />
            ))}

          {kind === "columns" &&
            bins.map((_, i) => {
              let acc = 0;
              const visible = series.filter((s) => s.values[i] > 0);
              return (
                <g key={i}>
                  {visible.map((s, k) => {
                    const v = s.values[i];
                    const y0 = y(acc);
                    acc += v;
                    const y1 = y(acc);
                    // Ust uste binen dilimler arasinda 2px bosluk
                    const gap = k > 0 ? 2 : 0;
                    return (
                      <path
                        key={s.key}
                        d={columnPath(cx(i) - barW / 2, y1, barW, Math.max(0, y0 - y1 - gap), k === visible.length - 1)}
                        fill={s.color}
                      />
                    );
                  })}
                </g>
              );
            })}

          {kind === "lines" &&
            series.map((s) => (
              <g key={s.key}>
                <polyline
                  points={s.values.map((v, i) => `${cx(i)},${y(v)}`).join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {[hover ?? n - 1].map((i) => (
                  <circle key={i} cx={cx(i)} cy={y(s.values[i])} r={4} fill={s.color} stroke={VIZ.surface} strokeWidth={2} />
                ))}
              </g>
            ))}

          {/* En yuksek degerin etiketi */}
          {labelPeak && totals[peak] > 0 && (
            <text x={cx(peak)} y={y(totals[peak]) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#3d4348">
              {axisFormat(totals[peak])}
            </text>
          )}

          {/* Zaman ekseni */}
          {bins.map((b, i) =>
            i % labelEvery === 0 ? (
              <text key={i} x={cx(i)} y={height - 6} textAnchor="middle" fontSize={11} fill={VIZ.tick}>
                {b.label}
              </text>
            ) : null,
          )}

          {/* Isaretleme alanlari: tum dilim, cubuktan genis */}
          {bins.map((b, i) => (
            <rect
              key={i}
              x={left + band * i}
              y={top}
              width={band}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              aria-label={`${b.longLabel}: ${tipRows(i).map((r) => `${r.label} ${r.value}`).join(", ")}`}
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            />
          ))}
        </svg>
      )}
      {hover !== null && (
        <Tooltip
          title={bins[hover].longLabel}
          rows={tipRows(hover)}
          x={cx(hover)}
          y={top + plotH / 2}
          containerWidth={width}
        />
      )}
    </div>
  );
}

/** Zaman grafiginin tablo hali (ipucuna bakmadan tum degerler). */
export function TimeTable({
  bins,
  columns,
}: {
  bins: Bin[];
  columns: { label: string; values: string[] }[];
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-zw-grey-600 hover:text-zw-ink">
        Tablo olarak göster
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-[4px] border border-zw-grey-200">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zw-grey-50 text-left text-zw-grey-600">
            <tr>
              <th className="px-3 py-2 font-semibold">Dönem</th>
              {columns.map((c) => (
                <th key={c.label} className="px-3 py-2 text-right font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100" style={{ fontVariantNumeric: "tabular-nums" }}>
            {bins.map((b, i) => (
              <tr key={i}>
                <td className="px-3 py-1.5">{b.longLabel}</td>
                {columns.map((c) => (
                  <td key={c.label} className="px-3 py-1.5 text-right">
                    {c.values[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Yatay cubuk listesi                                                 */
/* ------------------------------------------------------------------ */

export interface BarRow {
  key: string;
  label: string;
  value: number;
  /** Cubugun sagindaki yazi */
  display: string;
  /** Ipucundaki ek bilgi */
  detail?: string;
  /** false ise gri (vurgulanmaz) */
  emphasis?: boolean;
  /** Etiketin yanindaki rozet (orn. "İşlem bekliyor") */
  badge?: ReactNode;
}

export function BarList({ rows, empty = "Bu dönemde kayıt yok." }: { rows: BarRow[]; empty?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (rows.length === 0 || max === 0) return <p className="py-6 text-center text-sm text-zw-grey-500">{empty}</p>;

  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li
          key={r.key}
          tabIndex={r.detail ? 0 : undefined}
          onPointerEnter={() => setHover(r.key)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(r.key)}
          onBlur={() => setHover(null)}
          className="relative rounded-[4px] px-2 py-1.5 outline-none hover:bg-zw-grey-50 focus-visible:bg-zw-grey-50"
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-zw-grey-700">{r.label}</span>
              {r.badge}
            </span>
            <span className="shrink-0 font-semibold text-zw-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
              {r.display}
            </span>
          </div>
          <div className="mt-1 h-2.5">
            {r.value > 0 && (
              <div
                className="h-full rounded-r-[4px]"
                style={{
                  width: `${Math.max(1.5, (r.value / max) * 100)}%`,
                  background: r.emphasis === false ? VIZ.muted : VIZ.s1,
                }}
              />
            )}
          </div>
          {hover === r.key && r.detail && (
            <div
              role="tooltip"
              className="pointer-events-none absolute right-2 top-full z-10 mt-1 rounded-[4px] border border-zw-grey-200 bg-white px-3 py-1.5 text-xs text-zw-grey-600 shadow-lg"
            >
              {r.detail}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Oran cubugu (butunun parcalari)                                     */
/* ------------------------------------------------------------------ */

export function ShareBar({
  parts,
}: {
  parts: { key: string; label: string; value: number; color: string; detail: string }[];
}) {
  const [hover, setHover] = useState<string | null>(null);
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total === 0) return <p className="py-6 text-center text-sm text-zw-grey-500">Bu dönemde kayıt yok.</p>;
  const visible = parts.filter((p) => p.value > 0);

  return (
    <div>
      <div className="relative flex h-5 gap-[2px]">
        {visible.map((p, i) => (
          <div
            key={p.key}
            tabIndex={0}
            aria-label={`${p.label}: ${p.detail}`}
            onPointerEnter={() => setHover(p.key)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(p.key)}
            onBlur={() => setHover(null)}
            className={`h-full outline-none transition-opacity ${i === 0 ? "rounded-l-[4px]" : ""} ${
              i === visible.length - 1 ? "rounded-r-[4px]" : ""
            } ${hover && hover !== p.key ? "opacity-60" : ""}`}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {parts.map((p) => (
          <li
            key={p.key}
            className={`flex flex-wrap items-center gap-x-2 rounded-[4px] px-1 ${hover === p.key ? "bg-zw-grey-50" : ""}`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: p.color }} />
            <span className="text-zw-grey-700">{p.label}</span>
            <span className="ml-auto font-semibold text-zw-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatPercent(p.value / total)}
            </span>
            {/* Dar ekranda yuzdenin altina iner */}
            <span className="w-full pl-[18px] text-xs text-zw-grey-500 sm:w-44 sm:pl-0 sm:text-right">{p.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

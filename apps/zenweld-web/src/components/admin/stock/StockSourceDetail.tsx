"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Plus, Search, Trash2, Undo2, Upload } from "lucide-react";
import { stockTemplateRows, type StockImport, type StockLevel } from "@zenweld/data";
import {
  deleteStockLevel,
  downloadCsvRows,
  getStockSettings,
  revertableImport,
  revertStockImport,
  setStockLevel,
  sourceStatus,
  stockHistory,
  stockOfSource,
  useDatabase,
  useNow,
  type StockSource,
} from "@zenweld/store";
import { Alert, Badge, Button, Input, Select } from "@zenweld/ui";
import { formatDateTime, formatPrice, slugify } from "@zenweld/utils";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { readStockFile, StockFileError } from "@/lib/stock-file";
import { StockUpload } from "./StockUpload";
import { FreshnessBadge, SOURCE_TYPE_LABEL, ageText, productChoices, productLabel, splitChoice, useAdminName } from "./shared";

/** Stok Matrisi > bir bayinin/saticinin stok listesi, dosya yukleme ve gecmis. */
export function StockSourceDetail({ source }: { source: StockSource }) {
  const db = useDatabase();
  const now = useNow().getTime();
  const by = useAdminName();
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ table: unknown[][]; fileName: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const isRetailer = source.type === "retailer";
  const { staleDays } = getStockSettings(db);
  const status = sourceStatus(source.type, source.id, db, now);
  const history = stockHistory(source.type, source.id, db);
  const revertable = revertableImport(source.type, source.id, db);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return stockOfSource(source.type, source.id, db)
      .map((level) => ({ level, label: productLabel(db, level.productId, level.variantId) }))
      .filter(({ level }) => !onlyInStock || level.quantity > 0)
      .filter(({ level, label }) => !q || label.toLocaleLowerCase("tr").includes(q) || level.sku.toLocaleLowerCase("tr").includes(q))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [db, source, query, onlyInStock]);

  const onFile = async (file: File) => {
    setMessage(null);
    try {
      setUpload({ table: await readStockFile(file), fileName: file.name });
    } catch (err) {
      setMessage({ tone: "danger", text: err instanceof StockFileError ? err.message : "Dosya okunamadı." });
    }
  };

  const onApplied = (record: StockImport) => {
    setUpload(null);
    const s = record.summary;
    setMessage({
      tone: "success",
      text: `Stok güncellendi: ${s.matched} ürün işlendi · ${s.added} stoğa girdi · ${s.changed} değişti · ${s.zeroed} stoktan çıktı${
        s.unmatched + s.invalid ? ` · ${s.unmatched + s.invalid} satır uygulanmadı` : ""
      }.`,
    });
  };

  const downloadTemplate = () => {
    const products = db.products.filter((p) => p.active).sort((a, b) => a.name.localeCompare(b.name, "tr"));
    downloadCsvRows(stockTemplateRows(products, stockOfSource(source.type, source.id, db), source.type), `${slugify(source.name)}-stok-sablonu.csv`);
  };

  return (
    <>
      <Link href="/yonetim/stok" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-ink">
        <ArrowLeft size={15} /> Tüm bayi ve satıcılar
      </Link>
      <AdminPageHeader
        title={source.name}
        description={`${SOURCE_TYPE_LABEL[source.type]}${source.city ? ` · ${source.city}` : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={<Download size={16} />} onClick={downloadTemplate}>
              Şablon İndir
            </Button>
            <Button leftIcon={<Upload size={16} />} onClick={() => fileInput.current?.click()}>
              Dosya Yükle (CSV / XLSX)
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
                e.target.value = "";
              }}
            />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[4px] border border-zw-grey-200 bg-white px-4 py-3 text-sm">
        <span>
          <span className="text-zw-grey-500">Stoktaki ürün:</span> <strong>{status.inStock}</strong>
          <span className="text-zw-grey-400"> / {status.rows} satır</span>
        </span>
        <span>
          <span className="text-zw-grey-500">Son güncelleme:</span>{" "}
          <strong>{status.lastUpdate ? formatDateTime(status.lastUpdate) : "—"}</strong>{" "}
          <span className="text-zw-grey-400">({ageText(status.lastUpdate, now)})</span>
        </span>
        <FreshnessBadge status={status} staleDays={staleDays} />
      </div>

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <p className="mb-3 text-xs text-zw-grey-500">
        Dosya biçimi: ilk satırda başlıklar — <strong>SKU</strong> (ya da Ürün Kodu / Stok Kodu) ve <strong>Adet</strong>
        {isRetailer && (
          <>
            ; online satıcılar için ayrıca <strong>Fiyat</strong> ve <strong>Link</strong>
          </>
        )}
        . Her dosya bu kaynağın tam listesi sayılır: dosyada olmayan ürün stoktan çıkar. Şablonu indirip
        doldurtabilirsiniz; Excel'de .xlsx ya da .csv olarak kaydedilebilir.
      </p>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün veya kod ara…" className="pl-9" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-zw-grey-700">
              <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} className="accent-zw-red-600" />
              Yalnızca stoktakiler
            </label>
          </div>

          <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
                <tr>
                  <th className="px-3 py-2.5">Kod</th>
                  <th className="px-3 py-2.5">Ürün</th>
                  <th className="px-3 py-2.5 text-right">Adet</th>
                  {isRetailer && <th className="px-3 py-2.5 text-right">Fiyat (₺)</th>}
                  {isRetailer && <th className="px-3 py-2.5">Ürün linki</th>}
                  <th className="px-3 py-2.5">Güncelleme</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100">
                {rows.map(({ level, label }) => (
                  // Anahtarda guncelleme zamani var: yukleme/geri almadan sonra satir yeni degerle kurulur.
                  <StockRow key={`${level.productId}|${level.variantId ?? ""}|${level.updatedAt}`} level={level} label={label} source={source} by={by} now={now} />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={isRetailer ? 7 : 5} className="px-3 py-8 text-center text-zw-grey-500">
                      {status.rows === 0 ? "Henüz stok yüklenmedi. Dosya yükleyin ya da aşağıdan satır ekleyin." : "Aramaya uyan satır yok."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AddRow source={source} by={by} />
        </div>

        <aside>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zw-grey-700">Geçmiş</h2>
          <div className="divide-y divide-zw-grey-100 rounded-[4px] border border-zw-grey-200 bg-white">
            {history.slice(0, 30).map((h) => (
              <div key={h.id} className={`px-3 py-2.5 text-sm ${h.revertedAt ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2">
                  <Badge tone={h.kind === "file" ? "dark" : h.kind === "revert" ? "amber" : "outline"}>
                    {h.kind === "file" ? "Dosya" : h.kind === "revert" ? "Geri alma" : "Elle"}
                  </Badge>
                  <span className="text-xs text-zw-grey-500">{formatDateTime(h.createdAt)}</span>
                </div>
                <div className="mt-1 break-words text-zw-grey-800">{h.kind === "file" ? h.fileName : h.note}</div>
                {h.kind !== "manual" && (
                  <div className="mt-1 text-xs text-zw-grey-500">
                    +{h.summary.added} giren · {h.summary.changed} değişen · −{h.summary.zeroed} çıkan
                    {h.summary.unmatched + h.summary.invalid > 0 && <> · {h.summary.unmatched + h.summary.invalid} satır uygulanmadı</>}
                  </div>
                )}
                {h.createdBy && <div className="text-xs text-zw-grey-400">{h.createdBy}</div>}
                {h.revertedAt && <div className="text-xs font-semibold text-amber-700">Geri alındı · {formatDateTime(h.revertedAt)}</div>}
                {revertable?.id === h.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${h.fileName}" yüklemesi geri alınsın mı? Stok bu yüklemeden önceki haline döner.`)) {
                        revertStockImport(h.id, by);
                        setMessage({ tone: "success", text: "Yükleme geri alındı; stok önceki haline döndü." });
                      }
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-zw-red-600 hover:underline"
                  >
                    <Undo2 size={13} /> Bu yüklemeyi geri al
                  </button>
                )}
              </div>
            ))}
            {history.length === 0 && <p className="px-3 py-6 text-center text-sm text-zw-grey-500">Henüz işlem yok.</p>}
          </div>
        </aside>
      </div>

      {upload && (
        <StockUpload source={source} table={upload.table} fileName={upload.fileName} onClose={() => setUpload(null)} onApplied={onApplied} />
      )}
    </>
  );
}

/** Tek satir: adet (ve satici icin fiyat/link) yerinde duzeltilir; alandan cikinca kaydedilir. */
function StockRow({
  level,
  label,
  source,
  by,
  now,
}: {
  level: StockLevel;
  label: string;
  source: StockSource;
  by?: string;
  now: number;
}) {
  const [qty, setQty] = useState(String(level.quantity));
  const [price, setPrice] = useState(level.price != null ? String(level.price) : "");
  const [url, setUrl] = useState(level.url ?? "");
  const isRetailer = source.type === "retailer";
  const key = { sourceType: source.type, sourceId: source.id, productId: level.productId, variantId: level.variantId, by, label };

  const commitQty = () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 0) return setQty(String(level.quantity));
    if (n !== level.quantity) setStockLevel({ ...key, patch: { quantity: n } });
  };
  const commitPrice = () => {
    const n = price.trim() === "" ? undefined : Number(price.replace(",", "."));
    if (n !== undefined && (!Number.isFinite(n) || n < 0)) return setPrice(level.price != null ? String(level.price) : "");
    if (n !== level.price) setStockLevel({ ...key, patch: { price: n } });
  };
  const commitUrl = () => {
    const v = url.trim() || undefined;
    if (v && !/^https?:\/\//i.test(v)) return setUrl(level.url ?? "");
    if (v !== level.url) setStockLevel({ ...key, patch: { url: v } });
  };
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && e.currentTarget.blur();

  return (
    <tr className={level.quantity > 0 ? undefined : "text-zw-grey-500"}>
      <td className="px-3 py-1.5 text-xs">{level.sku}</td>
      <td className="px-3 py-1.5">{label}</td>
      <td className="px-3 py-1.5 text-right">
        <input
          type="number"
          min={0}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={commitQty}
          onKeyDown={onEnter}
          aria-label={`${label} adet`}
          className="w-20 rounded-[3px] border border-zw-grey-300 px-2 py-1 text-right"
        />
      </td>
      {isRetailer && (
        <td className="px-3 py-1.5 text-right">
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={onEnter}
            title={level.price != null ? formatPrice(level.price) : undefined}
            aria-label={`${label} fiyat`}
            className="w-28 rounded-[3px] border border-zw-grey-300 px-2 py-1 text-right"
          />
        </td>
      )}
      {isRetailer && (
        <td className="px-3 py-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={commitUrl}
            onKeyDown={onEnter}
            placeholder="https://…"
            aria-label={`${label} link`}
            className="w-56 rounded-[3px] border border-zw-grey-300 px-2 py-1 text-xs"
          />
        </td>
      )}
      <td className="whitespace-nowrap px-3 py-1.5 text-xs text-zw-grey-500" title={formatDateTime(level.updatedAt)}>
        {ageText(level.updatedAt, now)}
      </td>
      <td className="px-3 py-1.5 text-right">
        <button
          type="button"
          aria-label={`${label} satırını sil`}
          onClick={() => window.confirm(`${label} bu listeden çıkarılsın mı?`) && deleteStockLevel(key)}
          className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}

/** Dosyayi beklemeden tek urun ekleme */
function AddRow({ source, by }: { source: StockSource; by?: string }) {
  const db = useDatabase();
  const [choice, setChoice] = useState("");
  const [qty, setQty] = useState("1");
  const choices = useMemo(() => productChoices(db), [db]);
  const n = Number(qty);

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-[4px] border border-dashed border-zw-grey-300 bg-white p-3 sm:flex-row sm:items-center">
      <span className="text-sm font-semibold text-zw-grey-700">Satır ekle:</span>
      <Select value={choice} onChange={(e) => setChoice(e.target.value)} className="min-w-0 flex-1">
        <option value="">Ürün seçin…</option>
        {choices.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
      <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} className="sm:w-24" aria-label="Adet" />
      <Button
        size="sm"
        leftIcon={<Plus size={15} />}
        disabled={!choice || !Number.isInteger(n) || n < 0}
        onClick={() => {
          const { productId, variantId } = splitChoice(choice);
          setStockLevel({ sourceType: source.type, sourceId: source.id, productId, variantId, patch: { quantity: n }, by, label: productLabel(db, productId, variantId) });
          setChoice("");
          setQty("1");
        }}
      >
        Ekle
      </Button>
    </div>
  );
}

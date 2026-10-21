"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Link2 } from "lucide-react";
import {
  diffStock,
  looksTruncated,
  matchStockRows,
  readStockSheet,
  type StockChange,
  type StockImport,
} from "@zenweld/data";
import { applyStockImport, saveSkuAlias, stockOfSource, useDatabase, type StockSource } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, Modal, Select } from "@zenweld/ui";
import { formatPrice } from "@zenweld/utils";
import { productChoices, productLabel, splitChoice, useAdminName } from "./shared";

const colLetter = (i: number) => String.fromCharCode(65 + i);

type View = "changes" | "unmatched" | "invalid";

/**
 * STOK DOSYASI ONIZLEME
 *
 * Dosya once okunur ve mevcut stokla karsilastirilir; "Uygula" denince
 * kaynagin stogu dosyadaki listeyle degistirilir (tam liste: dosyada
 * olmayan urun stoktan cikar). Taninmayan kodlar burada urune baglanir;
 * eslestirme kaydedilir, sonraki dosyalarda kendiliginden taninir.
 */
export function StockUpload({
  source,
  table,
  fileName,
  onClose,
  onApplied,
}: {
  source: StockSource;
  table: unknown[][];
  fileName: string;
  onClose: () => void;
  onApplied: (record: StockImport) => void;
}) {
  const db = useDatabase();
  const by = useAdminName();
  const [view, setView] = useState<View>("changes");
  const [confirmTruncated, setConfirmTruncated] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);

  const { withUrl } = source;
  const sheet = useMemo(() => readStockSheet(table, { withUrl }), [table, withUrl]);
  // Eslestirme tablosu (db.skuAliases) degisince yeniden eslesir.
  const file = useMemo(
    () =>
      matchStockRows(sheet, {
        sourceId: source.id,
        products: db.products,
        aliases: db.skuAliases,
        at: new Date().toISOString(),
      }),
    [sheet, source, db.products, db.skuAliases],
  );
  const current = useMemo(() => stockOfSource(source.type, source.id, db), [source, db]);
  const diff = useMemo(() => diffStock(current, file.incoming), [current, file.incoming]);
  const truncated = looksTruncated(current, file.incoming);
  const warnings = file.rows.filter((r) => r.warning);
  const noLink = withUrl ? file.incoming.filter((r) => r.quantity > 0 && !r.url).length : 0;
  const choices = useMemo(() => productChoices(db), [db]);

  const changes: (StockChange & { kind: "added" | "changed" | "zeroed" })[] = [
    ...diff.added.map((c) => ({ ...c, kind: "added" as const })),
    ...diff.changed.map((c) => ({ ...c, kind: "changed" as const })),
    ...diff.zeroed.map((c) => ({ ...c, kind: "zeroed" as const })),
  ];
  const canApply = file.incoming.length > 0 && (!truncated || confirmTruncated);
  const { columns } = sheet;

  const apply = () => {
    const record = applyStockImport({ sourceType: source.type, sourceId: source.id, fileName, file, by });
    if (record) onApplied(record);
    else setFailed(true);
  };

  return (
    <Modal open onClose={onClose} title={`Stok dosyası: ${fileName}`} size="xl">
      <div className="space-y-4">
        <p className="text-sm text-zw-grey-600">
          <strong className="text-zw-ink">{source.name}</strong> stoğu bu dosyadaki listeyle değiştirilecek. Dosyada
          olmayan ürünler stoktan çıkar.
        </p>

        <div className="rounded-[4px] bg-zw-grey-50 px-3 py-2 text-xs text-zw-grey-600">
          {columns ? (
            <>
              Başlık satırı {columns.headerRow + 1}. Okunan sütunlar: Kod = {colLetter(columns.code)}, Adet ={" "}
              {colLetter(columns.quantity)}
              {columns.price !== undefined && <>, Fiyat = {colLetter(columns.price)}</>}
              {withUrl && columns.url !== undefined && <>, Link = {colLetter(columns.url)}</>}
              {columns.price === undefined && <> · fiyat sütunu bulunamadı</>}
              {withUrl && columns.url === undefined && <> · link sütunu bulunamadı</>}
            </>
          ) : (
            <>Başlık satırı bulunamadı.</>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Dosyadaki satır" value={file.rows.length} />
          <Stat label="Eşleşen ürün" value={file.incoming.length} />
          <Stat label="Tanınmayan kod" value={file.unmatched.length} tone={file.unmatched.length ? "amber" : undefined} />
          <Stat label="Hatalı satır" value={file.invalid.length} tone={file.invalid.length ? "red" : undefined} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Stoğa girecek" value={diff.added.length} tone="green" />
          <Stat label="Değişecek" value={diff.changed.length} />
          <Stat label="Stoktan çıkacak" value={diff.zeroed.length} tone={diff.zeroed.length ? "amber" : undefined} />
          <Stat label="Değişmeyen" value={diff.unchanged} />
        </div>

        {failed && (
          <Alert tone="danger">Stok güncellenemedi: tarayıcı deposu dolu. Değişiklik uygulanmadı.</Alert>
        )}
        {!columns && (
          <Alert tone="danger">
            Dosyada başlık satırı bulunamadı; uygulanamaz. İlk satırlardan birinde &quot;Kod&quot; (veya SKU) ve
            &quot;Adet&quot; başlıkları olmalı. Şablon İndir ile alınan dosyadaki başlık satırını silmeyin.
          </Alert>
        )}
        {columns && file.incoming.length === 0 && (
          <Alert tone="danger">Dosyada eşleşen ürün yok; uygulanamaz. Sütun başlıklarını ve kodları kontrol edin.</Alert>
        )}
        {truncated && (
          <div className="rounded-[4px] border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                Bu dosya öncekinden çok daha kısa: önceki listede {current.filter((l) => l.quantity > 0).length} stoklu
                ürün vardı, bu dosyada {file.incoming.length} ürün var. Yarım gönderilmiş olabilir; uygularsanız{" "}
                {diff.zeroed.length} ürün stoktan çıkar.
              </div>
            </div>
            <div className="mt-2">
              <Checkbox
                label="Dosyanın tam liste olduğunu kontrol ettim"
                checked={confirmTruncated}
                onChange={(e) => setConfirmTruncated(e.target.checked)}
              />
            </div>
          </div>
        )}
        {noLink > 0 && (
          <Alert tone="warning">
            Stoktaki {noLink} ürünün linki yok; bu ürünler online satıcı kartında görünmez
            {source.type === "dealer" ? " (haritada görünür)" : ""}.
          </Alert>
        )}
        {file.duplicates.length > 0 && (
          <Alert tone="warning">
            {file.duplicates.length} ürün dosyada birden fazla kez geçiyor; her biri için son satır kullanıldı (satır{" "}
            {file.duplicates.map((d) => d.line).join(", ")}).
          </Alert>
        )}
        {warnings.length > 0 && (
          <Alert tone="warning">
            {warnings.map((w) => (
              <div key={w.line}>
                Satır {w.line} ({w.code}): {w.warning}
              </div>
            ))}
          </Alert>
        )}

        <div className="flex gap-1 border-b border-zw-grey-200">
          {(
            [
              ["changes", `Değişiklikler (${changes.length})`],
              ["unmatched", `Tanınmayan kodlar (${file.unmatched.length})`],
              ["invalid", `Hatalı satırlar (${file.invalid.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${view === id ? "border-zw-red-600 text-zw-ink" : "border-transparent text-zw-grey-500 hover:text-zw-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[42vh] overflow-auto rounded-[4px] border border-zw-grey-200">
          {view === "changes" && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
                <tr>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">Ürün</th>
                  <th className="px-3 py-2 text-right">Önce</th>
                  <th className="px-3 py-2 text-right">Sonra</th>
                  <th className="px-3 py-2 text-right">Fiyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100" style={{ fontVariantNumeric: "tabular-nums" }}>
                {changes.map((c) => (
                  <tr key={c.key}>
                    <td className="px-3 py-1.5">
                      {c.kind === "added" && <Badge tone="green">Stoğa giriyor</Badge>}
                      {c.kind === "changed" && <Badge tone="grey">Değişiyor</Badge>}
                      {c.kind === "zeroed" && <Badge tone="amber">{c.after ? "Adet 0" : "Dosyada yok"}</Badge>}
                    </td>
                    <td className="px-3 py-1.5">
                      <div>{productLabel(db, c.productId, c.variantId)}</div>
                      <div className="text-xs text-zw-grey-500">{(c.after ?? c.before)?.sku}</div>
                    </td>
                    <td className="px-3 py-1.5 text-right">{c.before?.quantity ?? "—"}</td>
                    <td className="px-3 py-1.5 text-right font-semibold">{c.after?.quantity ?? 0}</td>
                    <td className="px-3 py-1.5 text-right text-xs text-zw-grey-600">
                      {c.before?.price !== c.after?.price && c.after?.price != null ? (
                        <>
                          {c.before?.price != null && <span className="text-zw-grey-400 line-through">{formatPrice(c.before.price)}</span>}{" "}
                          {formatPrice(c.after.price)}
                        </>
                      ) : c.after?.price != null ? (
                        formatPrice(c.after.price)
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
                {changes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zw-grey-500">
                      Mevcut stokta değişiklik yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {view === "unmatched" && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
                <tr>
                  <th className="px-3 py-2">Satır</th>
                  <th className="px-3 py-2">Dosyadaki kod</th>
                  <th className="px-3 py-2 text-right">Adet</th>
                  <th className="px-3 py-2">Hangi ürün? (bir kez eşleştirilir, sonraki dosyalarda tanınır)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100">
                {file.unmatched.map((r) => (
                  <tr key={r.line}>
                    <td className="px-3 py-1.5 text-zw-grey-500">{r.line}</td>
                    <td className="px-3 py-1.5 font-semibold">{r.code}</td>
                    <td className="px-3 py-1.5 text-right">{r.quantity}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex gap-2">
                        <Select
                          value={mapping[r.code] ?? ""}
                          onChange={(e) => setMapping((m) => ({ ...m, [r.code]: e.target.value }))}
                          className="min-w-0 flex-1"
                        >
                          <option value="">Ürün seçin…</option>
                          {choices.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Link2 size={14} />}
                          disabled={!mapping[r.code]}
                          onClick={() => saveSkuAlias({ sourceId: source.id, code: r.code, ...splitChoice(mapping[r.code]) })}
                        >
                          Eşleştir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {file.unmatched.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-zw-grey-500">
                      Tüm kodlar tanındı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {view === "invalid" && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
                <tr>
                  <th className="px-3 py-2">Satır</th>
                  <th className="px-3 py-2">Kod</th>
                  <th className="px-3 py-2">Sorun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100">
                {file.invalid.map((r) => (
                  <tr key={r.line}>
                    <td className="px-3 py-1.5 text-zw-grey-500">{r.line}</td>
                    <td className="px-3 py-1.5">{r.code || "—"}</td>
                    <td className="px-3 py-1.5 text-zw-red-600">{r.error}</td>
                  </tr>
                ))}
                {file.invalid.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-zw-grey-500">
                      Hatalı satır yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {(file.unmatched.length > 0 || file.invalid.length > 0) && (
          <p className="text-xs text-zw-grey-500">
            Tanınmayan ve hatalı satırlar uygulanmaz; bu ürünler stoğa girmez. Dosyayı düzelttirip yeniden
            yükleyebilir ya da kodları yukarıdan eşleştirebilirsiniz.
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-zw-grey-200 pt-4">
          <Button onClick={apply} disabled={!canApply}>
            Stoğu Güncelle
          </Button>
          <Button variant="outline" onClick={onClose}>
            Vazgeç
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "green" | "amber" | "red" }) {
  const color = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : tone === "red" ? "text-zw-red-600" : "text-zw-ink";
  return (
    <div className="rounded-[4px] border border-zw-grey-200 px-3 py-2">
      <div className="text-xs text-zw-grey-500">{label}</div>
      <div className={`text-xl font-semibold ${color}`} style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

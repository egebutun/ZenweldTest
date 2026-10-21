"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { DOCUMENT_SECTIONS, type DocumentFile, type DocumentSection } from "@zenweld/data";
import {
  DOCUMENT_EXTENSIONS,
  DocumentError,
  addDocument,
  deleteDocument,
  documentPage,
  documentsOfSection,
  moveDocument,
  saveDocumentPage,
  setDocumentActive,
  updateDocument,
  useDatabase,
  type DocumentInput,
} from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Modal, Select, Textarea } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { formatBytes, openDocument } from "@/lib/documents";

/**
 * BELGELER
 *
 * Kesfet > Diger altindaki MSDS, Ultimate Kaynak Rehberi ve Parti
 * Sertifikalari sayfalarinin basligi, aciklamasi ve belgeleri. Belgeler
 * sitede bu listedeki sirayla gorunur.
 */
export default function AdminDocumentsPage() {
  const db = useDatabase();
  const [section, setSection] = useState<DocumentSection>("msds");
  const [editing, setEditing] = useState<DocumentFile | "new" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const docs = documentsOfSection(section, db);
  const meta = DOCUMENT_SECTIONS.find((s) => s.id === section)!;
  const withLot = section === "parti-sertifikalari";

  const view = async (doc: DocumentFile) => {
    setMessage((await openDocument(doc)) ? null : `"${doc.fileName}" bu tarayıcıda bulunamadı; dosyayı yeniden yükleyin.`);
  };

  return (
    <>
      <AdminPageHeader
        title="Belgeler"
        description="Keşfet › Diğer menüsündeki belge sayfaları. Yüklenen belgeler sitede bu listedeki sırayla görünür."
        action={
          <Button leftIcon={<Plus size={17} />} onClick={() => setEditing("new")}>
            Belge Ekle
          </Button>
        }
      />

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-zw-grey-200">
        {DOCUMENT_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSection(s.id);
              setMessage(null);
            }}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold ${
              section === s.id ? "border-zw-red-600 text-zw-ink" : "border-transparent text-zw-grey-500 hover:text-zw-ink"
            }`}
          >
            {s.label} ({documentsOfSection(s.id, db).length})
          </button>
        ))}
      </div>

      <PageTextForm key={section} section={section} href={meta.href} />

      {message && (
        <div className="mb-4">
          <Alert tone="danger">{message}</Alert>
        </div>
      )}

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="w-20 px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Belge</th>
              <th className="px-4 py-3">Ürün</th>
              {withLot && <th className="px-4 py-3">Parti No</th>}
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {docs.map((d, i) => {
              const product = db.products.find((p) => p.id === d.productId);
              return (
                <tr key={d.id} className={d.active ? "" : "text-zw-grey-500"}>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button type="button" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => moveDocument(d.id, -1)} className="rounded p-1 hover:bg-zw-grey-100 disabled:opacity-30">
                        <ArrowUp size={15} />
                      </button>
                      <button type="button" aria-label="Aşağı taşı" disabled={i === docs.length - 1} onClick={() => moveDocument(d.id, 1)} className="rounded p-1 hover:bg-zw-grey-100 disabled:opacity-30">
                        <ArrowDown size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-zw-grey-500">
                      {d.fileName} · {formatBytes(d.size)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zw-grey-600">{product ? `${product.name} · ${product.sku}` : "—"}</td>
                  {withLot && <td className="px-4 py-2.5 text-zw-grey-600">{d.lotNumber ?? "—"}</td>}
                  <td className="px-4 py-2.5">
                    <button type="button" onClick={() => setDocumentActive(d.id, !d.active)} title={d.active ? "Yayından kaldır" : "Yayına al"}>
                      {d.active ? <Badge tone="green">Yayında</Badge> : <Badge tone="grey">Yayında değil</Badge>}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" title="Görüntüle" onClick={() => void view(d)} className="rounded p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink">
                        <ExternalLink size={16} />
                      </button>
                      <button type="button" title="Düzenle" onClick={() => setEditing(d)} className="rounded p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink">
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Sil"
                        onClick={() => {
                          if (window.confirm(`"${d.title}" silinsin mi? Dosya da silinir.`)) void deleteDocument(d.id);
                        }}
                        className="rounded p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {docs.length === 0 && (
              <tr>
                <td colSpan={withLot ? 6 : 5} className="px-4 py-10 text-center text-zw-grey-500">
                  Bu sayfada henüz belge yok. “Belge Ekle” ile yükleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <DocumentForm
          key={editing === "new" ? `new-${section}` : editing.id}
          section={section}
          doc={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

/** Sayfanin sitede gorunen basligi ve aciklamasi. */
function PageTextForm({ section, href }: { section: DocumentSection; href: string }) {
  const db = useDatabase();
  const page = documentPage(section, db);
  const [title, setTitle] = useState(page.title);
  const [subtitle, setSubtitle] = useState(page.subtitle);
  const [saved, setSaved] = useState(false);
  const changed = title.trim() !== page.title || subtitle.trim() !== page.subtitle;

  return (
    <div className="mb-5 space-y-3 rounded-[4px] border border-zw-grey-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zw-grey-700">Sayfa metni</h2>
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-zw-red-600 hover:underline">
          Sayfayı aç <ExternalLink size={13} />
        </a>
      </div>
      <FormRow label="Başlık" required>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
        />
      </FormRow>
      <FormRow label="Açıklama">
        <Textarea
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            setSaved(false);
          }}
          className="min-h-16"
        />
      </FormRow>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={!title.trim() || !changed}
          onClick={() => {
            if (saveDocumentPage({ section, title: title.trim(), subtitle: subtitle.trim() })) setSaved(true);
          }}
        >
          Kaydet
        </Button>
        {saved && <span className="text-xs font-semibold text-emerald-700">Kaydedildi</span>}
      </div>
    </div>
  );
}

/** Belge ekleme / duzenleme. Duzenlemede dosya secilmezse eski dosya kalir. */
function DocumentForm({ section, doc, onClose }: { section: DocumentSection; doc?: DocumentFile; onClose: () => void }) {
  const db = useDatabase();
  const withLot = section === "parti-sertifikalari";
  const [input, setInput] = useState<DocumentInput>({
    title: doc?.title ?? "",
    productId: doc?.productId ?? "",
    lotNumber: doc?.lotNumber ?? "",
    active: doc?.active ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  // Baslik elle yazilmadikca secilen dosyanin adiyla doldurulur.
  const [autoTitle, setAutoTitle] = useState(!doc?.title);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const products = [...db.products].sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const save = async () => {
    if (!input.title.trim()) return setError("Başlık zorunludur.");
    if (!doc && !file) return setError("Dosya seçin.");
    setSaving(true);
    setError(null);
    try {
      if (doc) await updateDocument(doc.id, input, file ?? undefined);
      else await addDocument(section, input, file!);
      onClose();
    } catch (err) {
      setError(err instanceof DocumentError ? err.message : "Belge kaydedilemedi.");
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={doc ? "Belgeyi Düzenle" : "Belge Ekle"}>
      <div className="space-y-4">
        <FormRow
          label="Dosya"
          required={!doc}
          hint={`PDF, Word, Excel, JPG, PNG veya ZIP · en fazla 25 MB${doc ? " · seçmezseniz mevcut dosya kalır" : ""}`}
        >
          <input
            type="file"
            accept={DOCUMENT_EXTENSIONS.map((e) => `.${e}`).join(",")}
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              setFile(picked);
              if (picked && (autoTitle || !input.title.trim())) {
                setInput((v) => ({ ...v, title: picked.name.replace(/\.[^.]+$/, "") }));
                setAutoTitle(true);
              }
            }}
            className="block w-full text-sm file:mr-3 file:rounded-[4px] file:border file:border-zw-grey-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:border-zw-ink"
          />
          {(file || doc) && (
            <div className="mt-1.5 text-xs text-zw-grey-500">
              {file ? `${file.name} · ${formatBytes(file.size)}` : `Mevcut: ${doc!.fileName} · ${formatBytes(doc!.size)}`}
            </div>
          )}
        </FormRow>
        <FormRow label="Başlık" required>
          <Input
            value={input.title}
            onChange={(e) => {
              setInput({ ...input, title: e.target.value });
              setAutoTitle(false);
            }}
          />
        </FormRow>
        <FormRow label="Ürün" hint="İsteğe bağlı. Ziyaretçi ürün adı veya koduyla arayabilir.">
          <Select value={input.productId} onChange={(e) => setInput({ ...input, productId: e.target.value })}>
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.sku}
              </option>
            ))}
          </Select>
        </FormRow>
        {withLot && (
          <FormRow label="Parti / Lot No" hint="İsteğe bağlı. Ziyaretçi parti numarasıyla arayabilir.">
            <Input value={input.lotNumber} onChange={(e) => setInput({ ...input, lotNumber: e.target.value })} />
          </FormRow>
        )}
        <Checkbox label="Yayında (sitede görünür)" checked={input.active} onChange={(e) => setInput({ ...input, active: e.target.checked })} />
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex gap-3 pt-1">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "Yükleniyor…" : "Kaydet"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Vazgeç
          </Button>
        </div>
      </div>
    </Modal>
  );
}

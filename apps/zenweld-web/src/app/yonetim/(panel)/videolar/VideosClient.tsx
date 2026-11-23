"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  VIDEO_LIMITS,
  parseHomeVideoSettings,
  parseVideo,
  videoTaken,
  videoTitle,
  youtubeIdFrom,
  youtubeLink,
  VIDEO_TWICE,
  type SiteVideo,
} from "@zenweld/data";
import { getHomeVideos, listVideos, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Modal, ProductImage, Select } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import { VideoCover } from "@/components/home/VideoCover";
import { useContentActions, type PanelAnswer } from "@/lib/admin-content";
import { useSettingsActions } from "@/lib/admin-settings";
import { useUploads } from "@/lib/admin-files";

/** Formun taslagi: youtubeId kutusunda yoneticinin yazdigi link durur; kaydederken kimlige cevrilir. */
type Draft = { id: string; youtubeId: string; title: string; productId: string; cover?: string; showOnHome: boolean; active: boolean };

const EMPTY: Draft = { id: "", youtubeId: "", title: "", productId: "", showOnHome: true, active: true };

const draftOf = (v: SiteVideo): Draft => ({
  id: v.id,
  youtubeId: v.youtubeId ? youtubeLink(v.youtubeId) : "",
  title: v.title ?? "",
  productId: v.productId ?? "",
  cover: v.cover,
  showOnHome: v.showOnHome,
  active: v.active,
});

/**
 * PANEL › VIDEOLAR (KARARLAR K-125)
 *
 * Video kutuphanesi: her video bir kez eklenir. Urune bagli video urunun
 * sayfasinda, "Anasayfada göster" isaretliyse anasayfada gorunur; sitede
 * bu listedeki sirayla. Ustte anasayfa bolumunun basligi. Bugun YouTube
 * videosu eklenir; kendi videolarimizin yuklenmesi adim 1b'de. Veritabani
 * modunda islemler sunucuya yazilir (lib/admin-content.ts,
 * lib/admin-settings.ts). Kurallar: packages/data › video-rules.ts.
 */
export function VideosClient() {
  const db = useDatabase();
  const content = useContentActions();
  const settingsActions = useSettingsActions();
  const uploads = useUploads();
  const videos = listVideos(db);
  const products = [...db.products].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const productOf = (id?: string) => db.products.find((p) => p.id === id);

  const stored = getHomeVideos(db);
  const [title, setTitle] = useState(stored.title);
  const [titleNote, setTitleNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const run = async (answer: Promise<PanelAnswer>) => {
    const result = await answer;
    setListError(result.ok ? null : result.error);
  };
  const close = () => {
    setEditing(null);
    setError(null);
  };

  const saveTitle = async () => {
    const parsed = parseHomeVideoSettings({ title });
    if (!parsed.ok) return setTitleNote({ ok: false, text: parsed.error ?? "Başlık okunamadı." });
    const answer = await settingsActions.saveHomeVideos(parsed.value, stored);
    setTitleNote(answer.ok ? { ok: true, text: "Bölüm başlığı kaydedildi." } : { ok: false, text: answer.error });
  };

  const save = async () => {
    if (!editing) return;
    const parsed = parseVideo({ ...editing, source: "youtube" });
    if (!parsed.ok) return setError(parsed.error ?? "Bilgiler okunamadı; sayfayı yenileyip tekrar deneyin.");
    if (videoTaken(videos, parsed.value.youtubeId, editing.id || undefined)) return setError(VIDEO_TWICE);
    const answer = await content.saveVideo(parsed.value, videos.find((v) => v.id === editing.id));
    if (!answer.ok) return setError(answer.error);
    close();
  };

  const previewId = editing ? youtubeIdFrom(editing.youtubeId) : null;

  return (
    <>
      <AdminPageHeader
        title="Videolar"
        description="Video kütüphanesi. Her video bir kez eklenir: seçilen ürünün sayfasında, “Anasayfada göster” işaretliyse anasayfada görünür. Sitede bu sırayla çıkar."
        action={
          <Button leftIcon={<Plus size={17} />} onClick={() => setEditing({ ...EMPTY })}>
            Yeni Video
          </Button>
        }
      />

      <AdminCard className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormRow label="Anasayfa bölüm başlığı" required hint={`En fazla ${VIDEO_LIMITS.sectionTitle} karakter.`}>
              <Input value={title} maxLength={VIDEO_LIMITS.sectionTitle} onChange={(e) => setTitle(e.target.value)} />
            </FormRow>
          </div>
          <Button variant="outline" disabled={settingsActions.pending} onClick={() => void saveTitle()}>
            Başlığı Kaydet
          </Button>
        </div>
        {titleNote && (
          <div className="mt-3">
            <Alert tone={titleNote.ok ? "success" : "danger"}>{titleNote.text}</Alert>
          </div>
        )}
      </AdminCard>

      {listError && (
        <div className="mb-4">
          <Alert tone="danger">{listError}</Alert>
        </div>
      )}

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="w-20 px-4 py-3">Sıra</th>
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {videos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zw-grey-500">
                  Henüz video yok; anasayfada video bölümü görünmez.
                </td>
              </tr>
            )}
            {videos.map((v, i) => {
              const product = productOf(v.productId);
              return (
                <tr key={v.id}>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" aria-label={`${i + 1}. videoyu yukarı taşı`} disabled={i === 0} onClick={() => void run(content.moveVideo(v, -1))}>
                        <ArrowUp size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${i + 1}. videoyu aşağı taşı`}
                        disabled={i === videos.length - 1}
                        onClick={() => void run(content.moveVideo(v, 1))}
                      >
                        <ArrowDown size={14} />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex aspect-[9/16] w-10 shrink-0 overflow-hidden rounded-[3px] bg-zw-ink">
                        {v.cover ? (
                          <ProductImage src={v.cover} alt="" label="" className="h-full w-full object-cover" />
                        ) : v.youtubeId ? (
                          <VideoCover youtubeId={v.youtubeId} className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-zw-ink">{videoTitle(v, product)}</div>
                        <div className="text-xs text-zw-grey-500">YouTube · {v.youtubeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zw-grey-700">{product ? product.name : "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={v.active ? "green" : "grey"}>{v.active ? "Yayında" : "Kapalı"}</Badge>
                      {v.showOnHome && <Badge tone="outline">Anasayfada</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" aria-label={`${i + 1}. videoyu düzenle`} onClick={() => setEditing(draftOf(v))}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${i + 1}. videoyu sil`}
                        onClick={() => {
                          if (confirm("Bu video silinsin mi?")) void run(content.deleteVideo(v));
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={close} title={editing?.id ? "Videoyu Düzenle" : "Yeni Video"}>
        {editing && (
          <div className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <FormRow label="YouTube linki" required hint="Shorts ya da normal video linki (ör. https://www.youtube.com/shorts/…).">
              <Input
                value={editing.youtubeId}
                placeholder="https://www.youtube.com/shorts/…"
                onChange={(e) => setEditing({ ...editing, youtubeId: e.target.value })}
              />
            </FormRow>
            <FormRow label="Başlık" hint={`İsteğe bağlı, en fazla ${VIDEO_LIMITS.title} karakter. Boşsa ürünün adı kullanılır. Google'a da bu başlık gider.`}>
              <Input value={editing.title} maxLength={VIDEO_LIMITS.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </FormRow>
            <FormRow label="Ürün" hint="Video bu ürünün sayfasında görünür; altındaki adı ürün sayfasını açar. Yayında olmayan ürün sitede görünmez.">
              <Select value={editing.productId} onChange={(e) => setEditing({ ...editing, productId: e.target.value })}>
                <option value="">— Ürün yok —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.active ? "" : " (yayında değil)"}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Kapak görseli" hint="İsteğe bağlı. Boşsa YouTube'un en yüksek çözünürlüklü kapak resmi kullanılır. En keskin sonuç için dik (9:16), en az 1080×1920 görsel.">
              <div className="flex gap-3">
                <span className="flex aspect-[9/16] w-16 shrink-0 overflow-hidden rounded-[3px] bg-zw-ink">
                  {!editing.cover && previewId && <VideoCover youtubeId={previewId} className="h-full w-full object-cover" />}
                </span>
                <div className="flex-1">
                  <ImageField value={editing.cover} onChange={(cover) => setEditing({ ...editing, cover })} onError={setError} uploadNote={uploads.imageNote} />
                </div>
              </div>
            </FormRow>
            <Checkbox label="Anasayfada göster" checked={editing.showOnHome} onChange={(e) => setEditing({ ...editing, showOnHome: e.target.checked })} />
            <Checkbox label="Yayında" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            <div className="flex gap-2 pt-2">
              <Button onClick={() => void save()} disabled={content.pending}>
                Kaydet
              </Button>
              <Button variant="outline" onClick={close}>
                Vazgeç
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

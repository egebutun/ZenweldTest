"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  UPLOAD_RULES,
  VIDEO_LIMITS,
  VIDEO_TOOL_MISSING,
  videoPoster,
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
import { uploadVideoFile, useUploads } from "@/lib/admin-files";
import { usePanelFeatures } from "@/components/admin/PanelFeatures";

/**
 * Formun taslagi: youtubeId kutusunda yoneticinin yazdigi link durur;
 * kaydederken kimlige cevrilir. upload: kendi videomuzun yeni yuklenen
 * orijinali (depo anahtari).
 */
type Draft = {
  id: string;
  source: SiteVideo["source"];
  youtubeId: string;
  upload?: string;
  title: string;
  productId: string;
  cover?: string;
  showOnHome: boolean;
  active: boolean;
};

const EMPTY: Draft = { id: "", source: "youtube", youtubeId: "", title: "", productId: "", showOnHome: true, active: true };

const MB = 1024 * 1024;
const size = (bytes: number) => (bytes >= 1024 * MB ? `${(bytes / (1024 * MB)).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / MB))} MB`);
const duration = (s?: number) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");

/** Listedeki "Kaynak" satiri. */
function sourceLine(v: SiteVideo): string {
  if (v.source === "youtube") return `YouTube · ${v.youtubeId}`;
  const f = v.file;
  if (f?.status === "ready") return ["Kendi videomuz", duration(f.durationSeconds), f.width && f.height ? `${f.width}×${f.height}` : ""].filter(Boolean).join(" · ");
  return "Kendi videomuz";
}

const draftOf = (v: SiteVideo): Draft => ({
  id: v.id,
  source: v.source,
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
 * bu listedeki sirayla. Ustte anasayfa bolumunun basligi. Video YouTube
 * linkiyle ya da kendi videomuz olarak eklenir: kendi videomuzun orijinali
 * (en fazla 1 GB) secilince hemen yuklenir (ilerleme yuzdesiyle), kaydedince
 * sunucu web icin hazirlar; hazirlanirken listede "Hazırlanıyor…" yazar ve
 * ekran 5 saniyede bir yenilenir. Kendi videomuz yalnizca veritabani
 * modunda, dosya deposu ve ffmpeg varken yuklenir. Veritabani modunda
 * islemler sunucuya yazilir (lib/admin-content.ts, lib/admin-settings.ts).
 * Kurallar: packages/data › video-rules.ts.
 */
export function VideosClient() {
  const db = useDatabase();
  const content = useContentActions();
  const settingsActions = useSettingsActions();
  const uploads = useUploads();
  const features = usePanelFeatures();
  const router = useRouter();
  const videos = listVideos(db);
  const products = [...db.products].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const productOf = (id?: string) => db.products.find((p) => p.id === id);

  const stored = getHomeVideos(db);
  const [title, setTitle] = useState(stored.title);
  const [titleNote, setTitleNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  /** Secilen dosyanin yuklenmesi: yuzde ve sonuc. */
  const [progress, setProgress] = useState<{ name: string; size: number; percent: number; done: boolean } | null>(null);

  // Hazirlanan video varken liste 5 saniyede bir sunucudan yenilenir; ekran
  // acilinca isleyici (sunucu yeniden basladiysa) yeniden baslatilir.
  const processing = videos.some((v) => v.file?.status === "processing");
  useEffect(() => {
    if (processing && content.server) void content.resumeVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnizca ekran acilinca
  }, []);
  useEffect(() => {
    if (!processing || !content.server) return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [processing, content.server, router]);

  const run = async (answer: Promise<PanelAnswer>) => {
    const result = await answer;
    setListError(result.ok ? null : result.error);
  };
  const close = () => {
    setEditing(null);
    setError(null);
    setProgress(null);
  };

  /** Kendi videomuzun orijinali secilince hemen yuklenir. */
  const pickFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    setError(null);
    if (file.size > UPLOAD_RULES.video.maxBytes) return setError("Dosya çok büyük; en fazla 1 GB.");
    setProgress({ name: file.name, size: file.size, percent: 0, done: false });
    const answer = await uploadVideoFile(file, (percent) => setProgress((p) => p && { ...p, percent }));
    if (!answer.ok) {
      setProgress(null);
      return setError(answer.error);
    }
    setProgress({ name: file.name, size: answer.size, percent: 100, done: true });
    setEditing((d) => d && { ...d, upload: answer.upload });
  };

  const saveTitle = async () => {
    const parsed = parseHomeVideoSettings({ title });
    if (!parsed.ok) return setTitleNote({ ok: false, text: parsed.error ?? "Başlık okunamadı." });
    const answer = await settingsActions.saveHomeVideos(parsed.value, stored);
    setTitleNote(answer.ok ? { ok: true, text: "Bölüm başlığı kaydedildi." } : { ok: false, text: answer.error });
  };

  const save = async () => {
    if (!editing) return;
    const parsed = parseVideo(editing, !editing.id);
    if (!parsed.ok) return setError(parsed.error ?? "Bilgiler okunamadı; sayfayı yenileyip tekrar deneyin.");
    if (parsed.value.source === "youtube" && videoTaken(videos, parsed.value.youtubeId, editing.id || undefined)) return setError(VIDEO_TWICE);
    const answer = await content.saveVideo(parsed.value, videos.find((v) => v.id === editing.id));
    if (!answer.ok) return setError(answer.error);
    close();
  };

  const previewId = editing?.source === "youtube" ? youtubeIdFrom(editing.youtubeId) : null;
  const storedEditing = editing?.id ? videos.find((v) => v.id === editing.id) : undefined;
  /** Kendi videomuz neden yuklenemez (demo modu, depo ya da ffmpeg yok); yuklenebiliyorsa null. */
  const fileBlocked = !content.server
    ? "Kendi videolarımız yalnızca canlı sunucuda (veritabanı modu) yüklenir."
    : !features.uploads
      ? "Dosya deposu ayarlı değil; kendi videolarımız yüklenemez."
      : !features.videos
        ? VIDEO_TOOL_MISSING
        : null;

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
                        {videoPoster(v) ? (
                          <ProductImage src={videoPoster(v)} alt="" label="" className="h-full w-full object-cover" />
                        ) : v.youtubeId ? (
                          <VideoCover youtubeId={v.youtubeId} className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-zw-ink">{videoTitle(v, product)}</div>
                        <div className="text-xs text-zw-grey-500">{sourceLine(v)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zw-grey-700">{product ? product.name : "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={v.active ? "green" : "grey"}>{v.active ? "Yayında" : "Kapalı"}</Badge>
                      {v.showOnHome && <Badge tone="outline">Anasayfada</Badge>}
                      {v.file?.status === "processing" && <Badge tone="amber">Hazırlanıyor…</Badge>}
                      {v.file?.status === "failed" && <Badge tone="red">Hazırlanamadı</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      {content.server && v.source === "file" && v.file?.status !== "ready" && (
                        <Button variant="ghost" size="sm" aria-label={`${i + 1}. videoyu yeniden hazırla`} onClick={() => void run(content.retryVideo(v))}>
                          <RotateCcw size={14} />
                        </Button>
                      )}
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
            {!editing.id && (
              <FormRow label="Kaynak" group>
                <div className="flex flex-wrap gap-4">
                  {(["youtube", "file"] as const).map((source) => (
                    <label key={source} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="kaynak"
                        checked={editing.source === source}
                        disabled={source === "file" && fileBlocked !== null}
                        onChange={() => setEditing({ ...editing, source })}
                      />
                      {source === "youtube" ? "YouTube videosu" : "Kendi videomuz (dosya yükle)"}
                    </label>
                  ))}
                </div>
                {fileBlocked && <p className="mt-1 text-xs text-zw-grey-500">{fileBlocked}</p>}
              </FormRow>
            )}
            {editing.source === "youtube" ? (
              <FormRow label="YouTube linki" required hint="Shorts ya da normal video linki (ör. https://www.youtube.com/shorts/…).">
                <Input
                  value={editing.youtubeId}
                  placeholder="https://www.youtube.com/shorts/…"
                  onChange={(e) => setEditing({ ...editing, youtubeId: e.target.value })}
                />
              </FormRow>
            ) : (
              <FormRow
                label="Video dosyası"
                required={!editing.id}
                hint={`${UPLOAD_RULES.video.label}; en fazla 1 GB. Orijinal dosyayı yükleyin: sunucu web için 1080p ve 720p hazırlar, kapak karesini alır; görüntü kalitesi korunur.${editing.id ? " Yeni dosya seçilmezse video aynı kalır." : ""}`}
              >
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska,.mp4,.mov,.m4v,.webm,.mkv"
                  disabled={(progress !== null && !progress.done) || fileBlocked !== null}
                  onChange={(e) => void pickFile(e.target.files?.[0])}
                  className="block w-full text-sm"
                />
                {progress && (
                  <div className="mt-2" role="status">
                    <div className="h-2 overflow-hidden rounded-full bg-zw-grey-100">
                      <div className="h-full bg-zw-red-600 transition-all" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-zw-grey-600">
                      {progress.done ? `Yüklendi: ${progress.name} (${size(progress.size)}). Kaydedince hazırlanır.` : `Yükleniyor… %${progress.percent} (${size(progress.size)})`}
                    </p>
                  </div>
                )}
                {storedEditing?.file?.status === "ready" && !progress && (
                  <p className="mt-1 text-xs text-zw-grey-500">Şu anki video: {sourceLine(storedEditing)}</p>
                )}
              </FormRow>
            )}
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
            <FormRow
              label="Kapak görseli"
              hint={`İsteğe bağlı. Boşsa ${editing.source === "youtube" ? "YouTube'un en yüksek çözünürlüklü kapak resmi" : "videonun 1. saniyesinden alınan kare"} kullanılır. En keskin sonuç için dik (9:16), en az 1080×1920 görsel.`}
            >
              <div className="flex gap-3">
                <span className="flex aspect-[9/16] w-16 shrink-0 overflow-hidden rounded-[3px] bg-zw-ink">
                  {!editing.cover && previewId && <VideoCover youtubeId={previewId} className="h-full w-full object-cover" />}
                  {!editing.cover && storedEditing?.file?.poster && !progress && (
                    <ProductImage src={storedEditing.file.poster} alt="" label="" className="h-full w-full object-cover" />
                  )}
                </span>
                <div className="flex-1">
                  <ImageField value={editing.cover} onChange={(cover) => setEditing({ ...editing, cover })} onError={setError} uploadNote={uploads.imageNote} />
                </div>
              </div>
            </FormRow>
            <Checkbox label="Anasayfada göster" checked={editing.showOnHome} onChange={(e) => setEditing({ ...editing, showOnHome: e.target.checked })} />
            <Checkbox label="Yayında" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            <div className="flex gap-2 pt-2">
              <Button onClick={() => void save()} disabled={content.pending || (progress !== null && !progress.done)}>
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

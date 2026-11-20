"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  VIDEO_LIMITS,
  parseHomeVideos,
  youtubeIdFrom,
  youtubeLink,
  type HomeVideo,
  type HomeVideoSettings,
} from "@zenweld/data";
import { getHomeVideos, useDatabase } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, ProductImage, Select } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import { useSettingsActions } from "@/lib/admin-settings";
import { useUploads } from "@/lib/admin-files";
import { VideoCover } from "@/components/home/VideoCover";

/**
 * Ekranin taslagi: son degisiklik ani haric. youtubeId kutusunda
 * yoneticinin yazdigi link durur; kaydederken kimlige cevrilir.
 */
type Draft = Omit<HomeVideoSettings, "updatedAt">;

const draftOf = (settings: HomeVideoSettings): Draft => ({
  title: settings.title,
  videos: settings.videos.map((v) => ({ ...v, youtubeId: youtubeLink(v.youtubeId) })),
});

const newVideo = (): HomeVideo => ({ id: `video-${Date.now().toString(36)}`, youtubeId: "", active: true });

/**
 * PANEL › ANASAYFA VIDEOLARI (KARARLAR K-125)
 *
 * Anasayfadaki "Gerçek İşler, Gerçek Kaynak" bolumu: baslik ve videolar
 * (YouTube linki, altinda adi gorunen urun, istege bagli kapak, yayinda,
 * sira). "Değişiklikleri Kaydet" ile sitede gecerli olur. Veritabani
 * modunda kayit sunucuya yazilir (lib/admin-settings.ts). Kurallar:
 * packages/data › video-rules.ts.
 */
export function VideosClient() {
  const db = useDatabase();
  const actions = useSettingsActions();
  const uploads = useUploads();
  const stored = getHomeVideos(db);
  const [draft, setDraft] = useState<Draft>(() => draftOf(stored));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const products = [...db.products].sort((a, b) => a.name.localeCompare(b.name, "tr"));

  // Kayit baska yerde degisirse taslak yenilenir; kaydedilmemis degisiklik varsa korunur.
  const storedKey = JSON.stringify(draftOf(stored));
  const [syncedKey, setSyncedKey] = useState(storedKey);
  if (syncedKey !== storedKey) {
    setSyncedKey(storedKey);
    if (JSON.stringify(draft) === syncedKey) setDraft(draftOf(stored));
  }

  const setVideos = (videos: HomeVideo[]) => setDraft((d) => ({ ...d, videos }));
  const update = (index: number, patch: Partial<HomeVideo>) =>
    setVideos(draft.videos.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= draft.videos.length) return;
    const videos = [...draft.videos];
    const [item] = videos.splice(from, 1);
    videos.splice(to, 0, item);
    setVideos(videos);
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    const parsed = parseHomeVideos(draft);
    if (!parsed.ok) return setError(parsed.error ?? "Bilgiler okunamadı; sayfayı yenileyip tekrar deneyin.");
    const answer = await actions.saveHomeVideos(parsed.value, stored);
    if (!answer.ok) return setError(answer.error);
    setDraft(draftOf(parsed.value));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <AdminPageHeader
        title="Anasayfa Videoları"
        description="Anasayfada bayi bulucunun altındaki video bölümü. Videolar YouTube'dan gösterilir; ziyaretçi Oynat'a basınca yüklenir. Kaydedince sitede hemen görünür."
        action={
          <Button disabled={actions.pending} onClick={() => void save()}>
            Değişiklikleri Kaydet
          </Button>
        }
      />

      {saved && (
        <div className="mb-4">
          <Alert tone="success">Videolar kaydedildi.</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <AdminCard className="mb-5">
        <FormRow label="Bölüm başlığı" required hint={`En fazla ${VIDEO_LIMITS.title} karakter.`}>
          <Input
            value={draft.title}
            maxLength={VIDEO_LIMITS.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </FormRow>
      </AdminCard>

      {draft.videos.length === 0 && (
        <AdminCard className="mb-5">
          <p className="text-sm text-zw-grey-600">Video yok; bölüm anasayfada görünmez.</p>
        </AdminCard>
      )}

      <ol className="space-y-4">
        {draft.videos.map((video, i) => {
          const id = youtubeIdFrom(video.youtubeId);
          return (
            <li key={video.id}>
              <AdminCard>
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="flex w-28 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-zw-ink aspect-[9/16]">
                    {video.cover ? (
                      <ProductImage src={video.cover} alt="" label="" className="h-full w-full object-cover" />
                    ) : id ? (
                      <VideoCover youtubeId={id} className="h-full w-full object-cover" />
                    ) : (
                      <span className="px-2 text-center text-xs text-zw-grey-400">Önizleme yok</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-zw-ink">{i + 1}. video</div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => move(i, i - 1)}>
                          <ArrowUp size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label="Aşağı taşı"
                          disabled={i === draft.videos.length - 1}
                          onClick={() => move(i, i + 1)}
                        >
                          <ArrowDown size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label="Videoyu sil"
                          onClick={() => setVideos(draft.videos.filter((_, j) => j !== i))}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <FormRow label="YouTube linki" required hint="Shorts ya da normal video linki (ör. https://www.youtube.com/shorts/…).">
                      <Input
                        value={video.youtubeId}
                        placeholder="https://www.youtube.com/shorts/…"
                        onChange={(e) => update(i, { youtubeId: e.target.value })}
                      />
                    </FormRow>
                    <FormRow label="Ürün" hint="Videonun altında adı görünür; tıklanınca ürün sayfası açılır. Yayında olmayan ürün sitede görünmez.">
                      <Select value={video.productId ?? ""} onChange={(e) => update(i, { productId: e.target.value || undefined })}>
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
                      <ImageField
                        value={video.cover}
                        onChange={(cover) => update(i, { cover })}
                        onError={setError}
                        uploadNote={uploads.imageNote}
                      />
                    </FormRow>
                    <Checkbox label="Yayında" checked={video.active} onChange={(e) => update(i, { active: e.target.checked })} />
                  </div>
                </div>
              </AdminCard>
            </li>
          );
        })}
      </ol>

      <div className="mt-4">
        <Button
          variant="outline"
          leftIcon={<Plus size={16} />}
          disabled={draft.videos.length >= VIDEO_LIMITS.maxVideos}
          onClick={() => setVideos([...draft.videos, newVideo()])}
        >
          Video Ekle
        </Button>
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, GripVertical, Monitor, Plus, RotateCcw, Smartphone, Trash2, X } from "lucide-react";
import {
  HERO_LIMITS,
  HERO_LOOKS,
  defaultSettings,
  parseHomeHero,
  visibleHeroSlides,
  type HeroSlide,
  type HomeHeroSettings,
} from "@zenweld/data";
import { getHomeHero, useDatabase, useNow } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, ProductImage, Textarea } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import { useSettingsActions } from "@/lib/admin-settings";
import { useUploads } from "@/lib/admin-files";
import { HERO_PREVIEW } from "@/lib/hero-preview";

/** Ekranin taslagi: son degisiklik ani haric. */
type Draft = Omit<HomeHeroSettings, "updatedAt">;

const draftOf = (hero: HomeHeroSettings): Draft => ({ intervalSeconds: hero.intervalSeconds, slides: hero.slides });

/** Yeni sayfa: koyu atolye gorunumu, yayinda; yazilar ve gorsel bos. */
const newSlide = (): HeroSlide => ({
  id: `sayfa-${Date.now().toString(36)}`,
  active: true,
  tab: "",
  title: "",
  text: "",
  points: [],
  chips: [],
  look: "product-dark",
  image: "",
  bigWord: "",
  primary: { label: "", href: "" },
});

/**
 * PANEL › ANASAYFA TANITIM (KARARLAR K-45)
 *
 * Anasayfanin en ustundeki kayan sayfalar: sira, yazilar, maddeler,
 * etiketler, gorunum, gorsel, dugmeler, yayin tarihi ve sure. Degisiklikler
 * once taslakta durur; altta masaustu ve telefon onizlemesi (cercevede,
 * /yonetim/onizleme/tanitim). "Değişiklikleri Kaydet" ile sitede gecerli
 * olur. Veritabani modunda kayit sunucuya yazilir (lib/admin-settings.ts).
 * Kurallar: packages/data › hero-rules.ts.
 */
export function HeroClient() {
  const db = useDatabase();
  const now = useNow();
  const actions = useSettingsActions();
  const uploads = useUploads();
  const stored = getHomeHero(db);
  const [draft, setDraft] = useState<Draft>(() => draftOf(stored));
  const [selected, setSelected] = useState(0);
  const [dragged, setDragged] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kayit baska yerde degisirse taslak yenilenir; kaydedilmemis degisiklik varsa korunur.
  const storedKey = JSON.stringify(draftOf(stored));
  const [syncedKey, setSyncedKey] = useState(storedKey);
  if (syncedKey !== storedKey) {
    setSyncedKey(storedKey);
    if (JSON.stringify(draft) === syncedKey) setDraft(draftOf(stored));
  }

  const index = Math.min(selected, draft.slides.length - 1);
  const slide = draft.slides[index];
  const visible = new Set(visibleHeroSlides(draft, now).map((s) => s.id));

  const setSlides = (slides: HeroSlide[]) => setDraft((d) => ({ ...d, slides }));
  const update = (patch: Partial<HeroSlide>) =>
    setDraft((d) => ({ ...d, slides: d.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)) }));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= draft.slides.length || from === to) return;
    const slides = [...draft.slides];
    const [item] = slides.splice(from, 1);
    slides.splice(to, 0, item);
    setSlides(slides);
    setSelected(to);
  };

  const save = async () => {
    setError(null);
    setSaved(false);
    const parsed = parseHomeHero(draft);
    if (!parsed.ok) {
      const n = /^(\d+)\. sayfa/.exec(parsed.error ?? "")?.[1];
      if (n) setSelected(Number(n) - 1);
      return setError(parsed.error ?? "Bilgiler okunamadı; sayfayı yenileyip tekrar deneyin.");
    }
    const answer = await actions.saveHomeHero(parsed.value, stored);
    if (!answer.ok) return setError(answer.error);
    setDraft(parsed.value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <AdminPageHeader
        title="Anasayfa Tanıtım Alanı"
        description="Anasayfanın en üstündeki kayan sayfalar. Sayfaların sırası, yazıları, görselleri ve düğmeleri buradan değişir; kaydedince sitede hemen görünür."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<RotateCcw size={16} />}
              onClick={() => {
                setDraft(draftOf(defaultSettings.homeHero));
                setSelected(0);
              }}
            >
              Varsayılana Dön
            </Button>
            <Button disabled={actions.pending} onClick={() => void save()}>
              Değişiklikleri Kaydet
            </Button>
          </div>
        }
      />

      {saved && (
        <div className="mb-4">
          <Alert tone="success">Tanıtım alanı kaydedildi.</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          {/* Sayfalar: secim, sira, durum */}
          <AdminCard>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Sayfalar</div>
              <div className="text-xs text-zw-grey-500">Sürükleyin ya da oklarla sıralayın</div>
            </div>
            <ul className="space-y-2">
              {draft.slides.map((s, i) => {
                const status = !s.active ? "Kapalı" : visible.has(s.id) ? "Yayında" : "Tarih dışı";
                return (
                  <li
                    key={s.id}
                    draggable
                    onDragStart={() => setDragged(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragged !== null) move(dragged, i);
                      setDragged(null);
                    }}
                    onDragEnd={() => setDragged(null)}
                    className={`flex items-center gap-2 rounded-[4px] border p-2 ${
                      i === index ? "border-zw-red-600 bg-zw-red-600/5 ring-1 ring-zw-red-600" : "border-zw-grey-200"
                    } ${dragged === i ? "opacity-50" : ""}`}
                  >
                    <GripVertical size={16} aria-hidden="true" className="shrink-0 cursor-grab text-zw-grey-400" />
                    <button
                      type="button"
                      onClick={() => setSelected(i)}
                      aria-current={i === index}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left zw-focus"
                    >
                      <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[3px] bg-zw-ink">
                        {s.image && (
                          <ProductImage
                            src={s.image}
                            alt=""
                            label=""
                            className={s.look === "photo" ? "h-full w-full object-cover" : "h-full w-full object-contain p-0.5"}
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          <span className="mr-1.5 font-display text-zw-red-600">0{i + 1}</span>
                          {s.tab || "Adsız sayfa"}
                        </span>
                        <span className="block truncate text-xs text-zw-grey-500">
                          {HERO_LOOKS.find((l) => l.look === s.look)?.label}
                        </span>
                      </span>
                    </button>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        status === "Yayında"
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "Kapalı"
                            ? "bg-zw-grey-100 text-zw-grey-600"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {status}
                    </span>
                    <span className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        aria-label={`${i + 1}. sayfayı yukarı taşı`}
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        className="p-0.5 text-zw-grey-500 hover:text-zw-ink disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${i + 1}. sayfayı aşağı taşı`}
                        disabled={i === draft.slides.length - 1}
                        onClick={() => move(i, i + 1)}
                        className="p-0.5 text-zw-grey-500 hover:text-zw-ink disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              disabled={draft.slides.length >= HERO_LIMITS.maxSlides}
              onClick={() => {
                setSlides([...draft.slides, newSlide()]);
                setSelected(draft.slides.length);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[4px] border border-dashed border-zw-grey-300 py-2.5 text-sm font-semibold text-zw-grey-600 hover:border-zw-ink hover:text-zw-ink disabled:cursor-not-allowed disabled:opacity-50 zw-focus"
            >
              <Plus size={16} /> Yeni sayfa ekle
            </button>
            <p className="mt-2 text-xs text-zw-grey-500">
              En az {HERO_LIMITS.minSlides}, en fazla {HERO_LIMITS.maxSlides} sayfa. Kapalı ya da yayın tarihi dışındaki sayfa
              sitede görünmez.
            </p>
          </AdminCard>

          <AdminCard>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Genel</div>
            <FormRow label={`Her sayfanın ekranda kalma süresi — ${draft.intervalSeconds} sn`}>
              <input
                type="range"
                min={HERO_LIMITS.intervalSeconds[0]}
                max={HERO_LIMITS.intervalSeconds[1]}
                value={draft.intervalSeconds}
                onChange={(e) => setDraft((d) => ({ ...d, intervalSeconds: Number(e.target.value) }))}
                className="w-full accent-zw-red-600"
              />
            </FormRow>
            <p className="mt-2 text-xs text-zw-grey-500">Fare tanıtım alanının üzerindeyken sayfa durur. Telefonda parmakla kaydırılır.</p>
          </AdminCard>
        </div>

        {/* Secili sayfanin duzenlenmesi */}
        <AdminCard>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zw-grey-200 pb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-500">0{index + 1} · Düzenleniyor</div>
              <div className="truncate font-display text-2xl font-bold uppercase">{slide.tab || "Adsız sayfa"}</div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox label="Yayında" checked={slide.active} onChange={(e) => update({ active: e.target.checked })} />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                disabled={draft.slides.length <= HERO_LIMITS.minSlides}
                onClick={() => {
                  setSlides(draft.slides.filter((_, i) => i !== index));
                  setSelected(Math.max(0, index - 1));
                }}
              >
                Sayfayı sil
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Group title="Yazılar">
              <FormRow
                label="Sekme adı"
                required
                hint={`Alttaki sekmede yazar; telefonda başlığın üstünde görünür. ${slide.tab.length} / ${HERO_LIMITS.tab}`}
              >
                <Input value={slide.tab} maxLength={HERO_LIMITS.tab} onChange={(e) => update({ tab: e.target.value })} />
              </FormRow>
              <FormRow label="Başlık" required hint={`${slide.title.length} / ${HERO_LIMITS.title} karakter`}>
                <Input value={slide.title} maxLength={HERO_LIMITS.title} onChange={(e) => update({ title: e.target.value })} />
              </FormRow>
              <FormRow label="Metin" hint={`${slide.text.length} / ${HERO_LIMITS.text} karakter`}>
                <Textarea
                  rows={3}
                  className="min-h-0"
                  value={slide.text}
                  maxLength={HERO_LIMITS.text}
                  onChange={(e) => update({ text: e.target.value })}
                />
              </FormRow>
              <ListEditor
                label={`Maddeler (isteğe bağlı, en fazla ${HERO_LIMITS.points})`}
                hint="Başında onay işaretiyle yan yana gösterilir (Zenweld sayfasındaki gibi)."
                add="Madde ekle"
                items={slide.points}
                max={HERO_LIMITS.points}
                maxLength={HERO_LIMITS.point}
                onChange={(points) => update({ points })}
              />
              <ListEditor
                label={`Etiketler (isteğe bağlı, en fazla ${HERO_LIMITS.chips})`}
                hint="Kutucuk şeklinde gösterilir (Jasic Lazer sayfasındaki Lazer Kaynak, Lazer Temizleme, Lazer Markalama gibi); telefonda gösterilmez."
                add="Etiket ekle"
                items={slide.chips}
                max={HERO_LIMITS.chips}
                maxLength={HERO_LIMITS.chip}
                onChange={(chips) => update({ chips })}
              />
            </Group>

            <Group title="Düğmeler">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormRow label="1. düğme (kırmızı) — yazı" required>
                  <Input
                    value={slide.primary.label}
                    maxLength={HERO_LIMITS.buttonLabel}
                    onChange={(e) => update({ primary: { ...slide.primary, label: e.target.value } })}
                  />
                </FormRow>
                <FormRow label="1. düğme — bağlantı" required hint="Site içi adres (/teklif-al) ya da https://…">
                  <Input
                    value={slide.primary.href}
                    maxLength={HERO_LIMITS.href}
                    onChange={(e) => update({ primary: { ...slide.primary, href: e.target.value } })}
                  />
                </FormRow>
                <FormRow label="2. düğme (çerçeveli) — yazı" hint="Boş bırakılırsa gösterilmez.">
                  <Input
                    value={slide.secondary?.label ?? ""}
                    maxLength={HERO_LIMITS.buttonLabel}
                    onChange={(e) => update({ secondary: { href: slide.secondary?.href ?? "", label: e.target.value } })}
                  />
                </FormRow>
                <FormRow label="2. düğme — bağlantı">
                  <Input
                    value={slide.secondary?.href ?? ""}
                    maxLength={HERO_LIMITS.href}
                    onChange={(e) => update({ secondary: { label: slide.secondary?.label ?? "", href: e.target.value } })}
                  />
                </FormRow>
              </div>
            </Group>

            <Group title="Görünüm">
              <div role="radiogroup" aria-label="Görünüm" className="grid gap-2 sm:grid-cols-3">
                {HERO_LOOKS.map((look) => {
                  const on = slide.look === look.look;
                  return (
                    <button
                      key={look.look}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => update({ look: look.look })}
                      className={`rounded-[4px] border p-2 text-left zw-focus ${
                        on ? "border-zw-red-600 ring-1 ring-zw-red-600" : "border-zw-grey-200 hover:border-zw-grey-400"
                      }`}
                    >
                      <span
                        className={`block h-12 rounded-[3px] ${
                          look.look === "photo"
                            ? "bg-gradient-to-r from-zw-ink via-zw-ink/70 to-zw-grey-500"
                            : look.look === "product-dark"
                              ? "zw-steel bg-zw-grey-900"
                              : "zw-blueprint bg-[#14202c]"
                        }`}
                      />
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className={`h-3 w-3 shrink-0 rounded-full border ${on ? "border-[4px] border-zw-red-600" : "border-zw-grey-400"}`}
                        />
                        {look.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-tight text-zw-grey-500">{look.note}</span>
                    </button>
                  );
                })}
              </div>
            </Group>

            <Group title="Görsel">
              <FormRow
                label={slide.look === "photo" ? "Arka plan fotoğrafı" : "Ürün fotoğrafı"}
                required
                hint={
                  slide.look === "photo"
                    ? "Yatay, geniş bir fotoğraf; yazının arkasında koyulaştırılır."
                    : "Arka planı saydam PNG ya da WebP; en az 900 px genişlik."
                }
              >
                <ImageField
                  value={slide.image || undefined}
                  onChange={(url) => update({ image: url ?? "" })}
                  onError={setError}
                  uploadNote={uploads.imageNote}
                />
              </FormRow>
              {slide.look !== "photo" && (
                <FormRow
                  label="Arka plandaki büyük yazı"
                  hint={`İçi boş dev harfler; yalnızca geniş ekranda. Boş bırakılırsa gösterilmez. En fazla ${HERO_LIMITS.bigWord} harf.`}
                >
                  <Input
                    value={slide.bigWord}
                    maxLength={HERO_LIMITS.bigWord}
                    onChange={(e) => update({ bigWord: e.target.value })}
                  />
                </FormRow>
              )}
            </Group>

            <Group title="Yayın tarihi (isteğe bağlı)">
              <div className="grid gap-3 sm:grid-cols-2">
                <FormRow label="Başlangıç">
                  <Input
                    type="date"
                    value={slide.startsOn ?? ""}
                    onChange={(e) => update({ startsOn: e.target.value || undefined })}
                  />
                </FormRow>
                <FormRow label="Bitiş">
                  <Input type="date" value={slide.endsOn ?? ""} onChange={(e) => update({ endsOn: e.target.value || undefined })} />
                </FormRow>
              </div>
              <p className="text-xs text-zw-grey-500">
                Kampanya sayfaları için: tarih aralığı dışında sayfa kendiliğinden gizlenir (başlangıç günü 00:00 – bitiş günü 23:59).
                Boşsa her zaman görünür.
              </p>
            </Group>
          </div>
        </AdminCard>
      </div>

      <Preview draft={draft} active={index} />
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">{title}</div>
      {children}
    </div>
  );
}

/** Maddeler ve etiketler: satir satir metin; ekle ve sil. */
function ListEditor({
  label,
  hint,
  add,
  items,
  max,
  maxLength,
  onChange,
}: {
  label: string;
  hint: string;
  add: string;
  items: string[];
  max: number;
  maxLength: number;
  onChange: (items: string[]) => void;
}) {
  return (
    <FormRow label={label} hint={hint} group>
      <div className="mt-1 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <Input
              aria-label={`${label} ${i + 1}`}
              value={item}
              maxLength={maxLength}
              onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
            />
            <button
              type="button"
              aria-label={`${i + 1}. satırı sil`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] border border-zw-grey-300 text-zw-grey-600 hover:border-zw-red-600 hover:text-zw-red-600 zw-focus"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={() => onChange([...items, ""])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zw-grey-600 hover:text-zw-ink zw-focus"
          >
            <Plus size={15} /> {add}
          </button>
        )}
      </div>
    </FormRow>
  );
}

/** Ekran genislikleri: onizleme cercevesi bu boyutta acilir, sonra kucultulur. */
const DEVICES = {
  desktop: { label: "Masaüstü", Icon: Monitor, width: 1440, height: 900 },
  phone: { label: "Telefon", Icon: Smartphone, width: 390, height: 844 },
} as const;

/**
 * Onizleme: tanitim alani sitedeki haliyle, cercevede (/yonetim/onizleme/
 * tanitim) masaustu ya da telefon genisliginde. Taslak her degisiklikte
 * cerceveye mesajla gider; secili sayfa acik gelir, kendiliginden donmez.
 */
function Preview({ draft, active }: { draft: Draft; active: number }) {
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [ready, setReady] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [space, setSpace] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSpace(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: string; height?: number };
      if (data?.type === HERO_PREVIEW.ready) setReady(true);
      if (data?.type === HERO_PREVIEW.size && typeof data.height === "number") setContentHeight(data.height);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: HERO_PREVIEW.draft, hero: draft, active }, window.location.origin);
  }, [ready, draft, active]);

  const size = DEVICES[device];
  const phone = device === "phone";
  const scale = space ? Math.min(1, (phone ? Math.min(space - 12, 340) : space - 2) / size.width) : 0;
  const shownHeight = Math.round((contentHeight || size.height) * scale);

  return (
    <AdminCard className="mt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zw-grey-200 pb-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-500">
          <Eye size={15} /> Önizleme — kaydedilmemiş değişikliklerle
        </div>
        <div role="group" aria-label="Önizleme ekranı" className="flex overflow-hidden rounded-[4px] border border-zw-grey-300 text-xs font-semibold">
          {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((key) => {
            const { label, Icon } = DEVICES[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={device === key}
                onClick={() => setDevice(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 ${device === key ? "bg-zw-ink text-white" : "hover:bg-zw-grey-50"}`}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
        </div>
      </div>
      <div ref={area} className="w-full">
        <div
          className={phone ? "mx-auto w-fit rounded-[22px] border-[6px] border-zw-ink bg-zw-ink" : "w-fit rounded-[4px] border border-zw-grey-200"}
        >
          <div
            className={`relative overflow-hidden ${phone ? "rounded-[16px]" : ""}`}
            style={{ width: Math.round(size.width * scale), height: shownHeight }}
          >
            <iframe
              ref={frame}
              src={HERO_PREVIEW.path}
              title="Tanıtım alanı önizlemesi"
              className="absolute left-0 top-0 origin-top-left border-0"
              style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zw-grey-500">
        Önizlemede seçili sayfa açık gelir ve kendiliğinden dönmez; sekmeler ve oklarla diğer sayfalara geçilebilir. Kapalı sayfalar da
        önizlemede görünür.
      </p>
    </AdminCard>
  );
}

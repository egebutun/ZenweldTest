"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import type { Product, TopLevelSection, WeldingProcess } from "@zenweld/data";
import { createProduct, saveProduct, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, Checkbox, FormRow, Input, Select, Tabs, Textarea } from "@zenweld/ui";
import { ProductImage } from "@/components/common/ProductImage";
import { useHref } from "@/lib/i18n-client";
import { priceWithVat } from "@/lib/format";

const PROCESSES: WeldingProcess[] = ["MULTI", "MIG", "MAG", "PULSE", "TIG", "MMA", "PLAZMA"];
const SECTIONS: { id: TopLevelSection; label: string }[] = [
  { id: "ekipmanlar", label: "Ekipmanlar" },
  { id: "guvenlik", label: "Güvenlik" },
  { id: "aksesuarlar", label: "Aksesuarlar" },
  { id: "dolgu-metalleri", label: "Dolgu Metalleri" },
];

const slugify = (value: string) =>
  value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function ProductForm({ product }: { product?: Product }) {
  const db = useDatabase();
  const router = useRouter();
  const href = useHref();
  const isNew = !product;

  const [tab, setTab] = useState("temel");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [draft, setDraft] = useState<Product>(
    product ?? {
      id: "",
      slug: "",
      sku: "",
      name: "",
      section: "ekipmanlar",
      categorySlug: db.categories[0]?.slug ?? "",
      processes: [],
      shortDescription: { tr: "", en: "" },
      description: { tr: "", en: "" },
      priceExVat: 0,
      vatRate: 20,
      currency: "TRY",
      images: [],
      specs: [],
      inTheBox: [],
      highlights: [],
      inStock: true,
      quotable: true,
      featured: false,
      isNew: true,
      warrantyMonths: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
    },
  );

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const categories = db.categories.filter((c) => c.section === draft.section);

  const onFileUpload = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 1_500_000) {
        setError(
          `${file.name} çok büyük (>1.5 MB). Tarayıcı deposu sınırlı olduğu için küçük dosya kullanın veya URL girin.`,
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setDraft((d) => ({
          ...d,
          images: [
            ...d.images,
            { url: String(reader.result), alt: { tr: d.name, en: d.name } },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!draft.name.trim()) {
      setError("Ürün adı zorunludur.");
      setTab("temel");
      return;
    }

    const slug = draft.slug.trim() || slugify(draft.name);
    const clash = db.products.find((p) => p.slug === slug && p.id !== draft.id);
    if (clash) {
      setError(`"${slug}" adresi başka bir üründe kullanılıyor.`);
      setTab("temel");
      return;
    }

    if (isNew) {
      const created = createProduct({ ...draft, slug });
      router.push(href(`/admin/urunler/${created.id}`));
    } else {
      saveProduct({ ...draft, slug });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Alert tone="success">Ürün kaydedildi.</Alert>
        </div>
      )}

      <Tabs
        className="mb-6"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "temel", label: "Temel Bilgiler" },
          { id: "aciklama", label: "Açıklamalar" },
          { id: "gorseller", label: "Görseller", badge: draft.images.length },
          { id: "teknik", label: "Teknik Özellikler", badge: draft.specs.length },
          { id: "kutu", label: "Kutu İçeriği", badge: draft.inTheBox.length },
        ]}
      />

      {tab === "temel" && (
        <div className="space-y-4 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Ürün Adı" required>
              <Input
                required
                value={draft.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <FormRow label="URL (slug)" hint={`/urun/${draft.slug || "…"}`}>
              <Input value={draft.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormRow label="Ürün Kodu (SKU)" required>
              <Input required value={draft.sku} onChange={(e) => set("sku", e.target.value)} />
            </FormRow>
            <FormRow label="Model Kodu">
              <Input
                value={draft.modelCode ?? ""}
                onChange={(e) => set("modelCode", e.target.value)}
              />
            </FormRow>
            <FormRow label="Garanti (ay)">
              <Input
                type="number"
                value={draft.warrantyMonths}
                onChange={(e) => set("warrantyMonths", Number(e.target.value))}
              />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Bölüm">
              <Select
                value={draft.section}
                onChange={(e) => {
                  const section = e.target.value as TopLevelSection;
                  const first = db.categories.find((c) => c.section === section);
                  setDraft((d) => ({
                    ...d,
                    section,
                    categorySlug: first?.slug ?? d.categorySlug,
                  }));
                }}
              >
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Kategori">
              <Select
                value={draft.categorySlug}
                onChange={(e) => set("categorySlug", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name.tr}
                  </option>
                ))}
              </Select>
            </FormRow>
          </div>

          <FormRow label="Kaynak Yöntemleri">
            <div className="flex flex-wrap gap-2">
              {PROCESSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    set(
                      "processes",
                      draft.processes.includes(p)
                        ? draft.processes.filter((x) => x !== p)
                        : [...draft.processes, p],
                    )
                  }
                  className={`rounded-[3px] border px-3 py-1.5 text-sm font-semibold transition-colors ${
                    draft.processes.includes(p)
                      ? "border-zw-red-600 bg-zw-red-50 text-zw-red-700"
                      : "border-zw-grey-300 text-zw-grey-600 hover:border-zw-ink"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormRow label="Fiyat (KDV hariç, ₺)" required>
              <Input
                type="number"
                required
                min={0}
                value={draft.priceExVat}
                onChange={(e) => set("priceExVat", Number(e.target.value))}
              />
            </FormRow>
            <FormRow label="KDV (%)">
              <Input
                type="number"
                value={draft.vatRate}
                onChange={(e) => set("vatRate", Number(e.target.value))}
              />
            </FormRow>
            <FormRow label="KDV dahil">
              <Input
                disabled
                value={priceWithVat(draft.priceExVat, draft.vatRate).toLocaleString("tr-TR")}
              />
            </FormRow>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Checkbox
              label="Yayında (aktif)"
              checked={draft.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            <Checkbox
              label="Zenweld deposunda stokta"
              checked={draft.inStock}
              onChange={(e) => set("inStock", e.target.checked)}
            />
            <Checkbox
              label="Teklife açık"
              checked={draft.quotable}
              onChange={(e) => set("quotable", e.target.checked)}
            />
            <Checkbox
              label="Öne çıkan"
              checked={draft.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            <Checkbox
              label="Yeni ürün rozeti"
              checked={draft.isNew}
              onChange={(e) => set("isNew", e.target.checked)}
            />
          </div>

          <FormRow label="Kullanım Kılavuzu (PDF bağlantısı)">
            <Input
              value={draft.manualUrl ?? ""}
              onChange={(e) => set("manualUrl", e.target.value)}
              placeholder="https://…"
            />
          </FormRow>
        </div>
      )}

      {tab === "aciklama" && (
        <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          {(["tr", "en"] as const).map((lang) => (
            <div key={lang} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge tone="dark">{lang.toUpperCase()}</Badge>
                <span className="text-sm font-semibold text-zw-grey-600">
                  {lang === "tr" ? "Türkçe içerik" : "İngilizce içerik"}
                </span>
              </div>
              <FormRow label="Kısa Açıklama">
                <Textarea
                  className="min-h-20"
                  value={draft.shortDescription[lang]}
                  onChange={(e) =>
                    set("shortDescription", {
                      ...draft.shortDescription,
                      [lang]: e.target.value,
                    })
                  }
                />
              </FormRow>
              <FormRow label="Detaylı Açıklama">
                <Textarea
                  className="min-h-40"
                  value={draft.description[lang]}
                  onChange={(e) =>
                    set("description", { ...draft.description, [lang]: e.target.value })
                  }
                />
              </FormRow>
            </div>
          ))}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                Öne Çıkan Özellikler
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                leftIcon={<Plus size={14} />}
                onClick={() =>
                  set("highlights", [...draft.highlights, { tr: "", en: "" }])
                }
              >
                Ekle
              </Button>
            </div>
            <div className="space-y-2">
              {draft.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="TR"
                    value={h.tr}
                    onChange={(e) => {
                      const next = [...draft.highlights];
                      next[i] = { ...next[i], tr: e.target.value };
                      set("highlights", next);
                    }}
                  />
                  <Input
                    placeholder="EN"
                    value={h.en}
                    onChange={(e) => {
                      const next = [...draft.highlights];
                      next[i] = { ...next[i], en: e.target.value };
                      set("highlights", next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => set("highlights", draft.highlights.filter((_, x) => x !== i))}
                    className="shrink-0 px-2 text-zw-grey-400 hover:text-zw-red-600"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "gorseller" && (
        <div className="space-y-5 rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <Alert tone="info">
            Görsel URL&apos;si girebilir veya dosya yükleyebilirsiniz. Yüklenen dosyalar tarayıcı
            deposunda saklandığı için 1.5 MB altında olmalıdır. İlk görsel kapak görselidir.
          </Alert>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="https://images.unsplash.com/…"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              leftIcon={<ImagePlus size={16} />}
              onClick={() => {
                if (!imageUrlInput.trim()) return;
                set("images", [
                  ...draft.images,
                  { url: imageUrlInput.trim(), alt: { tr: draft.name, en: draft.name } },
                ]);
                setImageUrlInput("");
              }}
            >
              URL Ekle
            </Button>
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold hover:border-zw-ink">
              <Upload size={16} />
              Dosya Yükle
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  onFileUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {draft.images.map((img, i) => (
              <div key={i} className="rounded-[4px] border border-zw-grey-200 p-2">
                <div className="relative aspect-square overflow-hidden rounded-[3px] bg-zw-grey-50">
                  <ProductImage
                    src={img.url}
                    alt={img.alt.tr}
                    label={draft.name}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && (
                    <Badge tone="red" className="absolute left-1.5 top-1.5">
                      Kapak
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => {
                      const next = [...draft.images];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      set("images", next);
                    }}
                    className="flex-1 rounded-[3px] border border-zw-grey-300 py-1 text-xs disabled:opacity-40"
                  >
                    <GripVertical size={13} className="mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => set("images", draft.images.filter((_, x) => x !== i))}
                    className="flex-1 rounded-[3px] border border-zw-grey-300 py-1 text-xs text-zw-red-600 hover:border-zw-red-600"
                  >
                    <Trash2 size={13} className="mx-auto" />
                  </button>
                </div>
              </div>
            ))}
            {draft.images.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-zw-grey-500">
                Henüz görsel eklenmedi. Görsel yoksa markalı Zenweld placeholder gösterilir.
              </p>
            )}
          </div>
        </div>
      )}

      {tab === "teknik" && (
        <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-zw-grey-600">
              Teknik özellik satırları
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Plus size={14} />}
              onClick={() =>
                set("specs", [
                  ...draft.specs,
                  { label: { tr: "", en: "" }, value: { tr: "", en: "" } },
                ])
              }
            >
              Satır Ekle
            </Button>
          </div>

          <div className="space-y-2">
            {draft.specs.map((row, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <div className="grid gap-1">
                  <Input
                    placeholder="Özellik (TR)"
                    value={row.label.tr}
                    onChange={(e) => {
                      const next = [...draft.specs];
                      next[i] = { ...next[i], label: { ...next[i].label, tr: e.target.value } };
                      set("specs", next);
                    }}
                  />
                  <Input
                    placeholder="Özellik (EN)"
                    value={row.label.en}
                    onChange={(e) => {
                      const next = [...draft.specs];
                      next[i] = { ...next[i], label: { ...next[i].label, en: e.target.value } };
                      set("specs", next);
                    }}
                  />
                </div>
                <div className="grid gap-1">
                  <Input
                    placeholder="Değer (TR)"
                    value={row.value.tr}
                    onChange={(e) => {
                      const next = [...draft.specs];
                      next[i] = { ...next[i], value: { ...next[i].value, tr: e.target.value } };
                      set("specs", next);
                    }}
                  />
                  <Input
                    placeholder="Değer (EN)"
                    value={row.value.en}
                    onChange={(e) => {
                      const next = [...draft.specs];
                      next[i] = { ...next[i], value: { ...next[i].value, en: e.target.value } };
                      set("specs", next);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set("specs", draft.specs.filter((_, x) => x !== i))}
                  className="self-start px-2 py-2 text-zw-grey-400 hover:text-zw-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "kutu" && (
        <div className="rounded-[4px] border border-zw-grey-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-zw-grey-600">Kutu içeriği maddeleri</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Plus size={14} />}
              onClick={() => set("inTheBox", [...draft.inTheBox, { tr: "", en: "" }])}
            >
              Madde Ekle
            </Button>
          </div>
          <div className="space-y-2">
            {draft.inTheBox.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="TR"
                  value={item.tr}
                  onChange={(e) => {
                    const next = [...draft.inTheBox];
                    next[i] = { ...next[i], tr: e.target.value };
                    set("inTheBox", next);
                  }}
                />
                <Input
                  placeholder="EN"
                  value={item.en}
                  onChange={(e) => {
                    const next = [...draft.inTheBox];
                    next[i] = { ...next[i], en: e.target.value };
                    set("inTheBox", next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => set("inTheBox", draft.inTheBox.filter((_, x) => x !== i))}
                  className="shrink-0 px-2 text-zw-grey-400 hover:text-zw-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-zw-grey-200 bg-zw-grey-50 py-4">
        <Button type="submit" size="lg">
          {isNew ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}

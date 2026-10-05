"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  about as defaultAbout,
  type AboutContent,
  type AboutSection,
  type I18nText,
} from "@zenweld/data";
import { saveAbout, uid, useDatabase } from "@zenweld/store";
import { Alert, Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { formatDateTime } from "@zenweld/utils";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { ImageField } from "@/components/admin/ImageField";
import { siteUrl } from "@/lib/admin-links";

/** TR ve EN alanlarini yan yana gosteren cift alan. */
function I18nInput({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string;
  value: I18nText;
  onChange: (value: I18nText) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const Field = multiline ? Textarea : Input;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(["tr", "en"] as const).map((lang) => (
        <FormRow
          key={lang}
          label={`${label} (${lang.toUpperCase()})`}
          required={required && lang === "tr"}
          hint={lang === "en" ? "Boş bırakılırsa Türkçe metin gösterilir" : undefined}
        >
          <Field
            value={value[lang]}
            rows={multiline ? 9 : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange({ ...value, [lang]: e.target.value })
            }
          />
        </FormRow>
      ))}
    </div>
  );
}

const emptySection = (): AboutSection => ({
  id: uid("a"),
  title: { tr: "", en: "" },
  body: { tr: "", en: "" },
});

/**
 * HAKKIMIZDA SAYFASI DUZENLEYICI
 *
 * Ust baslik, rakam kutulari ve sirali metin bolumleri. "Kaydet" denince
 * sitedeki /tr/hakkimizda ve /en/about-us sayfalari guncellenir.
 */
export default function AdminAboutPage() {
  const db = useDatabase();
  const [draft, setDraft] = useState<AboutContent>(() => db.about ?? defaultAbout);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<AboutContent>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setSaved(false);
  };
  const updateSection = (id: string, patch: Partial<AboutSection>) =>
    update({ sections: draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...draft.sections];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    update({ sections: next });
  };

  const save = () => {
    setError(null);
    if (!draft.heroTitle.tr.trim()) {
      setError("Sayfa başlığı (TR) zorunludur.");
      return;
    }
    // Ingilizce bos birakildiysa Turkce kullanilir.
    const fill = (t: I18nText): I18nText => ({ tr: t.tr, en: t.en.trim() || t.tr });
    saveAbout({
      ...draft,
      heroTitle: fill(draft.heroTitle),
      heroSubtitle: fill(draft.heroSubtitle),
      stats: draft.stats.filter((s) => s.value.trim()).map((s) => ({ ...s, label: fill(s.label) })),
      sections: draft.sections.map((s) => ({ ...s, title: fill(s.title), body: fill(s.body) })),
    });
    setDirty(false);
    setSaved(true);
  };

  return (
    <>
      <AdminPageHeader
        title="Hakkımızda"
        description={`Son kayıt: ${formatDateTime((db.about ?? defaultAbout).updatedAt, "tr")}`}
        action={
          <div className="flex items-center gap-3">
            <a
              href={siteUrl("/hakkimizda")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zw-red-600 hover:underline"
            >
              Sayfayı gör <ExternalLink size={14} />
            </a>
            <Button onClick={save} disabled={!dirty}>
              Kaydet
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Alert tone="success">Kaydedildi. Hakkımızda sayfası güncellendi.</Alert>
        </div>
      )}
      {dirty && (
        <div className="mb-4">
          <Alert tone="warning">Kaydedilmemiş değişiklikler var.</Alert>
        </div>
      )}

      <div className="space-y-6">
        <AdminCard>
          <h2 className="mb-4 font-display text-xl font-bold uppercase">Sayfa Başlığı</h2>
          <div className="space-y-4">
            <I18nInput
              label="Başlık"
              required
              value={draft.heroTitle}
              onChange={(heroTitle) => update({ heroTitle })}
            />
            <I18nInput
              label="Alt başlık"
              value={draft.heroSubtitle}
              onChange={(heroSubtitle) => update({ heroSubtitle })}
            />
            <FormRow label="Arka plan görseli">
              <ImageField
                value={draft.heroImage}
                onChange={(heroImage) => update({ heroImage })}
                onError={setError}
              />
            </FormRow>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase">Rakamlar</h2>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus size={14} />}
              onClick={() =>
                update({
                  stats: [...draft.stats, { id: uid("s"), value: "", label: { tr: "", en: "" } }],
                })
              }
            >
              Rakam ekle
            </Button>
          </div>
          <div className="space-y-3">
            {draft.stats.map((s) => (
              <div key={s.id} className="grid items-end gap-3 md:grid-cols-[120px_1fr_1fr_auto]">
                <FormRow label="Değer">
                  <Input
                    value={s.value}
                    placeholder="25+"
                    onChange={(e) =>
                      update({
                        stats: draft.stats.map((x) =>
                          x.id === s.id ? { ...x, value: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </FormRow>
                {(["tr", "en"] as const).map((lang) => (
                  <FormRow key={lang} label={`Açıklama (${lang.toUpperCase()})`}>
                    <Input
                      value={s.label[lang]}
                      onChange={(e) =>
                        update({
                          stats: draft.stats.map((x) =>
                            x.id === s.id ? { ...x, label: { ...x.label, [lang]: e.target.value } } : x,
                          ),
                        })
                      }
                    />
                  </FormRow>
                ))}
                <button
                  type="button"
                  onClick={() => update({ stats: draft.stats.filter((x) => x.id !== s.id) })}
                  className="mb-1 rounded-[3px] p-2 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-red-600"
                  aria-label="Rakamı sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {draft.stats.length === 0 && (
              <p className="text-sm text-zw-grey-500">Rakam yok; sayfada bu alan gösterilmez.</p>
            )}
          </div>
        </AdminCard>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase">Bölümler</h2>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => update({ sections: [...draft.sections, emptySection()] })}
          >
            Bölüm ekle
          </Button>
        </div>
        <p className="-mt-3 text-xs text-zw-grey-500">
          Metinde <code>## Ara başlık</code>, <code>- madde</code> ve <code>**kalın**</code>{" "}
          kullanılabilir. Boş satır yeni paragraf başlatır. Görseli olan bölümler sitede metin ve
          görsel yan yana gösterilir.
        </p>

        {draft.sections.map((section, i) => (
          <AdminCard key={section.id}>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-display text-lg font-bold uppercase text-zw-grey-500">
                Bölüm {i + 1}
              </span>
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => moveSection(i, -1)}
                  className="rounded-[3px] p-1.5 text-zw-grey-600 hover:bg-zw-grey-100 disabled:opacity-30"
                  aria-label="Yukarı taşı"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={i === draft.sections.length - 1}
                  onClick={() => moveSection(i, 1)}
                  className="rounded-[3px] p-1.5 text-zw-grey-600 hover:bg-zw-grey-100 disabled:opacity-30"
                  aria-label="Aşağı taşı"
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Bu bölüm silinsin mi?")) {
                      update({ sections: draft.sections.filter((s) => s.id !== section.id) });
                    }
                  }}
                  className="rounded-[3px] p-1.5 text-zw-grey-600 hover:bg-zw-grey-100 hover:text-zw-red-600"
                  aria-label="Bölümü sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <I18nInput
                label="Başlık"
                value={section.title}
                onChange={(title) => updateSection(section.id, { title })}
              />
              <I18nInput
                label="Metin"
                multiline
                value={section.body}
                onChange={(body) => updateSection(section.id, { body })}
              />
              <FormRow label="Görsel (isteğe bağlı)">
                <ImageField
                  value={section.imageUrl}
                  onChange={(imageUrl) => updateSection(section.id, { imageUrl })}
                  onError={setError}
                />
              </FormRow>
            </div>
          </AdminCard>
        ))}

        {draft.sections.length === 0 && (
          <p className="rounded-[4px] border border-dashed border-zw-grey-300 px-4 py-10 text-center text-sm text-zw-grey-500">
            Henüz bölüm yok. “Bölüm ekle” ile başlayın.
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty} size="lg">
            Kaydet
          </Button>
        </div>
      </div>
    </>
  );
}

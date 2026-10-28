"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { byProductOrder, type Category, type CategoryGroup, type TopLevelSection } from "@zenweld/data";
import {
  createCategory,
  createGroup,
  saveCategory,
  saveGroup,
  useDatabase,
} from "@zenweld/store";
import { FormRow, Input, Select, Textarea } from "@zenweld/ui";
import { slugify } from "@zenweld/utils";
import { SECTION_TITLES, categoryHref, groupDescription, groupHref, sectionGroups } from "@/lib/catalog";
import { categorySeo, groupSeo } from "@/lib/seo";
import {
  ContentFormShell,
  ContentTextFields,
  EMPTY_SLUG_ERROR,
  FormPanel,
  SingleImageField,
  findSlugClash,
  resolveSlug,
  useContentForm,
} from "./content-form";
import { SeoPanel } from "./SeoPanel";
import { CategoryOptionsPanel } from "./CategoryOptions";
import { CategoryFiltersPanel, filtersError, type FilterMapping } from "./CategoryFilters";
import { siteUrl } from "@/lib/admin-links";

/**
 * KATEGORI VE GRUP FORMLARI (Urunler > Kategoriler)
 *
 * Sekmeler: Temel Bilgiler (ad, grup/bolum, kisa aciklama, kart gorseli),
 * Tanitim Metni (sayfanin altindaki "... Hakkinda" yazisi), yalnizca
 * kategoride Seçenekler (urune secenek eklerken listelenen ortak tanimlar) ve
 * Filtreler (kategori sayfasindaki filtreler ve urunlerin degerleri), SEO.
 */

const SECTIONS = Object.keys(SECTION_TITLES) as TopLevelSection[];

const TABS = [
  { id: "temel", label: "Temel Bilgiler" },
  { id: "tanitim", label: "Tanıtım Metni" },
  { id: "seo", label: "SEO" },
];

const ABOUT_INTRO =
  "Tanıtım metni sayfanın altında \"… Hakkında\" başlığıyla görünür; boş bırakılırsa gösterilmez.";

/* ------------------------------------------------------------------ */
/* Kategori                                                            */
/* ------------------------------------------------------------------ */

export function CategoryForm({ category, groupId }: { category?: Category; groupId?: string }) {
  const db = useDatabase();
  const router = useRouter();
  const isNew = !category;
  const startGroup = db.categoryGroups.find((g) => g.id === groupId) ?? db.categoryGroups[0];
  const form = useContentForm<Category>(
    category ?? {
      id: "",
      slug: "",
      section: startGroup?.section ?? "ekipmanlar",
      group: startGroup?.slug ?? "",
      name: "",
      description: "",
      order: 0,
    },
  );
  const { draft, set } = form;
  const stored = category && db.categories.find((c) => c.id === category.id);
  const currentGroup = db.categoryGroups.find((g) => g.section === draft.section && g.slug === draft.group);
  // Filtreler sekmesindeki eslesme tablosunda degisen urunler; Kaydet ile yazilir.
  const [mapping, setMapping] = useState<FilterMapping>({});
  const products = useMemo(
    () => (stored ? db.products.filter((p) => p.categorySlug === stored.slug).sort(byProductOrder) : []),
    [db, stored],
  );

  const submit = () => {
    form.setError(null);
    if (!draft.name.trim()) return form.fail("Kategori adı zorunludur.");
    if (!currentGroup) return form.fail("Bir grup seçin.");

    const slug = resolveSlug(draft.slug, draft.name);
    if (!slug) return form.fail(EMPTY_SLUG_ERROR, "seo");
    // Urunler kategoriye yalnizca link (slug) ile baglidir; link tekil olmali.
    const clash = findSlugClash(db.categories, draft.id, slug);
    if (clash) return form.fail(`"${slug}" linki "${clash.name}" kategorisinde kullanılıyor.`, "seo");

    // Form acikken silinmis tanim kayda geri yazilmasin.
    const optionIds = (draft.optionIds ?? []).filter((id) => db.optionDefinitions.some((o) => o.id === id));
    const filterProblem = filtersError(draft.filters ?? []);
    if (filterProblem) return form.fail(filterProblem, "filtreler");
    const filters = (draft.filters ?? []).map((f) => ({
      ...f,
      name: f.name.trim(),
      values: f.values.map((v) => ({ ...v, label: v.label.trim() })),
    }));
    const next: Category = {
      ...draft,
      slug,
      name: draft.name.trim(),
      optionIds: optionIds.length ? optionIds : undefined,
      filters: filters.length ? filters : undefined,
    };
    if (isNew) {
      router.push(`/yonetim/kategoriler/${createCategory(next).id}`);
    } else {
      saveCategory(next, mapping);
      setMapping({});
      form.flashSaved();
    }
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
      savedText="Kategori kaydedildi."
      submitLabel={isNew ? "Kategoriyi Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        ...TABS.slice(0, 2),
        { id: "secenekler", label: "Seçenekler", badge: draft.optionIds?.length || undefined },
        { id: "filtreler", label: "Filtreler", badge: draft.filters?.length || undefined },
        TABS[2],
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Kategori linki SEO sekmesinde; yeni kategoride addan otomatik olusur. */}
            <FormRow label="Kategori Adı" required>
              <Input
                required
                value={draft.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <FormRow
              label="Grup"
              hint={isNew ? undefined : "Grup değişirse kategorinin linki de değişir; eski link yeni linke yönlenir."}
            >
              <Select
                value={currentGroup?.id ?? ""}
                onChange={(e) => {
                  const group = db.categoryGroups.find((g) => g.id === e.target.value);
                  if (group) form.setDraft((d) => ({ ...d, section: group.section, group: group.slug }));
                }}
              >
                {SECTIONS.map((section) => (
                  <optgroup key={section} label={SECTION_TITLES[section]}>
                    {sectionGroups(section, db.categoryGroups).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </FormRow>
          </div>

          <FormRow label="Kısa Açıklama" hint="Sayfanın başlığının altında ve grup sayfasındaki kartta görünür.">
            <Textarea
              className="min-h-20"
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </FormRow>

          <CardImageField
            value={draft.image ?? ""}
            onChange={(url) => set("image", url || undefined)}
            onError={form.setError}
            alt={draft.name}
            fallback="Görsel yoksa kategorideki ilk ürünün fotoğrafı kullanılır."
          />
        </FormPanel>
      )}

      {form.tab === "tanitim" && (
        <ContentTextFields
          intro={ABOUT_INTRO}
          fields={[{ key: "aboutText", label: "Tanıtım Metni", tall: true }]}
          values={{ aboutText: draft.aboutText ?? "" }}
          onChange={(_, value) => set("aboutText", value || undefined)}
        />
      )}

      {form.tab === "secenekler" && (
        <CategoryOptionsPanel
          selected={draft.optionIds ?? []}
          onChange={(ids) => set("optionIds", ids)}
          categorySlug={stored?.slug}
        />
      )}

      {form.tab === "filtreler" && (
        <CategoryFiltersPanel
          filters={draft.filters ?? []}
          onChange={(filters) => set("filters", filters)}
          products={products}
          mapping={mapping}
          onMappingChange={setMapping}
        />
      )}

      {form.tab === "seo" && (
        <SeoPanel
          noun="Kategori"
          path={`/${draft.section}/${draft.group}`}
          slug={draft.slug}
          onSlugChange={(v) => set("slug", v)}
          storedLink={stored && categoryHref(stored)}
          previousLinks={stored?.previousPaths}
          value={draft.seo}
          onChange={(seo) => set("seo", seo)}
          compute={(seo) => categorySeo({ ...draft, seo })}
          descriptionFallback="kategorinin kısa açıklaması"
        />
      )}
    </ContentFormShell>
  );
}

/* ------------------------------------------------------------------ */
/* Grup                                                                */
/* ------------------------------------------------------------------ */

export function GroupForm({ group, section }: { group?: CategoryGroup; section?: TopLevelSection }) {
  const db = useDatabase();
  const router = useRouter();
  const isNew = !group;
  const form = useContentForm<CategoryGroup>(
    group ?? { id: "", slug: "", section: section ?? "ekipmanlar", name: "", order: 0 },
  );
  const { draft, set } = form;
  const stored = group && db.categoryGroups.find((g) => g.id === group.id);
  // Kayitli grubun kategorileri (yeni grupta yok); otomatik aciklama bunlardan.
  const autoDescription = groupDescription({ ...draft, slug: stored?.slug ?? draft.slug, description: undefined }, db.categories);

  const submit = () => {
    form.setError(null);
    if (!draft.name.trim()) return form.fail("Grup adı zorunludur.");

    const slug = resolveSlug(draft.slug, draft.name);
    if (!slug) return form.fail(EMPTY_SLUG_ERROR, "seo");
    // Grup linki yalnizca kendi bolumunde tekil olmali.
    const clash = findSlugClash(db.categoryGroups.filter((g) => g.section === draft.section), draft.id, slug);
    if (clash) return form.fail(`"${slug}" linki bu bölümde "${clash.name}" grubunda kullanılıyor.`, "seo");

    const next: CategoryGroup = {
      ...draft,
      slug,
      name: draft.name.trim(),
      description: draft.description?.trim() || undefined,
    };
    if (isNew) {
      router.push(`/yonetim/kategoriler/grup/${createGroup(next).id}`);
    } else {
      saveGroup(next);
      form.flashSaved();
    }
  };

  return (
    <ContentFormShell
      form={form}
      onSubmit={submit}
      savedText="Grup kaydedildi."
      submitLabel={isNew ? "Grubu Oluştur" : "Değişiklikleri Kaydet"}
      tabs={TABS}
    >
      {form.tab === "temel" && (
        <FormPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Grup linki SEO sekmesinde; yeni grupta addan otomatik olusur. */}
            <FormRow label="Grup Adı" required>
              <Input
                required
                value={draft.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (isNew) set("slug", slugify(e.target.value));
                }}
              />
            </FormRow>
            <FormRow label="Bölüm" hint={isNew ? undefined : "Kayıtlı grubun bölümü değiştirilemez."}>
              <Select
                value={draft.section}
                disabled={!isNew}
                onChange={(e) => set("section", e.target.value as TopLevelSection)}
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {SECTION_TITLES[s]}
                  </option>
                ))}
              </Select>
            </FormRow>
          </div>

          <FormRow
            label="Kısa Açıklama"
            hint="Grup sayfasının başlığının altında görünür. Boş bırakılırsa kategori adlarından oluşturulur (gri yazı)."
          >
            <Textarea
              className="min-h-20"
              value={draft.description ?? ""}
              placeholder={autoDescription}
              onChange={(e) => set("description", e.target.value)}
            />
          </FormRow>

          <CardImageField
            value={draft.image ?? ""}
            onChange={(url) => set("image", url || undefined)}
            onError={form.setError}
            alt={draft.name}
            fallback="Görsel yoksa gruptaki ilk ürünün fotoğrafı kullanılır."
          />
        </FormPanel>
      )}

      {form.tab === "tanitim" && (
        <ContentTextFields
          intro={`${ABOUT_INTRO} Grup sayfasında kategori kartlarının altında durur.`}
          fields={[{ key: "aboutText", label: "Tanıtım Metni", tall: true }]}
          values={{ aboutText: draft.aboutText ?? "" }}
          onChange={(_, value) => set("aboutText", value || undefined)}
        />
      )}

      {form.tab === "seo" && (
        <SeoPanel
          noun="Grup"
          path={`/${draft.section}`}
          slug={draft.slug}
          onSlugChange={(v) => set("slug", v)}
          storedLink={stored && groupHref(stored)}
          previousLinks={stored?.previousPaths}
          value={draft.seo}
          onChange={(seo) => set("seo", seo)}
          compute={(seo) => groupSeo({ ...draft, seo }, draft.description?.trim() || autoDescription)}
          descriptionFallback="grubun kısa açıklaması"
          linkNote="Gruptaki kategorilerin linkleri de değişir; onların eski linkleri de yeni linklere yönlenir."
        />
      )}
    </ContentFormShell>
  );
}

/** Grup/bolum sayfasindaki kartin gorseli. */
function CardImageField({
  value,
  onChange,
  onError,
  alt,
  fallback,
}: {
  value: string;
  onChange: (url: string) => void;
  onError: (message: string) => void;
  alt: string;
  fallback: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">Kart Görseli</div>
      <SingleImageField
        value={value}
        onChange={onChange}
        onError={onError}
        alt={alt}
        placeholder="/images/categories/kategori.svg veya https://…"
        previewClassName="flex h-28 w-40 items-center justify-center bg-white p-2"
        imageClassName="max-h-full max-w-full object-contain"
      />
      <p className="mt-1 text-xs text-zw-grey-500">{fallback}</p>
    </div>
  );
}

/** Duzenleme ekraninin ustundeki "Sayfayi gor" baglantisi. */
export function SiteLink({ href }: { href: string }) {
  return (
    <a
      href={siteUrl(href)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-semibold text-zw-red-600 hover:underline"
    >
      Sayfayı gör ↗
    </a>
  );
}

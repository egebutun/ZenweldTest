"use client";

import { DEFAULT_BRAND, type TopLevelSection } from "@zenweld/data";
import { useDatabase } from "@zenweld/store";
import { Checkbox, FormRow, Input, Select } from "@zenweld/ui";
import { priceWithVat, slugify } from "@zenweld/utils";
import { FormPanel } from "../content-form";
import { DiscountFields } from "./DiscountFields";
import type { ProductTabProps } from "./types";

const SECTIONS: { id: TopLevelSection; label: string }[] = [
  { id: "ekipmanlar", label: "Ekipmanlar" },
  { id: "guvenlik", label: "Güvenlik" },
  { id: "aksesuarlar", label: "Aksesuarlar" },
  { id: "dolgu-metalleri", label: "Dolgu Metalleri" },
];

/** Temel Bilgiler sekmesi: ad, kodlar, marka, bolum/kategori, fiyat, kampanya, durum. */
export function BasicsTab({ isNew, ...props }: ProductTabProps & { isNew: boolean }) {
  const { draft, set, setDraft } = props;
  const db = useDatabase();
  const categories = db.categories.filter((c) => c.section === draft.section);

  return (
    <FormPanel>
      {/* Urun linki SEO sekmesinde; yeni urunde addan otomatik olusur. */}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormRow label="Ürün Kodu (SKU)" required>
          <Input required value={draft.sku} onChange={(e) => set("sku", e.target.value)} />
        </FormRow>
        <FormRow label="Model Kodu">
          <Input
            value={draft.modelCode ?? ""}
            onChange={(e) => set("modelCode", e.target.value)}
          />
        </FormRow>
        <FormRow label="Marka" hint={`Boşsa ${DEFAULT_BRAND}; arama motorlarına bu marka gider`}>
          <Input
            value={draft.brand ?? ""}
            placeholder={DEFAULT_BRAND}
            onChange={(e) => set("brand", e.target.value)}
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

      <div className="grid gap-4 sm:grid-cols-3">
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
                {c.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow
          label="Sıra"
          hint="Kategori sayfasında kaçıncı görünür (1 en başta). Boşsa kategorinin sonuna eklenir."
        >
          <Input
            type="number"
            min={1}
            value={draft.order ?? ""}
            onChange={(e) =>
              set("order", e.target.value === "" ? undefined : Math.max(1, Math.floor(Number(e.target.value)) || 1))
            }
          />
        </FormRow>
      </div>


      <div className="grid gap-4 sm:grid-cols-3">
        <FormRow label="Normal fiyat (KDV hariç, ₺)" required hint="İndirimsiz fiyat">

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

      <DiscountFields {...props} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Checkbox
          label="Yayında (aktif)"
          checked={draft.active}
          onChange={(e) => set("active", e.target.checked)}
        />
        <Checkbox
          label="Teklife açık"
          checked={draft.quotable}
          onChange={(e) => set("quotable", e.target.checked)}
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
    </FormPanel>
  );
}

"use client";

import type { Category, CategoryGroup, OptionDefinition, Product, ProductFilterValues } from "@zenweld/data";
import {
  createCategory,
  createGroup,
  deleteCategory,
  deleteGroup,
  deleteOptionDefinition,
  moveCategory,
  moveGroup,
  saveCategory,
  saveGroup,
  saveOptionDefinition,
} from "@zenweld/store";
import { tr } from "@zenweld/i18n";
import { localAnswer, recordRef, usePanelCall, type PanelAnswer } from "./admin-panel";

export type { PanelAnswer };

/**
 * PANEL › KATALOG ISLEMLERI (Seçenek Tanımları, Kategoriler ve gruplar)
 *
 * Veritabani modunda islem sunucuya gider (/api/yonetim/katalog; Asama 5,
 * 3. alan, KARARLAR K-99; ortak akis lib/admin-panel.ts). Demo modunda
 * tarayicidaki veriye yazilir (packages/store).
 *
 * uploadNote: veritabani modunda dosya yukleme kapalidir (dosya deposu
 * gelene kadar); gorsel alanlari bu notu gosterir.
 */
export function useCatalogActions() {
  const { server, pending, call } = usePanelCall("katalog");
  const option = (o: OptionDefinition) => recordRef("option_definitions", o);
  const category = (c: Category) => recordRef("categories", c);
  const group = (g: CategoryGroup) => recordRef("category_groups", g);

  return {
    server,
    pending,
    uploadNote: server ? tr.panel.uploadDisabled : undefined,

    /** Yeni (id bos) ya da duzenleme; basarida id doner. */
    saveOptionDefinition: (definition: OptionDefinition): Promise<PanelAnswer> => {
      if (server) {
        const body = { name: definition.name, values: definition.values };
        return call("secenek", definition.id ? { ...body, ...option(definition) } : body, "option_definitions");
      }
      const result = saveOptionDefinition(definition);
      return Promise.resolve(result ? { ok: true, id: result.id } : { ok: false, error: "Kaydedilemedi: tarayıcı deposu dolu." });
    },
    deleteOptionDefinition: (o: OptionDefinition) =>
      server ? call("secenek-sil", option(o)) : localAnswer(deleteOptionDefinition(o.id)),

    /**
     * Kategori: yeni (stored yok) ya da duzenleme. mapping: eslesme
     * tablosunda degisen urunler (urunlerin son degisiklik anlariyla
     * gonderilir).
     */
    saveCategory: (
      next: Category,
      groupId: string,
      stored?: Category,
      mapping: Record<string, ProductFilterValues | undefined> = {},
      products: Product[] = [],
    ): Promise<PanelAnswer> => {
      if (server) {
        const fields = {
          name: next.name,
          slug: next.slug,
          description: next.description,
          aboutText: next.aboutText,
          image: next.image,
          icon: next.icon,
          code: next.code,
          seo: next.seo,
          optionIds: next.optionIds ?? [],
          filters: next.filters ?? [],
        };
        const rows = Object.entries(mapping).flatMap(([productId, values]) => {
          const product = products.find((p) => p.id === productId);
          return product ? [{ ...recordRef("products", product), productId, values: values ?? {} }] : [];
        });
        const body = { ...fields, groupId, mapping: rows };
        return call("kategori", stored ? { ...body, ...category(stored) } : body, "categories");
      }
      if (!stored) return Promise.resolve({ ok: true, id: createCategory(next).id });
      saveCategory(next, mapping);
      return localAnswer();
    },
    deleteCategory: (c: Category) => (server ? call("kategori-sil", category(c)) : localAnswer(deleteCategory(c.id))),
    moveCategory: (c: Category, direction: -1 | 1) =>
      server ? call("kategori-sira", { id: c.id, direction }) : (moveCategory(c.id, direction), localAnswer()),

    /** Grup: yeni (stored yok) ya da duzenleme. */
    saveGroup: (next: CategoryGroup, stored?: CategoryGroup): Promise<PanelAnswer> => {
      if (server) {
        const fields = {
          section: next.section,
          name: next.name,
          slug: next.slug,
          description: next.description,
          aboutText: next.aboutText,
          image: next.image,
          code: next.code,
          seo: next.seo,
        };
        return call("grup", stored ? { ...fields, ...group(stored) } : fields, "category_groups");
      }
      if (!stored) return Promise.resolve({ ok: true, id: createGroup(next).id });
      saveGroup(next);
      return localAnswer();
    },
    deleteGroup: (g: CategoryGroup) => (server ? call("grup-sil", group(g)) : localAnswer(deleteGroup(g.id))),
    moveGroup: (g: CategoryGroup, direction: -1 | 1) =>
      server ? call("grup-sira", { id: g.id, direction }) : (moveGroup(g.id, direction), localAnswer()),
  };
}

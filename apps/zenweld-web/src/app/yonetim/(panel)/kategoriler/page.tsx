"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, CornerDownRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { TopLevelSection } from "@zenweld/data";
import {
  countCategoryProducts,
  countGroupCategories,
  deleteCategory,
  deleteGroup,
  moveCategory,
  moveGroup,
  useDatabase,
} from "@zenweld/store";
import { Button } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SECTION_TITLES, categoryHref, groupCategories, groupHref, sectionGroups } from "@/lib/catalog";

const SECTIONS = Object.keys(SECTION_TITLES) as TopLevelSection[];

/**
 * KATEGORILER
 *
 * Dort urun bolumunun gruplari (mega menude sol kolon) ve kategorileri,
 * menudeki sirayla. Oklar menudeki ve kartlardaki sirayi degistirir. Urunu
 * olan kategori ve kategorisi olan grup silinemez.
 */
export default function AdminCategoriesPage() {
  return (
    <>
      <AdminPageHeader
        title="Kategoriler"
        description="Ürün bölümlerinin grupları ve kategorileri, menüdeki sırayla. Oklar menüdeki ve kartlardaki sırayı değiştirir."
      />
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <SectionTree key={section} section={section} />
        ))}
      </div>
    </>
  );
}

function SectionTree({ section }: { section: TopLevelSection }) {
  const db = useDatabase();
  const groups = sectionGroups(section, db.categoryGroups);

  return (
    <div className="overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zw-grey-200 px-4 py-3">
        <h2 className="font-display text-xl font-bold uppercase">{SECTION_TITLES[section]}</h2>
        <Link href={`/yonetim/kategoriler/grup/yeni?bolum=${section}`}>
          <Button size="sm" variant="outline" leftIcon={<Plus size={15} />}>
            Grup Ekle
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="w-20 px-4 py-2.5">Sıra</th>
              <th className="px-4 py-2.5">Ad</th>
              <th className="px-4 py-2.5">Link</th>
              <th className="px-4 py-2.5">İçerik</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {groups.map((group, gi) => {
              const categories = groupCategories(group, db.categories);
              const groupCount = countGroupCategories(group, db);
              return (
                <Fragment key={group.id}>
                  <tr className="bg-zw-grey-50/60">
                    <td className="px-4 py-2">
                      <OrderArrows
                        first={gi === 0}
                        last={gi === groups.length - 1}
                        onMove={(dir) => moveGroup(group.id, dir)}
                      />
                    </td>
                    <td className="px-4 py-2 font-semibold">{group.name}</td>
                    <td className="px-4 py-2 text-xs text-zw-grey-500">{groupHref(group)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-zw-grey-600">{groupCount} kategori</td>
                    <td className="px-4 py-2">
                      <RowActions
                        name={group.name}
                        editHref={`/yonetim/kategoriler/grup/${group.id}`}
                        blocked={groupCount > 0 ? "İçinde kategori olan grup silinemez; önce kategorileri taşıyın." : undefined}
                        onDelete={() => deleteGroup(group.id)}
                      />
                    </td>
                  </tr>
                  {categories.map((category, ci) => {
                    const productCount = countCategoryProducts(category, db);
                    return (
                      <tr key={category.id}>
                        <td className="px-4 py-2">
                          <OrderArrows
                            first={ci === 0}
                            last={ci === categories.length - 1}
                            onMove={(dir) => moveCategory(category.id, dir)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-1.5 pl-3">
                            <CornerDownRight size={14} className="shrink-0 text-zw-grey-400" />
                            {category.name}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-zw-grey-500">{categoryHref(category)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-zw-grey-600">{productCount} ürün</td>
                        <td className="px-4 py-2">
                          <RowActions
                            name={category.name}
                            editHref={`/yonetim/kategoriler/${category.id}`}
                            blocked={productCount > 0 ? "Ürünü olan kategori silinemez; önce ürünleri başka kategoriye taşıyın." : undefined}
                            onDelete={() => deleteCategory(category.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td />
                    <td colSpan={4} className="px-4 py-2">
                      <Link
                        href={`/yonetim/kategoriler/yeni?grup=${group.id}`}
                        className="inline-flex items-center gap-1 pl-3 text-sm font-semibold text-zw-red-600 hover:underline"
                      >
                        <Plus size={14} />
                        Kategori Ekle
                      </Link>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zw-grey-500">
                  Bu bölümde henüz grup yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderArrows({ first, last, onMove }: { first: boolean; last: boolean; onMove: (dir: -1 | 1) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Yukarı taşı"
        disabled={first}
        onClick={() => onMove(-1)}
        className="rounded-[3px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 disabled:opacity-30"
      >
        <ArrowUp size={15} />
      </button>
      <button
        type="button"
        aria-label="Aşağı taşı"
        disabled={last}
        onClick={() => onMove(1)}
        className="rounded-[3px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 disabled:opacity-30"
      >
        <ArrowDown size={15} />
      </button>
    </div>
  );
}

function RowActions({
  name,
  editHref,
  blocked,
  onDelete,
}: {
  name: string;
  editHref: string;
  /** Silinemiyorsa nedeni */
  blocked?: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Link
        href={editHref}
        aria-label={`${name} düzenle`}
        title="Düzenle"
        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink"
      >
        <Pencil size={16} />
      </Link>
      <button
        type="button"
        aria-label={`${name} sil`}
        title={blocked ?? "Sil"}
        disabled={Boolean(blocked)}
        onClick={() => {
          if (window.confirm(`"${name}" silinsin mi? Bu işlem geri alınamaz.`)) onDelete();
        }}
        className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zw-grey-400"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

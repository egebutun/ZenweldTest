"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { OptionDefinition } from "@zenweld/data";
import { categoriesUsingOption, deleteOptionDefinition, listOptionDefinitions, useDatabase } from "@zenweld/store";
import { Button } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { OptionDefinitionModal } from "@/components/admin/OptionEditor";

/**
 * SECENEK TANIMLARI (Ürünler › Seçenek Tanımları)
 *
 * Urun seceneklerinin ortak tanimlari: ad ve sirali degerler (Hortum
 * Uzunluğu: 3 m, 4 m ...). Kategoriler hangi tanimlarin listelenecegini
 * kendi Seçenekler sekmesinden secer; ayni tanim birden cok kategoride
 * kullanilabilir. Bir degerin adi duzeltilince her yerde degisir.
 */
export default function AdminOptionsPage() {
  const db = useDatabase();
  // null: pencere kapali; undefined tanim: yeni
  const [editing, setEditing] = useState<{ definition?: OptionDefinition } | null>(null);
  const definitions = listOptionDefinitions(db);

  return (
    <>
      <AdminPageHeader
        title="Seçenek Tanımları"
        description="Ürün seçeneklerinin adı ve değerleri. Hangi kategoride listeleneceği kategorinin Seçenekler sekmesinden seçilir."
        action={
          <Button leftIcon={<Plus size={17} />} onClick={() => setEditing({})}>
            Yeni Seçenek
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Seçenek</th>
              <th className="px-4 py-3">Değerler</th>
              <th className="px-4 py-3">Kategoriler</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {definitions.map((o) => {
              const categories = categoriesUsingOption(o.id, db);
              return (
                <tr key={o.id}>
                  <td className="px-4 py-2.5 font-semibold">{o.name}</td>
                  <td className="px-4 py-2.5 text-zw-grey-600">{o.values.map((v) => v.label).join(" · ")}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {categories.length === 0 && <span className="text-zw-grey-400">—</span>}
                    {categories.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ", "}
                        <Link href={`/yonetim/kategoriler/${c.id}`} className="text-zw-grey-700 hover:text-zw-red-600 hover:underline">
                          {c.name}
                        </Link>
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        aria-label={`${o.name} düzenle`}
                        onClick={() => setEditing({ definition: o })}
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-ink"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${o.name} sil`}
                        onClick={() => {
                          const where = categories.length ? ` ${categories.length} kategoriden de kaldırılır.` : "";
                          if (window.confirm(`"${o.name}" silinsin mi?${where}`)) deleteOptionDefinition(o.id);
                        }}
                        className="rounded-[3px] p-1.5 text-zw-grey-400 hover:bg-zw-grey-100 hover:text-zw-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {definitions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zw-grey-500">
                  Henüz seçenek tanımı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <OptionDefinitionModal initial={editing.definition} onClose={() => setEditing(null)} />}
    </>
  );
}

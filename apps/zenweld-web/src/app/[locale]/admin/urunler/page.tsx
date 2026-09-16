"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteProduct, saveProduct, useDatabase } from "@zenweld/store";
import { Badge, Button, Input, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { ProductImage } from "@/components/common/ProductImage";
import { formatPrice, priceWithVat } from "@/lib/format";

export default function AdminProductsPage() {
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("");

  const products = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return db.products.filter(
      (p) =>
        (!section || p.section === section) &&
        (!q ||
          p.name.toLocaleLowerCase("tr").includes(q) ||
          p.sku.toLocaleLowerCase("tr").includes(q)),
    );
  }, [db, query, section]);

  return (
    <>
      <AdminPageHeader
        title="Ürünler"
        description={`${products.length} ürün listeleniyor`}
        action={
          <LocaleLink href="/admin/urunler/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Ürün</Button>
          </LocaleLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün adı veya SKU ara…"
            className="pl-9"
          />
        </div>
        <Select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="sm:w-56"
        >
          <option value="">Tüm bölümler</option>
          <option value="ekipmanlar">Ekipmanlar</option>
          <option value="guvenlik">Güvenlik</option>
          <option value="aksesuarlar">Aksesuarlar</option>
          <option value="dolgu-metalleri">Dolgu Metalleri</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Ürün</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {products.map((p) => {
              const category = db.categories.find((c) => c.slug === p.categorySlug);
              return (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={p.images[0]?.url}
                        alt={p.name}
                        label={p.name}
                        className="h-11 w-11 shrink-0 rounded-[3px] border border-zw-grey-200 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-xs text-zw-grey-500">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-zw-grey-600">{category?.name.tr ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">
                      {formatPrice(priceWithVat(p.priceExVat, p.vatRate), "tr")}
                    </div>
                    <div className="text-xs text-zw-grey-500">
                      {formatPrice(p.priceExVat, "tr")} + KDV
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={p.inStock ? "green" : "outline"}>
                        {p.inStock ? "Stokta" : "Stok yok"}
                      </Badge>
                      {p.featured && <Badge tone="red">Öne çıkan</Badge>}
                      {!p.active && <Badge tone="grey">Yayında değil</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title={p.active ? "Yayından kaldır" : "Yayına al"}
                        onClick={() => saveProduct({ ...p, active: !p.active })}
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        {p.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <LocaleLink
                        href={`/admin/urunler/${p.id}`}
                        title="Düzenle"
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        <Pencil size={16} />
                      </LocaleLink>
                      <button
                        title="Sil"
                        onClick={() => {
                          if (confirm(`"${p.name}" silinsin mi? Bu işlem geri alınamaz.`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-red-50 hover:text-zw-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

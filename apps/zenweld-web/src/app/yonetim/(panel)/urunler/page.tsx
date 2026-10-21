"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { byProductOrder, isDiscountActive, salePriceExVat, type TopLevelSection } from "@zenweld/data";
import { deleteProduct, saveProduct, useDatabase, useNow } from "@zenweld/store";
import { Badge, Button, CampaignBadge, Input, ProductImage, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";
import { SECTION_TITLES, groupCategories, sectionGroups } from "@/lib/catalog";
import Link from "next/link";
import { formatPrice, priceWithVat } from "@zenweld/utils";

export default function AdminProductsPage() {
  const db = useDatabase();
  const now = useNow();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("");

  // Liste sitedeki gibi dizilir: menudeki kategori sirasi, kategori icinde Sıra.
  const products = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const categoryRank = new Map(
      (Object.keys(SECTION_TITLES) as TopLevelSection[])
        .flatMap((s) => sectionGroups(s, db.categoryGroups).flatMap((g) => groupCategories(g, db.categories)))
        .map((c, i) => [c.slug, i]),
    );
    const rank = (slug: string) => categoryRank.get(slug) ?? Infinity;
    return db.products
      .filter(
        (p) =>
          (!section || p.section === section) &&
          (!q ||
            p.name.toLocaleLowerCase("tr").includes(q) ||
            p.sku.toLocaleLowerCase("tr").includes(q)),
      )
      .sort((a, b) => rank(a.categorySlug) - rank(b.categorySlug) || byProductOrder(a, b));
  }, [db, query, section]);

  return (
    <>
      <AdminPageHeader
        title="Ürünler"
        description={`${products.length} ürün listeleniyor`}
        action={
          <Link href="/yonetim/urunler/yeni">
            <Button leftIcon={<Plus size={17} />}>Yeni Ürün</Button>
          </Link>
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
              <th className="px-4 py-3">Sıra</th>
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
                  <td className="px-4 py-2.5 text-zw-grey-600">{category?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-zw-grey-600">{p.order ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {/* Kampanya gecerliyse musterinin gordugu fiyat kirmizi,
                        normal fiyat ustu cizili; her durumda KDV haric normal
                        fiyat altta yazar. */}
                    {isDiscountActive(p, now) ? (
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-zw-red-600">
                          {formatPrice(priceWithVat(salePriceExVat(p, now), p.vatRate))}
                        </span>
                        <span className="text-xs text-zw-grey-500 line-through">
                          {formatPrice(priceWithVat(p.priceExVat, p.vatRate))}
                        </span>
                      </div>
                    ) : (
                      <div className="font-semibold">
                        {formatPrice(priceWithVat(p.priceExVat, p.vatRate))}
                      </div>
                    )}
                    <div className="text-xs text-zw-grey-500">
                      {formatPrice(p.priceExVat)} + KDV
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <CampaignBadge discount={p.discount} now={now} />
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
                      <Link
                        href={`/yonetim/urunler/${p.id}`}
                        title="Düzenle"
                        className="rounded-[3px] p-1.5 text-zw-grey-500 hover:bg-zw-grey-100"
                      >
                        <Pencil size={16} />
                      </Link>
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

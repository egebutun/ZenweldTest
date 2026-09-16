"use client";

import { useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import type { Retailer } from "@zenweld/data";
import { deleteRetailer, saveRetailer, useDatabase } from "@zenweld/store";
import { Badge, Button, Checkbox, FormRow, Input, Modal } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";

const EMPTY: Retailer = {
  id: "",
  name: "",
  websiteUrl: "",
  logoText: "",
  isOwnStore: false,
  city: "",
  active: true,
};

export default function AdminRetailersPage() {
  const db = useDatabase();
  const [editing, setEditing] = useState<Retailer | null>(null);

  const save = () => {
    if (!editing) return;
    const record: Retailer = {
      ...editing,
      id: editing.id || `r-${Date.now().toString(36)}`,
      logoText: editing.logoText || editing.name.toLocaleUpperCase("tr"),
    };
    saveRetailer(record);
    setEditing(null);
  };

  return (
    <>
      <AdminPageHeader
        title="Online Satıcılar"
        description="Ürün sayfalarındaki “Ayrıca online alışveriş olarak şurada da mevcuttur” bölümünde çıkacak siteler."
        action={
          <Button leftIcon={<Plus size={17} />} onClick={() => setEditing({ ...EMPTY })}>
            Yeni Satıcı
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.retailers.map((r) => {
          const stockCount = db.retailerStock.filter(
            (s) => s.retailerId === r.id && s.inStock,
          ).length;
          return (
            <div
              key={r.id}
              className={`rounded-[4px] border bg-white p-5 ${r.active ? "border-zw-grey-200" : "border-zw-grey-200 opacity-50"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-lg font-bold uppercase leading-tight">
                  {r.logoText}
                </div>
                {r.isOwnStore && <Badge tone="red">Kendi mağazamız</Badge>}
              </div>
              <div className="mt-1 text-sm text-zw-grey-600">{r.name}</div>
              <a
                href={r.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-zw-grey-500 hover:text-zw-red-600"
              >
                <ExternalLink size={13} />
                {r.websiteUrl}
              </a>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="grey">{stockCount} üründe stokta</Badge>
                {r.city && <Badge tone="outline">{r.city}</Badge>}
                {!r.active && <Badge tone="grey">Pasif</Badge>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                  Düzenle
                </Button>
                <button
                  onClick={() => {
                    if (confirm(`${r.name} ve tüm stok kayıtları silinsin mi?`)) {
                      deleteRetailer(r.id);
                    }
                  }}
                  className="rounded-[3px] px-2 text-zw-grey-400 hover:text-zw-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Satıcıyı Düzenle" : "Yeni Satıcı"}
      >
        {editing && (
          <div className="space-y-4">
            <FormRow label="Satıcı Adı" required>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </FormRow>
            <FormRow label="Logo Metni" hint="Ürün sayfasındaki kutuda görünecek kısa yazı">
              <Input
                value={editing.logoText}
                onChange={(e) => setEditing({ ...editing, logoText: e.target.value })}
              />
            </FormRow>
            <FormRow label="Site Adresi" required>
              <Input
                value={editing.websiteUrl}
                onChange={(e) => setEditing({ ...editing, websiteUrl: e.target.value })}
                placeholder="https://…"
              />
            </FormRow>
            <FormRow label="Şehir">
              <Input
                value={editing.city ?? ""}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
              />
            </FormRow>
            <Checkbox
              label="Zenweld'in kendi bayi mağazası (iç bağlantı olarak açılır)"
              checked={editing.isOwnStore}
              onChange={(e) => setEditing({ ...editing, isOwnStore: e.target.checked })}
            />
            <Checkbox
              label="Aktif"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
            />
            <div className="flex gap-3 pt-2">
              <Button onClick={save}>Kaydet</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Vazgeç
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

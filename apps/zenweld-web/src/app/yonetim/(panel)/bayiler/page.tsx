"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Dealer, DealerBadge } from "@zenweld/data";
import { deleteDealer, saveDealer, useDatabase } from "@zenweld/store";
import { Badge, Button, Checkbox, FormRow, Input, Modal, Select } from "@zenweld/ui";
import { AdminPageHeader } from "@/components/admin/AdminShell";

const EMPTY: Dealer = {
  id: "",
  name: "",
  city: "",
  district: "",
  address: "",
  phone: "",
  lat: 39.1,
  lng: 35.6,
  badges: ["yetkili-satici"],
  workingHours: "Hafta içi 09:00 – 18:00",
  active: true,
};

const BADGES: { id: DealerBadge; label: string }[] = [
  { id: "yetkili-satici", label: "Yetkili Bayi" },
  { id: "yetkili-servis", label: "Yetkili Servis" },
];

/** Bayi turu: Yetkili Bayi, Yetkili Servis ya da ikisi birden. */
const DEALER_TYPES: { id: string; label: string; badges: DealerBadge[] }[] = [
  { id: "bayi", label: "Yetkili Bayi", badges: ["yetkili-satici"] },
  { id: "servis", label: "Yetkili Servis", badges: ["yetkili-servis"] },
  { id: "ikisi", label: "Yetkili Bayi + Yetkili Servis", badges: ["yetkili-satici", "yetkili-servis"] },
];

const dealerType = (d: Dealer) => {
  const seller = d.badges.includes("yetkili-satici");
  const service = d.badges.includes("yetkili-servis");
  return seller && service ? "ikisi" : service ? "servis" : seller ? "bayi" : "";
};

export default function AdminDealersPage() {
  const db = useDatabase();
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [city, setCity] = useState("");

  const cities = Array.from(new Set(db.dealers.map((d) => d.city))).sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
  const dealers = city ? db.dealers.filter((d) => d.city === city) : db.dealers;

  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!editing) return;
    if (!dealerType(editing)) return setError("Bayi türünü seçin: Yetkili Bayi, Yetkili Servis ya da ikisi.");
    setError(null);
    saveDealer({ ...editing, id: editing.id || `d-${Date.now().toString(36)}` });
    setEditing(null);
  };

  return (
    <>
      <AdminPageHeader
        title="Bayiler"
        description="Yetkili Bayi ve Servis Ağı haritasında ve ürün sayfasındaki “Stoktaki Bayileri Gör” penceresinde görünen satış ve servis noktaları."
        action={
          <Button leftIcon={<Plus size={17} />} onClick={() => setEditing({ ...EMPTY })}>
            Yeni Bayi
          </Button>
        }
      />

      <div className="mb-4 sm:w-64">
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Tüm şehirler ({db.dealers.length})</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
            <tr>
              <th className="px-4 py-3">Bayi</th>
              <th className="px-4 py-3">Şehir / İlçe</th>
              <th className="px-4 py-3">Telefon</th>
              <th className="px-4 py-3">Rozetler</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zw-grey-100">
            {dealers.map((d) => (
              <tr key={d.id} className={d.active ? "" : "opacity-50"}>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-zw-grey-500">{d.address}</div>
                </td>
                <td className="px-4 py-2.5 text-zw-grey-600">
                  {d.city} / {d.district}
                </td>
                <td className="px-4 py-2.5 text-zw-grey-600">{d.phone}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {d.badges.map((b) => (
                      <Badge key={b} tone={b === "yetkili-servis" ? "dark" : "grey"}>
                        {BADGES.find((x) => x.id === b)?.label}
                      </Badge>
                    ))}
                    {d.retailerId && <Badge tone="outline">Online mağaza</Badge>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(d)}>
                      Düzenle
                    </Button>
                    <button
                      onClick={() => {
                        if (confirm(`${d.name} silinsin mi?`)) deleteDealer(d.id);
                      }}
                      className="px-2 text-zw-grey-400 hover:text-zw-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => {
          setEditing(null);
          setError(null);
        }}
        title={editing?.id ? "Bayiyi Düzenle" : "Yeni Bayi"}
      >
        {editing && (
          <div className="space-y-4">
            <FormRow label="Bayi Adı" required>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </FormRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Şehir" required>
                <Input
                  value={editing.city}
                  onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                />
              </FormRow>
              <FormRow label="İlçe">
                <Input
                  value={editing.district}
                  onChange={(e) => setEditing({ ...editing, district: e.target.value })}
                />
              </FormRow>
            </div>
            <FormRow label="Adres">
              <Input
                value={editing.address}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </FormRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Telefon">
                <Input
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </FormRow>
              <FormRow label="WhatsApp">
                <Input
                  value={editing.whatsapp ?? ""}
                  onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                />
              </FormRow>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Enlem (lat)" hint="Google Maps'ten kopyalayabilirsiniz">
                <Input
                  type="number"
                  step="0.0001"
                  value={editing.lat}
                  onChange={(e) => setEditing({ ...editing, lat: Number(e.target.value) })}
                />
              </FormRow>
              <FormRow label="Boylam (lng)">
                <Input
                  type="number"
                  step="0.0001"
                  value={editing.lng}
                  onChange={(e) => setEditing({ ...editing, lng: Number(e.target.value) })}
                />
              </FormRow>
            </div>
            <FormRow label="Çalışma Saatleri">
              <Input
                value={editing.workingHours}
                onChange={(e) => setEditing({ ...editing, workingHours: e.target.value })}
              />
            </FormRow>
            <FormRow label="Bağlı olduğu online mağaza">
              <Select
                value={editing.retailerId ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, retailerId: e.target.value || undefined })
                }
              >
                <option value="">Yok</option>
                {db.retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormRow>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
                Bayi Türü <span className="text-zw-red-600">*</span>
              </div>
              <div className="space-y-2">
                {DEALER_TYPES.map((type) => (
                  <label key={type.id} className="flex items-center gap-2.5 text-sm text-zw-grey-700">
                    <input
                      type="radio"
                      name="dealer-type"
                      className="accent-zw-red-600"
                      checked={dealerType(editing) === type.id}
                      onChange={() =>
                        setEditing({
                          ...editing,
                          badges: type.badges,
                        })
                      }
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-zw-red-600">{error}</p>}
            <Checkbox
              label="Aktif"
              checked={editing.active}
              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
            />
            <div className="flex gap-3 pt-2">
              <Button onClick={save}>Kaydet</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setError(null);
                }}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

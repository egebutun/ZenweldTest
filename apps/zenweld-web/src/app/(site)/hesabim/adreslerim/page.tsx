"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Address } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import {
  addAddress,
  addressesForUser,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
  useDatabase,
} from "@zenweld/store";
import { Alert, Badge, Button, EmptyState, FormRow, Input } from "@zenweld/ui";
import { AddressFields, EMPTY_ADDRESS, addressComplete } from "@/components/shop/AddressFields";
import { useT } from "@/lib/i18n-client";

export default function AddressesPage() {
  const t = useT();
  const { user } = useAuth();
  const db = useDatabase();
  // "new": yeni adres formu; Address: o adresin duzenleme formu
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  if (!user) return null;
  const addresses = addressesForUser(user.id, db);
  const addButton = (
    <Button leftIcon={<Plus size={17} />} onClick={() => setEditing("new")}>
      {t.account.newAddress}
    </Button>
  );

  if (editing) {
    const current = editing === "new" ? undefined : editing;
    return (
      <AddressForm
        key={current?.id ?? "new"}
        heading={current ? t.account.editAddress : t.account.newAddress}
        initial={current}
        onSave={(fields) => {
          if (current) updateAddress(user.id, current.id, fields);
          else addAddress({ ...fields, userId: user.id });
          setEditing(null);
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  if (addresses.length === 0) {
    return (
      <EmptyState
        icon={<MapPin size={38} />}
        title={t.account.noAddresses}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        action={addButton}
      />
    );
  }

  const actionCls = "inline-flex items-center gap-1.5 text-xs font-semibold text-zw-grey-600 hover:text-zw-red-600";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{addButton}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="flex flex-col rounded-[4px] border border-zw-grey-200 p-5">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold uppercase">{a.title}</h3>
              {a.isDefault && <Badge tone="dark">{t.account.defaultAddress}</Badge>}
            </div>
            <p className="mt-2 flex-1 text-sm text-zw-grey-600">
              {a.fullName}
              <br />
              {a.line}
              <br />
              {a.district} / {a.city}
              <br />
              {a.phone}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zw-grey-100 pt-3">
              <button type="button" onClick={() => setEditing(a)} className={actionCls}>
                <Pencil size={14} /> {t.account.edit}
              </button>
              {!a.isDefault && (
                <button type="button" onClick={() => setDefaultAddress(user.id, a.id)} className={actionCls}>
                  <Star size={14} /> {t.account.setDefault}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t.account.deleteAddressConfirm.replace("{title}", a.title))) deleteAddress(user.id, a.id);
                }}
                className={actionCls}
              >
                <Trash2 size={14} /> {t.account.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Yeni adres ya da duzenleme: odeme sayfasindaki adres alanlariyla ayni. */
function AddressForm({
  heading,
  initial,
  onSave,
  onCancel,
}: {
  heading: string;
  initial?: Address;
  onSave: (fields: Omit<Address, "id" | "userId" | "isDefault">) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [address, setAddress] = useState(() => {
    if (!initial) return { ...EMPTY_ADDRESS, title: "" };
    const { fullName, phone, city, district, line, title } = initial;
    return { fullName, phone, city, district, line, title };
  });
  const [error, setError] = useState(false);
  const set = (key: keyof typeof address, value: string) => setAddress((a) => ({ ...a, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressComplete(address)) return setError(true);
    onSave({ ...address, title: address.title.trim() || t.checkout.shippingAddress });
  };

  return (
    <form onSubmit={save} className="space-y-4 rounded-[4px] border border-zw-grey-200 p-5">
      <h2 className="font-display text-xl font-semibold uppercase">{heading}</h2>
      <AddressFields value={address} onChange={set} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.checkout.addressTitle}>
          <Input
            value={address.title}
            placeholder={t.checkout.addressTitlePlaceholder}
            onChange={(e) => set("title", e.target.value)}
          />
        </FormRow>
      </div>
      {error && !addressComplete(address) && <Alert tone="danger">{t.checkout.required}</Alert>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{t.common.save}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

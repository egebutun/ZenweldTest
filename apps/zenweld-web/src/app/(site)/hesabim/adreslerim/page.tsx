"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { addAddress, addressesForUser, useDatabase } from "@zenweld/store";
import { Alert, Badge, Button, EmptyState, FormRow, Input } from "@zenweld/ui";
import { AddressFields, EMPTY_ADDRESS, addressComplete } from "@/components/shop/AddressFields";
import { useT } from "@/lib/i18n-client";

export default function AddressesPage() {
  const t = useT();
  const { user } = useAuth();
  const db = useDatabase();
  const [adding, setAdding] = useState(false);

  if (!user) return null;
  const addresses = addressesForUser(user.id, db);
  const addButton = (
    <Button leftIcon={<Plus size={17} />} onClick={() => setAdding(true)}>
      {t.account.newAddress}
    </Button>
  );

  if (adding) return <NewAddressForm userId={user.id} onDone={() => setAdding(false)} />;

  if (addresses.length === 0) {
    return (
      <EmptyState
        icon={<MapPin size={38} />}
        title="Kayıtlı adres yok"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        action={addButton}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">{addButton}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.id} className="rounded-[4px] border border-zw-grey-200 p-5">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold uppercase">{a.title}</h3>
              {a.isDefault && <Badge tone="dark">Varsayılan</Badge>}
            </div>
            <p className="mt-2 text-sm text-zw-grey-600">
              {a.fullName}
              <br />
              {a.line}
              <br />
              {a.district} / {a.city}
              <br />
              {a.phone}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Yeni adres: odeme sayfasindaki adres alanlariyla ayni. Ilk adres varsayilan olur. */
function NewAddressForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const t = useT();
  const [address, setAddress] = useState({ ...EMPTY_ADDRESS, title: "" });
  const [error, setError] = useState(false);
  const set = (key: keyof typeof address, value: string) => setAddress((a) => ({ ...a, [key]: value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressComplete(address)) return setError(true);
    const { title, ...fields } = address;
    addAddress({ ...fields, userId, title: title.trim() || t.checkout.shippingAddress });
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4 rounded-[4px] border border-zw-grey-200 p-5">
      <h2 className="font-display text-xl font-semibold uppercase">{t.account.newAddress}</h2>
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
        <Button type="button" variant="outline" onClick={onDone}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

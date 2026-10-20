"use client";

import type { OrderAddress } from "@zenweld/data";
import { FormRow, Input, Textarea } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

/**
 * Adres alanlari (ad soyad, telefon, il, ilce, acik adres). Odeme
 * sayfasindaki teslimat/fatura adresinde ve Hesabim > Adreslerim'de
 * yeni adres eklerken kullanilir.
 */

export const EMPTY_ADDRESS: OrderAddress = { fullName: "", phone: "", city: "", district: "", line: "" };

export const addressComplete = (a: OrderAddress) =>
  [a.fullName, a.phone, a.city, a.district, a.line].every((v) => v.trim());

export function AddressFields({
  value,
  onChange,
}: {
  value: OrderAddress;
  onChange: (key: keyof OrderAddress, value: string) => void;
}) {
  const t = useT();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormRow label={t.checkout.fullName} required>
        <Input autoComplete="name" value={value.fullName} onChange={(e) => onChange("fullName", e.target.value)} />
      </FormRow>
      <FormRow label={t.checkout.phone} required>
        <Input type="tel" autoComplete="tel" value={value.phone} onChange={(e) => onChange("phone", e.target.value)} />
      </FormRow>
      <FormRow label={t.checkout.city} required>
        <Input value={value.city} onChange={(e) => onChange("city", e.target.value)} />
      </FormRow>
      <FormRow label={t.checkout.district} required>
        <Input value={value.district} onChange={(e) => onChange("district", e.target.value)} />
      </FormRow>
      <div className="sm:col-span-2">
        <FormRow label={t.checkout.addressLine} required>
          <Textarea
            autoComplete="street-address"
            value={value.line}
            onChange={(e) => onChange("line", e.target.value)}
            className="min-h-20"
          />
        </FormRow>
      </div>
    </div>
  );
}

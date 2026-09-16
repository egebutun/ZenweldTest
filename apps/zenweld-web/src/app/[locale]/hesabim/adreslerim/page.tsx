"use client";

import { MapPin } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { useDatabase } from "@zenweld/store";
import { Badge, EmptyState } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

export default function AddressesPage() {
  const t = useT();
  const { user } = useAuth();
  const db = useDatabase();

  if (!user) return null;
  const addresses = db.addresses.filter((a) => a.userId === user.id);

  if (addresses.length === 0) {
    return (
      <EmptyState
        icon={<MapPin size={38} />}
        title="Kayıtlı adres yok"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      />
    );
  }

  return (
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
  );
}

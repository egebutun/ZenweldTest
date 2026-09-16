"use client";

import { useState } from "react";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

export default function ProfilePage() {
  const t = useT();
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    companyName: user?.companyName ?? "",
    taxOffice: user?.taxOffice ?? "",
    taxNumber: user?.taxNumber ?? "",
  });

  if (!user) return null;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateProfile(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }}
      className="max-w-xl space-y-4"
    >
      {saved && <Alert tone="success">Profiliniz güncellendi.</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.auth.firstName}>
          <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </FormRow>
        <FormRow label={t.auth.lastName}>
          <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </FormRow>
      </div>

      <FormRow label={t.auth.email}>
        <Input value={user.email} disabled />
      </FormRow>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.auth.phone}>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </FormRow>
        <FormRow label={t.auth.city}>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </FormRow>
      </div>

      {user.role !== "individual" && (
        <>
          <FormRow label={t.auth.companyName}>
            <Input
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </FormRow>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.auth.taxOffice}>
              <Input value={form.taxOffice} onChange={(e) => set("taxOffice", e.target.value)} />
            </FormRow>
            <FormRow label={t.auth.taxNumber}>
              <Input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
            </FormRow>
          </div>
        </>
      )}

      <Button type="submit" size="lg">
        {t.common.save}
      </Button>
    </form>
  );
}

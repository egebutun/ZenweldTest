"use client";

import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Alert, Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";

export default function ContactPage() {
  const t = useT();
  const [sent, setSent] = useState(false);

  return (
    <div className="zw-container py-12">
      <h1 className="font-display text-4xl font-bold uppercase">{t.support.contactTitle}</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="max-w-xl">
          {sent ? (
            <Alert tone="success">{t.support.sent}</Alert>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-4"
            >
              <FormRow label={t.support.name} required>
                <Input required />
              </FormRow>
              <FormRow label={t.support.email} required>
                <Input type="email" required />
              </FormRow>
              <FormRow label={t.support.message} required>
                <Textarea required />
              </FormRow>
              <Button type="submit" size="lg">
                {t.support.send}
              </Button>
            </form>
          )}
        </div>

        <aside className="space-y-4 rounded-[4px] bg-zw-grey-100 p-6 text-sm">
          <div className="flex gap-3">
            <Phone size={18} className="shrink-0 text-zw-red-600" />
            {STORE.phone}
          </div>
          <div className="flex gap-3">
            <Mail size={18} className="shrink-0 text-zw-red-600" />
            {STORE.email}
          </div>
          <div className="flex gap-3">
            <MapPin size={18} className="shrink-0 text-zw-red-600" />
            {STORE.address}
          </div>
          <p className="border-t border-zw-grey-300 pt-4 text-zw-grey-600">
            {STORE.workingHours}
          </p>
        </aside>
      </div>
    </div>
  );
}

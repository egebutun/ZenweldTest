"use client";

import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Alert, Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";
import { CONTACT } from "@/lib/menu";

export default function ContactPage() {
  const t = useT();
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero title={t.support.contactTitle} subtitle={t.support.subtitle} />

      <div className="zw-container py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormRow label={t.support.name} required>
                    <Input required />
                  </FormRow>
                  <FormRow label={t.support.email} required>
                    <Input type="email" required />
                  </FormRow>
                </div>
                <FormRow label={t.support.subject} required>
                  <Input required />
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

          <aside className="space-y-4 rounded-[4px] bg-zw-grey-100 p-6">
            <div className="flex gap-3">
              <Phone size={20} className="shrink-0 text-zw-red-600" />
              <span className="text-sm">{CONTACT.phone}</span>
            </div>
            <div className="flex gap-3">
              <Mail size={20} className="shrink-0 text-zw-red-600" />
              <span className="text-sm">{CONTACT.email}</span>
            </div>
            <div className="flex gap-3">
              <MapPin size={20} className="shrink-0 text-zw-red-600" />
              <span className="text-sm">{CONTACT.address}</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Award, Check, GraduationCap, Ticket, Zap } from "lucide-react";
import { stockPhotos } from "@zenweld/data";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";

export default function WeldersClubPage() {
  const t = useT();
  const [joined, setJoined] = useState(false);

  const benefits = [
    { Icon: Award, label: t.club.benefit1 },
    { Icon: GraduationCap, label: t.club.benefit2 },
    { Icon: Ticket, label: t.club.benefit3 },
    { Icon: Zap, label: t.club.benefit4 },
  ];

  return (
    <>
      <PageHero title={t.club.title} subtitle={t.club.subtitle} image={stockPhotos.welderAtWork} />

      <div className="zw-container py-14">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map(({ Icon, label }) => (
              <div key={label} className="rounded-[4px] border border-zw-grey-200 p-5">
                <Icon size={26} className="text-zw-red-600" />
                <h3 className="mt-3 font-display text-lg font-semibold uppercase leading-tight">
                  {label}
                </h3>
                <p className="mt-1.5 text-sm text-zw-grey-500">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[4px] bg-zw-grey-100 p-7">
            {joined ? (
              <Alert tone="success">
                <span className="flex items-center gap-2">
                  <Check size={18} />
                  {t.club.joined}
                </span>
              </Alert>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setJoined(true);
                }}
                className="space-y-4"
              >
                <h2 className="font-display text-2xl font-bold uppercase">{t.club.join}</h2>
                <FormRow label={t.auth.firstName} required>
                  <Input required />
                </FormRow>
                <FormRow label={t.auth.email} required>
                  <Input type="email" required />
                </FormRow>
                <FormRow label={t.auth.city}>
                  <Input />
                </FormRow>
                <Button type="submit" size="lg" fullWidth>
                  {t.club.join}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

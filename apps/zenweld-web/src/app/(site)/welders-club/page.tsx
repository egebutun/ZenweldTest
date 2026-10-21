"use client";

import { useState } from "react";
import { Award, Check, GraduationCap, Ticket, Zap } from "lucide-react";
import { stockPhotos } from "@zenweld/data";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";
import { notifyZenweld, reached } from "@/lib/notify";

export default function WeldersClubPage() {
  const t = useT();
  const [joined, setJoined] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", city: "" });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Katilim info@zenweld.com'a e-postayla gider; gitmezse ziyaretciye soylenir.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(false);
    const result = await notifyZenweld("welders-club", form);
    setSending(false);
    if (reached(result)) setJoined(true);
    else setError(true);
  };

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
              <form onSubmit={submit} className="space-y-4">
                <h2 className="font-display text-2xl font-bold uppercase">{t.club.join}</h2>
                {error && <Alert tone="danger">{t.club.sendError}</Alert>}
                <FormRow label={t.auth.firstName} required>
                  <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
                </FormRow>
                <FormRow label={t.auth.email} required>
                  <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
                </FormRow>
                <FormRow label={t.auth.city}>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </FormRow>
                <Button type="submit" size="lg" fullWidth disabled={sending}>
                  {sending ? t.support.sending : t.club.join}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2, Handshake } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import { KvkkNotice } from "@/components/legal/LegalLink";
import { PageHero } from "@/components/common/PageShell";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";
import { postForm, reached } from "@/lib/notify";
import { useMemberPrefill } from "@/lib/member-prefill";

/**
 * BAYILIK BASVURUSU
 *
 * Form info@zenweld.com adresine iletilir (/api/bayilik ucu uzerinden).
 * Gonderildikten sonra formun yerine tesekkur mesaji gecer.
 *
 * KVKK: sirket ve kisi bilgileri kisisel/ticari veridir; bu yuzden
 * toplandigi yerde acik riza kutusu var ve aydinlatma metnine baglanti
 * veriliyor. Metnin son hali hukuk danismaninizca onaylanmalidir.
 */
export default function DealerApplicationPage() {
  const t = useT();
  const { user } = useAuth();

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company: "",
    taxOffice: "",
    contactName: user ? `${user.firstName} ${user.lastName}`.trim() : "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: "",
    sector: "",
    years: "",
    hasShowroom: "",
    hasService: "",
    brands: "",
    message: "",
  });
  useMemberPrefill(
    user,
    (u) => ({ contactName: `${u.firstName} ${u.lastName}`.trim(), email: u.email, phone: u.phone ?? "" }),
    setForm,
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setSending(true);
    // Basvurunun kaydi yok, yalnizca e-postayla gider: gitmezse ziyaretci
    // bilgilendirilir ve tekrar deneyebilir (lib/notify.ts).
    const result = await postForm("/api/bayilik", form);
    setSending(false);
    if (reached(result)) setSent(true);
    else setError(t.dealerApply.sendError);
  };

  return (
    <>
      <PageHero title={t.dealerApply.title} subtitle={t.dealerApply.subtitle} />

      <div className="zw-container py-12">
        {sent ? (
          <div className="mx-auto max-w-2xl rounded-[6px] border border-zw-grey-200 bg-white p-8 text-center">
            <CheckCircle2 size={44} className="mx-auto text-zw-red-600" />
            <h2 className="mt-4 font-display text-2xl font-bold uppercase">
              {t.dealerApply.thanksTitle}
            </h2>
            <p className="mt-3 text-zw-grey-600">{t.dealerApply.thanks}</p>
            <Link href="/" className="mt-6 inline-block">
              <Button variant="outline">{t.dealerApply.backHome}</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5">
            {error && <Alert tone="danger">{error}</Alert>}

            <div className="rounded-[6px] border border-zw-grey-200 bg-white p-6">
              <h2 className="mb-4 font-display text-lg font-bold uppercase">
                {t.dealerApply.companySection}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label={t.dealerApply.company} required>
                  <Input required value={form.company} onChange={(e) => set("company", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.taxOffice}>
                  <Input value={form.taxOffice} onChange={(e) => set("taxOffice", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.city} required>
                  <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.sector} hint={t.dealerApply.sectorHint}>
                  <Input value={form.sector} onChange={(e) => set("sector", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.years}>
                  <Select value={form.years} onChange={(e) => set("years", e.target.value)}>
                    <option value="">—</option>
                    <option value="0-2">0 – 2</option>
                    <option value="3-5">3 – 5</option>
                    <option value="6-10">6 – 10</option>
                    <option value="10+">10+</option>
                  </Select>
                </FormRow>
                <FormRow label={t.dealerApply.brands} hint={t.dealerApply.brandsHint}>
                  <Input value={form.brands} onChange={(e) => set("brands", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.showroom}>
                  <Select value={form.hasShowroom} onChange={(e) => set("hasShowroom", e.target.value)}>
                    <option value="">—</option>
                    <option value="evet">{t.common.yes}</option>
                    <option value="hayir">{t.common.no}</option>
                  </Select>
                </FormRow>
                <FormRow label={t.dealerApply.service}>
                  <Select value={form.hasService} onChange={(e) => set("hasService", e.target.value)}>
                    <option value="">—</option>
                    <option value="evet">{t.common.yes}</option>
                    <option value="hayir">{t.common.no}</option>
                  </Select>
                </FormRow>
              </div>
            </div>

            <div className="rounded-[6px] border border-zw-grey-200 bg-white p-6">
              <h2 className="mb-4 font-display text-lg font-bold uppercase">
                {t.dealerApply.contactSection}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label={t.dealerApply.contactName} required>
                  <Input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.email} required>
                  <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </FormRow>
                <FormRow label={t.dealerApply.phone} required>
                  <Input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </FormRow>
              </div>
              <div className="mt-4">
                <FormRow label={t.dealerApply.message}>
                <Textarea
                  className="min-h-28"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                />
                </FormRow>
              </div>
            </div>

            <KvkkNotice />

            <Button type="submit" size="lg" disabled={sending} leftIcon={<Handshake size={18} />}>
              {sending ? t.dealerApply.sending : t.dealerApply.send}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}

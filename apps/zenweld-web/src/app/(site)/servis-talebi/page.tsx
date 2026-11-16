"use client";

import { useMemo, useState } from "react";
import { Check, Wrench } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import {
  DEFAULT_EMAIL_ADDRESS,
  emailSettingOf,
  PROVINCE_NAMES,
  provinceName,
  serviceCreatedMail,
  type ServiceReason,
  type User,
} from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { addEmailMessage, createServiceRequest, getEmailSettings, listProducts, useDatabase } from "@zenweld/store";
import { Alert, Button, Checkbox, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import Link from "next/link";
import { PageHero } from "@/components/common/PageShell";
import { KvkkNotice } from "@/components/legal/LegalLink";
import { useBotTrap } from "@/components/common/BotTrap";
import { accountRequest } from "@/lib/account-api";
import { serviceNotice } from "@/lib/form-text";
import { useT } from "@/lib/i18n-client";
import { notifyZenweld } from "@/lib/notify";
import { useMemberPrefill } from "@/lib/member-prefill";

/** Makine turu bu gruplardaki kategorilerden secilir (Kaynak, Lazer). */
const MACHINE_GROUPS = ["kaynak-makineleri", "lazer-makineleri"];
const REASONS: ServiceReason[] = ["kurulum", "bakim", "onarim", "egitim"];
const COMPLAINT_MAX = 400;

const EMPTY = {
  categorySlug: "",
  productId: "",
  complaint: "",
  companyName: "",
  address: "",
  city: "",
  district: "",
  email: "",
  phone: "",
  contactName: "",
  contactGsm: "",
};

/**
 * SERVIS TALEBI (Destek ve Garanti > Destek)
 *
 * Talep yonetim panelindeki "Servis Talepleri" sayfasina duser; musteriye
 * "talebiniz alindi" e-postasi gider (servis bilgisi yok). Il 81 illik
 * listeden secilir; KVKK metni bilgilerin yetkili servisle paylasildigini
 * soyler (KARARLAR K-117). Formdaki baglantilar (garanti kosullari, gizlilik
 * sozlesmesi) yeni sekmede acilir; boylece doldurulan form kaybolmaz.
 */
const memberValues = (user: User) => ({
  companyName: user.companyName || `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  phone: user.phone ?? "",
  city: provinceName(user.city) ?? "",
  contactName: `${user.firstName} ${user.lastName}`.trim(),
});

export default function ServiceRequestPage() {
  const t = useT();
  const db = useDatabase();
  const { user, api } = useAuth();
  // Veritabani modu: talebi sunucu kaydeder (Asama 5.3).
  const server = api !== null;
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState(() => ({ ...EMPTY, ...(user ? memberValues(user) : {}) }));
  useMemberPrefill(user, memberValues, setForm);
  const [reasons, setReasons] = useState<ServiceReason[]>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const bot = useBotTrap();

  const set = (key: keyof typeof EMPTY, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const groups = useMemo(
    () =>
      MACHINE_GROUPS.map((slug) => db.categoryGroups.find((g) => g.slug === slug))
        .filter((g) => g !== undefined)
        .map((g) => ({
          group: g,
          categories: db.categories
            .filter((c) => c.group === g.slug)
            .sort((a, b) => a.order - b.order),
        })),
    [db],
  );

  const models = useMemo(
    () =>
      listProducts(db)
        .filter((p) => p.categorySlug === form.categorySlug)
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [db, form.categorySlug],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const required = Object.keys(EMPTY) as (keyof typeof EMPTY)[];
    if (required.some((k) => !form[k].trim())) return setError(t.service.required);
    if (!provinceName(form.city)) return setError(t.service.cityInvalid);
    if (reasons.length === 0) return setError(t.service.reasonRequired);
    if (!consent) return setError(t.service.consentRequired);

    if (server) {
      setSending(true);
      const answer = await accountRequest<{ code: string }>("/api/formlar", "servis", {
        ...form,
        reasons,
        consent,
        website: bot.website,
      });
      setSending(false);
      if (!answer.ok) return setError(answer.error);
      setCode(answer.code);
      window.scrollTo({ top: 0 });
      return;
    }

    const product = models.find((p) => p.id === form.productId);
    const record = createServiceRequest({
      ...form,
      productName: product?.name ?? "",
      reasons,
      userId: user?.id,
    });
    if (!record) return setError(t.common.storageFull);
    // Talep panelde Servis Talepleri'ne duser; info@zenweld.com'a da haber verilir.
    void notifyZenweld("servis", serviceNotice(record, t), bot.website);
    // Musteriye "talebiniz alindi" e-postasi: demo modunda gonderilmez, talebin
    // yazismalarina "Gonderilmedi" olarak yazilir (KARARLAR K-116, K-117).
    const mail = serviceCreatedMail(record, db.categories.find((c) => c.slug === record.categorySlug)?.name);
    addEmailMessage({
      type: "servis",
      direction: "out",
      from: emailSettingOf(getEmailSettings(db), "servis").sender ?? DEFAULT_EMAIL_ADDRESS,
      to: [record.email],
      subject: mail.subject,
      body: mail.body,
      status: "skipped",
      error: tr.panel.emailNotSent,
      entityType: "service_requests",
      entityId: record.id,
      sourcePath: "/servis-talebi",
    });
    setCode(record.code);
    window.scrollTo({ top: 0 });
  };

  // Uye talebini Hesabim › Servis Taleplerim'de izler (yonetici hesabinda bu sayfa yok).
  const member = Boolean(user) && user?.role !== "admin";

  if (code) {
    return (
      <div className="zw-container py-20">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={32} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold uppercase">{t.service.successTitle}</h1>
          <p className="mt-3 text-zw-grey-600">{t.service.successText.replace("{code}", code)}</p>
          {member && <p className="mt-2 text-sm text-zw-grey-600">{t.service.successMember}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {member && (
              <Link href="/hesabim/servis-taleplerim">
                <Button>{t.account.myServiceRequests}</Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setCode(null);
                setReasons([]);
                setConsent(false);
                setForm((f) => ({ ...f, categorySlug: "", productId: "", complaint: "" }));
              }}
            >
              {t.service.newRequest}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero title={t.service.title} />

      <div className="zw-container max-w-3xl py-10">
        <h2 className="font-display text-3xl font-bold uppercase">{t.service.formTitle}</h2>
        <p className="mt-2 text-zw-grey-700">
          {t.service.warrantyNoteBefore}
          <Link
            href="/garanti/kosullar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-zw-ink underline underline-offset-2 hover:text-zw-red-600"
          >
            {t.service.warrantyNoteLink}
          </Link>
          {t.service.warrantyNoteAfter}
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-8" noValidate>
          <section className="grid gap-4 sm:grid-cols-2">
            <FormRow label={t.service.machine} required>
              <Select
                value={form.categorySlug}
                onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value, productId: "" }))}
              >
                <option value="">{t.service.machinePlaceholder}</option>
                {groups.map(({ group, categories }) => (
                  <optgroup key={group.slug} label={group.name}>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </FormRow>
            <FormRow label={t.service.model} required>
              <Select
                value={form.productId}
                disabled={!form.categorySlug}
                onChange={(e) => set("productId", e.target.value)}
              >
                <option value="">{form.categorySlug ? t.service.modelPlaceholder : t.service.modelFirst}</option>
                {models.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </FormRow>
          </section>

          <section>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">
              {t.service.reason} <span className="text-zw-red-600">*</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {REASONS.map((r) => (
                <Checkbox
                  key={r}
                  label={t.service.reasons[r]}
                  checked={reasons.includes(r)}
                  onChange={(e) =>
                    setReasons((list) => (e.target.checked ? [...list, r] : list.filter((x) => x !== r)))
                  }
                />
              ))}
            </div>
          </section>

          <FormRow
            label={t.service.complaint}
            required
            hint={`${form.complaint.length}/${COMPLAINT_MAX}`}
          >
            <Textarea
              maxLength={COMPLAINT_MAX}
              value={form.complaint}
              onChange={(e) => set("complaint", e.target.value.slice(0, COMPLAINT_MAX))}
            />
          </FormRow>

          <section>
            <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold uppercase">
              <Wrench size={18} className="text-zw-red-600" />
              {t.service.customer}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormRow label={t.service.companyName} required>
                  <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
                </FormRow>
              </div>
              <div className="sm:col-span-2">
                <FormRow label={t.service.address} required>
                  <Textarea
                    className="min-h-20"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </FormRow>
              </div>
              <FormRow label={t.service.city} required>
                <Select value={form.city} onChange={(e) => set("city", e.target.value)}>
                  <option value="">{t.service.cityPlaceholder}</option>
                  {PROVINCE_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              </FormRow>
              <FormRow label={t.service.district} required>
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
              </FormRow>
              <FormRow label={t.service.email} required>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </FormRow>
              <FormRow label={t.service.phone} required>
                <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </FormRow>
              <FormRow label={t.service.contactName} required>
                <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
              </FormRow>
              <FormRow label={t.service.contactGsm} required>
                <Input type="tel" value={form.contactGsm} onChange={(e) => set("contactGsm", e.target.value)} />
              </FormRow>
            </div>
          </section>

          <p data-paylasim className="text-sm text-zw-grey-700">
            {t.service.sharingNotice}
          </p>
          <label className="-mt-5 flex items-start gap-2.5 text-sm text-zw-grey-700">
            <input
              type="checkbox"
              className="mt-0.5 accent-zw-red-600"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              {t.service.consentBefore}
              <Link
                href="/yasal/gizlilik"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zw-ink underline underline-offset-2 hover:text-zw-red-600"
              >
                {t.service.consentLink}
              </Link>
              {t.service.consentAfter}
            </span>
          </label>
          <KvkkNotice className="-mt-5 ml-6" />

          {bot.field}
          {error && <Alert tone="danger">{error}</Alert>}

          <Button type="submit" size="lg" disabled={sending}>
            {t.service.submit}
          </Button>
        </form>
      </div>
    </>
  );
}

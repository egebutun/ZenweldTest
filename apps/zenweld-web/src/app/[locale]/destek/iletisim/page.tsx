"use client";

import { useState } from "react";
import { ExternalLink, Navigation } from "lucide-react";
import { Alert, Button, FormRow, Input, Textarea } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { useT } from "@/lib/i18n-client";
import { CONTACT, mapDirectionsUrl, mapEmbedUrl, type Office } from "@/lib/menu";

export default function ContactPage() {
  const t = useT();
  const [sent, setSent] = useState(false);

  return (
    <>
      <PageHero title={t.support.contactTitle} subtitle={t.support.subtitle} />

      <div className="zw-container py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
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

          {/* Ofisler: iletisim bilgileri ve haritalar */}
          <aside className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold uppercase">
                {t.support.officesTitle}
              </h2>
              <p className="mt-1.5 text-sm text-zw-grey-600">{t.support.officesSubtitle}</p>
            </div>
            {CONTACT.offices.map((office) => (
              <OfficeCard key={office.id} office={office} />
            ))}
          </aside>
        </div>

      </div>
    </>
  );
}

/** Ofis karti: adres, telefonlar, harita ve yol tarifi baglantisi. */
function OfficeCard({ office }: { office: Office }) {
  const t = useT();

  return (
    <div className="overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white">
      <div className="p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-zw-red-600">
          {office.city}
        </div>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug text-zw-ink">
          {office.legalName ?? `Zenweld ${office.city}`}
        </h3>
        <div className="mt-2.5 space-y-0.5 text-sm text-zw-grey-700">
          {office.addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <div className="mt-2.5 space-y-0.5 text-sm">
          {office.phones.map((phone) => (
            <div key={phone}>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="font-semibold text-zw-ink hover:text-zw-red-600"
              >
                {phone}
              </a>
            </div>
          ))}
        </div>
        <a
          href={`mailto:${CONTACT.email}`}
          className="mt-2.5 inline-block text-sm text-zw-grey-700 hover:text-zw-red-600"
          title={t.support.emailNote}
        >
          {CONTACT.email}
        </a>
      </div>

      {/* Harita gec yuklenir. Uzerine tiklamak da alttaki buton da
          Google Haritalar'da yol tarifini acar. */}
      <div className="relative aspect-[4/3] w-full border-t border-zw-grey-200 bg-zw-grey-100">
        <iframe
          src={mapEmbedUrl(office)}
          title={`${office.city} harita`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      <a
        href={mapDirectionsUrl(office)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border-t border-zw-grey-200 bg-zw-grey-50 py-3 text-sm font-semibold text-zw-ink transition-colors hover:bg-zw-red-600 hover:text-white"
      >
        <Navigation size={15} />
        {t.support.directions}
        <ExternalLink size={13} className="opacity-60" />
      </a>
    </div>
  );
}

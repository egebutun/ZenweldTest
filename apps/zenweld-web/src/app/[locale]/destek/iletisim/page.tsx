"use client";

import { useState } from "react";
import { ExternalLink, Mail, MapPin, Navigation, Phone } from "lucide-react";
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
              <Mail size={20} className="shrink-0 text-zw-red-600" />
              <a href={`mailto:${CONTACT.email}`} className="text-sm hover:text-zw-red-600">
                {CONTACT.email}
              </a>
            </div>
            <p className="text-xs leading-relaxed text-zw-grey-600">
              {t.support.emailNote}
            </p>
            {CONTACT.offices.map((office) => (
              <div key={office.id} className="border-t border-zw-grey-300 pt-4">
                <div className="flex gap-3">
                  <MapPin size={20} className="shrink-0 text-zw-red-600" />
                  <div className="text-sm">
                    <div className="font-semibold">{office.city}</div>
                    {office.addressLines.map((line) => (
                      <div key={line} className="text-zw-grey-600">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex gap-3">
                  <Phone size={20} className="shrink-0 text-zw-red-600" />
                  <div className="text-sm">
                    {office.phones.map((phone) => (
                      <div key={phone}>
                        <a
                          href={`tel:${phone.replace(/\s/g, "")}`}
                          className="hover:text-zw-red-600"
                        >
                          {phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </aside>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold uppercase">{t.support.officesTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zw-grey-600">{t.support.officesSubtitle}</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {CONTACT.offices.map((office) => (
              <OfficeCard key={office.id} office={office} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

/** Ofis karti: adres, telefonlar ve tiklaninca yol tarifi acan harita. */
function OfficeCard({ office }: { office: Office }) {
  const t = useT();

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[4px] border border-zw-grey-200 bg-white">
      <div className="flex-1 p-6">
        <h3 className="font-display text-xl font-bold text-zw-ink">
          {office.legalName ?? `Zenweld ${office.city}`}
        </h3>
        <div className="mt-3 space-y-0.5 text-sm text-zw-grey-700">
          {office.addressLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
        <div className="mt-3 space-y-0.5 text-sm">
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
          className="mt-3 inline-block text-sm text-zw-grey-700 hover:text-zw-red-600"
        >
          {CONTACT.email}
        </a>
      </div>

      {/* Harita gec yuklenir; tiklaninca Google Haritalar'da yol tarifi acilir. */}
      <a
        href={mapDirectionsUrl(office)}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block h-[280px] shrink-0 border-t border-zw-grey-200"
        aria-label={`${office.city} — ${t.support.directions}`}
      >
        <iframe
          src={mapEmbedUrl(office)}
          title={`${office.city} harita`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="pointer-events-none h-full w-full border-0"
        />
        <span className="absolute inset-0" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-[4px] bg-white px-3 py-2 text-sm font-semibold text-zw-ink shadow-md transition-colors group-hover:bg-zw-red-600 group-hover:text-white">
          <Navigation size={15} />
          {t.support.directions}
          <ExternalLink size={13} className="opacity-60" />
        </span>
      </a>
    </div>
  );
}

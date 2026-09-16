"use client";

import { FileQuestion, MapPin, MessageSquare, Wrench } from "lucide-react";
import { PageHero } from "@/components/common/PageShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT } from "@/lib/i18n-client";
import { CONTACT } from "@/lib/menu";

export default function SupportPage() {
  const t = useT();

  const cards = [
    { href: "/destek/sss", Icon: FileQuestion, title: t.support.faqTitle },
    { href: "/destek/iletisim", Icon: MessageSquare, title: t.support.contactTitle },
    { href: "/destek/servis-agi", Icon: Wrench, title: t.support.serviceTitle },
    { href: "/nereden-alabilirim", Icon: MapPin, title: t.nav.findDealer },
  ];

  return (
    <>
      <PageHero title={t.support.title} subtitle={t.support.subtitle} />

      <div className="zw-container py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ href, Icon, title }) => (
            <LocaleLink
              key={href}
              href={href}
              className="rounded-[4px] border border-zw-grey-200 p-6 transition-colors hover:border-zw-red-600"
            >
              <Icon size={26} className="text-zw-red-600" />
              <h2 className="mt-3 font-display text-xl font-semibold uppercase">{title}</h2>
              <p className="mt-1.5 text-sm text-zw-grey-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </LocaleLink>
          ))}
        </div>

        <div className="mt-10 rounded-[4px] bg-zw-ink px-8 py-8 text-white">
          <h2 className="font-display text-2xl font-bold uppercase">{t.supportCta.title}</h2>
          <p className="mt-2 text-zw-grey-300">{t.supportCta.text}</p>
          <p className="mt-4 text-lg font-semibold">
            {CONTACT.phone} · {CONTACT.email}
          </p>
        </div>
      </div>
    </>
  );
}

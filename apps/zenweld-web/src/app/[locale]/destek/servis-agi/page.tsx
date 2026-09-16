"use client";

import { useMemo } from "react";
import { Wrench } from "lucide-react";
import { listDealers, useDatabase } from "@zenweld/store";
import { Badge } from "@zenweld/ui";
import { PageHero } from "@/components/common/PageShell";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useT, useText } from "@/lib/i18n-client";

export default function ServiceNetworkPage() {
  const t = useT();
  const text = useText();
  const db = useDatabase();

  const services = useMemo(
    () => listDealers(db).filter((d) => d.badges.includes("yetkili-servis")),
    [db],
  );

  return (
    <>
      <PageHero
        title={t.support.serviceTitle}
        subtitle="Yetkili servis noktalarımızda bakım, onarım ve kalibrasyon hizmeti alabilirsiniz."
      />

      <div className="zw-container py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((d) => (
            <div key={d.id} className="rounded-[4px] border border-zw-grey-200 p-5">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-zw-red-600" />
                <h2 className="font-display text-lg font-semibold uppercase leading-tight">
                  {d.name}
                </h2>
              </div>
              <p className="mt-2 text-sm text-zw-grey-600">{d.address}</p>
              <p className="mt-1 text-sm text-zw-grey-500">{text(d.workingHours)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="dark">{t.dealers.badgeService}</Badge>
                <Badge tone="grey">{d.city}</Badge>
              </div>
              <a
                href={`tel:${d.phone.replace(/\s/g, "")}`}
                className="mt-3 inline-block text-sm font-semibold text-zw-red-600 hover:underline"
              >
                {d.phone}
              </a>
            </div>
          ))}
        </div>

        <LocaleLink
          href="/nereden-alabilirim"
          className="mt-8 inline-block font-semibold text-zw-red-600 hover:underline"
        >
          {t.dealers.title} →
        </LocaleLink>
      </div>
    </>
  );
}

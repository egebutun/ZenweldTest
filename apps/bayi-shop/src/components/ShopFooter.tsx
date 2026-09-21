"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { ZenweldBayiLogo } from "@zenweld/ui";
import { LocaleLink } from "./LocaleLink";
import { useT } from "@/lib/i18n-client";
import { STORE } from "@/lib/store-config";
import { formatPrice } from "@/lib/format";

export function ShopFooter() {
  const t = useT();

  return (
    <footer className="mt-16 border-t border-zw-grey-200 bg-zw-grey-50">
      <div className="zw-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <ZenweldBayiLogo height={34} />
          <p className="mt-4 text-sm text-zw-grey-600">{STORE.legalName}</p>
          <p className="mt-2 text-xs text-zw-grey-500">{t.shop.authorizedDealer}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase">{t.footer.support}</h3>
          <ul className="space-y-2 text-sm text-zw-grey-600">
            <li>
              <LocaleLink href="/kargo-iade" className="hover:text-zw-red-600">
                Kargo & İade
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/iletisim" className="hover:text-zw-red-600">
                {t.footer.contact}
              </LocaleLink>
            </li>
            <li>
              <LocaleLink href="/hakkimizda" className="hover:text-zw-red-600">
                {t.footer.about}
              </LocaleLink>
            </li>
            <li>
              <a
                href={STORE.zenweldUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zw-red-600"
              >
                Zenweld marka sitesi
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase">{t.footer.contact}</h3>
          <ul className="space-y-2 text-sm text-zw-grey-600">
            <li className="flex gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-zw-red-600" />
              {STORE.phone}
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-zw-red-600" />
              {STORE.email}
            </li>
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-zw-red-600" />
              {STORE.address}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase">Kargo</h3>
          <p className="text-sm text-zw-grey-600">
            {formatPrice(STORE.freeShippingOver, "tr")} ve üzeri siparişlerde kargo ücretsiz.
          </p>
          <p className="mt-2 text-sm text-zw-grey-500">{STORE.workingHours}</p>
        </div>
      </div>

      <div className="border-t border-zw-grey-200">
        <div className="zw-container flex flex-col gap-2 py-4 text-xs text-zw-grey-500 sm:flex-row sm:justify-between">
          <span>© 2026 {STORE.legalName}</span>
          <span>{t.shop.demoCheckout}</span>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { useState } from "react";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { ZenweldLogo } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT } from "@/lib/i18n-client";
import { CONTACT, useFooterMenu } from "@/lib/menu";
import { locales, localeNames, switchLocaleInPath } from "@zenweld/i18n";
import { usePathname, useRouter } from "next/navigation";

export function Footer() {
  const t = useT();
  const locale = useLocale();
  const columns = useFooterMenu();
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="mt-16 border-t border-zw-grey-200 bg-white">
      <div className="zw-container py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-sm font-bold text-zw-ink">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <LocaleLink
                      href={link.href}
                      className="text-sm text-zw-grey-600 transition-colors hover:text-zw-red-600"
                    >
                      {link.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 border-t border-zw-grey-200 pt-10 lg:grid-cols-2">
          <div>
            <ZenweldLogo className="h-8 w-auto" />
            <p className="mt-4 max-w-sm text-sm text-zw-grey-500">{CONTACT.address}</p>
            <p className="mt-1 text-sm text-zw-grey-500">
              {CONTACT.phone} · {CONTACT.email}
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { Icon: Instagram, href: CONTACT.social.instagram, label: "Instagram" },
                { Icon: Facebook, href: CONTACT.social.facebook, label: "Facebook" },
                { Icon: Youtube, href: CONTACT.social.youtube, label: "YouTube" },
                { Icon: Linkedin, href: CONTACT.social.linkedin, label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-zw-ink transition-colors hover:text-zw-red-600"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:justify-self-end lg:text-right">
            {subscribed ? (
              <p className="text-sm font-semibold text-emerald-700">
                {t.footer.newsletterThanks}
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setSubscribed(true);
                }}
                className="flex w-full max-w-md gap-2 lg:ml-auto"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.footer.newsletterPlaceholder}
                  className="h-12 flex-1 rounded-[4px] border border-zw-grey-300 px-4 text-sm outline-none focus:border-zw-ink"
                />
                <button
                  type="submit"
                  className="h-12 shrink-0 rounded-[4px] bg-zw-ink px-6 text-sm font-semibold uppercase text-white transition-colors hover:bg-zw-grey-800"
                >
                  {t.footer.newsletterCta}
                </button>
              </form>
            )}
            <label className="mt-3 flex items-start gap-2 text-xs text-zw-grey-500 lg:justify-end">
              <input type="checkbox" defaultChecked className="mt-0.5 accent-zw-red-600" />
              <span className="max-w-md">{t.footer.newsletterConsent}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-zw-grey-100">
        <div className="zw-container flex flex-col gap-3 py-5 text-xs text-zw-grey-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.footer.rights}</span>
          <span className="max-w-xl text-zw-grey-500">{t.footer.demoDisclaimer}</span>
          <div className="flex items-center gap-2">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => router.push(switchLocaleInPath(pathname, l))}
                className={`rounded-[3px] px-2 py-1 font-semibold ${
                  l === locale ? "bg-zw-ink text-white" : "hover:bg-zw-grey-200"
                }`}
              >
                {localeNames[l]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

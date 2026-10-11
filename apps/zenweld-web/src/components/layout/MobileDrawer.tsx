"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { ZenweldLogo } from "@zenweld/ui";
import { locales, localeNames, switchLocaleInPath } from "@zenweld/i18n";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT } from "@/lib/i18n-client";
import type { TopMenu } from "@/lib/menu";

export function MobileDrawer({ menus, onClose }: { menus: TopMenu[]; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[200] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white">
        <div className="flex items-center justify-between border-b border-zw-grey-200 px-4 py-4">
          <ZenweldLogo className="h-7 w-auto" />
          <button onClick={onClose} aria-label={t.common.close} className="p-1">
            <X size={22} />
          </button>
        </div>

        <nav className="py-2">
          {menus.map((menu) => (
            <div key={menu.id} className="border-b border-zw-grey-100">
              <button
                onClick={() => setExpanded(expanded === menu.id ? null : menu.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold"
              >
                {menu.label}
                <ChevronDown
                  size={18}
                  className={`text-zw-grey-500 transition-transform ${expanded === menu.id ? "rotate-180" : ""}`}
                />
              </button>
              {expanded === menu.id && (
                <div className="bg-zw-grey-50 pb-2">
                  {menu.columns.map((col) => (
                    <div key={col.label || col.href} className="px-4 py-2">
                      {col.label && (
                        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zw-grey-500">
                          {col.label}
                        </div>
                      )}
                      {col.links.map((link) => (
                        <LocaleLink
                          key={link.href}
                          href={link.href}
                          onClick={onClose}
                          className="block py-1.5 text-sm text-zw-grey-700"
                        >
                          {link.label}
                        </LocaleLink>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <LocaleLink
            href="/teklif-al"
            onClick={onClose}
            className="block border-b border-zw-grey-100 px-4 py-3.5 font-semibold"
          >
            {t.product.requestQuote}
          </LocaleLink>
        </nav>

        <div className="flex gap-2 p-4">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => {
                router.push(switchLocaleInPath(pathname, l));
                onClose();
              }}
              className={`flex-1 rounded-[4px] border px-3 py-2 text-sm font-semibold uppercase ${
                l === locale
                  ? "border-zw-ink bg-zw-ink text-white"
                  : "border-zw-grey-300 text-zw-grey-600"
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

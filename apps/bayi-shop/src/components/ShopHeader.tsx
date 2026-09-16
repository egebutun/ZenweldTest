"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Phone, Search, ShoppingCart, User as UserIcon, X } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { locales, localeNames, switchLocaleInPath } from "@zenweld/i18n";
import { useDatabase } from "@zenweld/store";
import { ZenweldBayiLogo, Badge } from "@zenweld/ui";
import { LocaleLink } from "./LocaleLink";
import { useHref, useLocale, useT } from "@/lib/i18n-client";
import { useCart } from "@/lib/cart";
import { STORE } from "@/lib/store-config";
import { formatPrice } from "@/lib/format";

export function ShopHeader() {
  const t = useT();
  const locale = useLocale();
  const href = useHref();
  const cart = useCart();
  const db = useDatabase();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = db.categoryGroups.filter((g) => g.section === "ekipmanlar").slice(0, 6);

  return (
    <header className="sticky top-0 z-[100] bg-white shadow-sm">
      {/* Yetkili bayi bandi */}
      <div className="bg-zw-ink px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
        <span className="mr-2 rounded-[2px] bg-zw-red-600 px-1.5 py-0.5">Demo</span>
        {t.shop.authorizedDealer} · {STORE.phone}
      </div>

      <div className="zw-container flex h-[72px] items-center gap-4">
        <button
          className="-ml-1 p-2 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Menü"
        >
          <Menu size={22} />
        </button>

        <LocaleLink href="/" className="shrink-0">
          <ZenweldBayiLogo className="h-7 w-auto sm:h-8" />
        </LocaleLink>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(href(`/magaza?q=${encodeURIComponent(query)}`));
          }}
          className="relative ml-auto hidden max-w-md flex-1 md:block"
        >
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="h-10 w-full rounded-[4px] border border-zw-grey-300 pl-10 pr-4 text-sm outline-none focus:border-zw-ink"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <a
            href={`tel:${STORE.phone.replace(/\s/g, "")}`}
            className="hidden items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-semibold hover:bg-zw-grey-100 lg:flex"
          >
            <Phone size={17} />
            {STORE.phone}
          </a>

          <LocaleLink
            href={user ? "/hesabim" : "/giris"}
            className="rounded-[4px] p-2 hover:bg-zw-grey-100"
            aria-label={t.nav.account}
          >
            <UserIcon size={20} />
          </LocaleLink>

          {user && (
            <button
              onClick={() => {
                logout();
                router.push(href("/"));
              }}
              className="hidden rounded-[4px] px-2 py-2 text-xs font-semibold text-zw-grey-600 hover:bg-zw-grey-100 sm:block"
            >
              {t.nav.logout}
            </button>
          )}

          <LocaleLink
            href="/sepet"
            className="relative flex items-center gap-2 rounded-[4px] bg-zw-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-zw-red-700"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">
              {cart.count > 0 ? formatPrice(cart.subtotal, locale) : t.shop.cart}
            </span>
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zw-ink px-1 text-[10px] font-bold">
                {cart.count}
              </span>
            )}
          </LocaleLink>

          <div className="ml-1 hidden gap-1 sm:flex">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => router.push(switchLocaleInPath(pathname, l))}
                className={`rounded-[3px] px-1.5 py-1 text-[11px] font-bold uppercase ${
                  l === locale ? "bg-zw-ink text-white" : "text-zw-grey-500 hover:bg-zw-grey-100"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="hidden border-t border-zw-grey-200 lg:block">
        <div className="zw-container flex items-center gap-1 py-1">
          <LocaleLink
            href="/magaza"
            className="rounded-[4px] px-3 py-2 text-sm font-semibold hover:bg-zw-grey-100"
          >
            {t.common.all}
          </LocaleLink>
          {categories.map((g) => (
            <LocaleLink
              key={g.id}
              href={`/magaza?grup=${g.slug}`}
              className="rounded-[4px] px-3 py-2 text-sm font-semibold text-zw-grey-700 hover:bg-zw-grey-100 hover:text-zw-ink"
            >
              {g.name[locale]}
            </LocaleLink>
          ))}
          <a
            href={STORE.zenweldUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-2 px-3 py-2 text-sm font-semibold text-zw-grey-500 hover:text-zw-red-600"
          >
            <Badge tone="grey">zenweld.com</Badge>
            Marka sitesi
          </a>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-white p-5">
            <div className="mb-6 flex items-center justify-between">
              <ZenweldBayiLogo className="h-7 w-auto" />
              <button onClick={() => setMenuOpen(false)} aria-label={t.common.close}>
                <X size={22} />
              </button>
            </div>
            <nav className="space-y-1">
              <LocaleLink
                href="/magaza"
                onClick={() => setMenuOpen(false)}
                className="block border-b border-zw-grey-100 py-3 font-semibold"
              >
                {t.common.all}
              </LocaleLink>
              {categories.map((g) => (
                <LocaleLink
                  key={g.id}
                  href={`/magaza?grup=${g.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-zw-grey-100 py-3"
                >
                  {g.name[locale]}
                </LocaleLink>
              ))}
              <LocaleLink
                href="/hakkimizda"
                onClick={() => setMenuOpen(false)}
                className="block border-b border-zw-grey-100 py-3"
              >
                {t.footer.about}
              </LocaleLink>
              <LocaleLink
                href="/iletisim"
                onClick={() => setMenuOpen(false)}
                className="block border-b border-zw-grey-100 py-3"
              >
                {t.footer.contact}
              </LocaleLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

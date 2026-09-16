"use client";

import { usePathname } from "next/navigation";
import {
  FileText,
  Heart,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  User as UserIcon,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "@zenweld/auth";
import { Badge, Button, EmptyState } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT } from "@/lib/i18n-client";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const locale = useLocale();
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (!ready) {
    return <div className="zw-container py-20 text-center text-zw-grey-500">{t.common.loading}</div>;
  }

  if (!user) {
    return (
      <div className="zw-container py-20">
        <EmptyState
          icon={<UserIcon size={40} />}
          title={t.auth.loginTitle}
          text={t.auth.loginSubtitle}
          action={
            <LocaleLink href="/giris">
              <Button size="lg">{t.nav.login}</Button>
            </LocaleLink>
          }
        />
      </div>
    );
  }

  const items = [
    { href: "/hesabim/profil", label: t.account.profile, Icon: UserIcon, roles: ["individual", "business", "dealer", "admin"] },
    { href: "/hesabim/stok-bildirimi", label: t.account.stockNotice, Icon: Store, roles: ["dealer"] },
    { href: "/hesabim/tekliflerim", label: t.account.myQuotes, Icon: FileText, roles: ["business", "dealer"] },
    { href: "/hesabim/siparislerim", label: t.account.myOrders, Icon: Package, roles: ["individual", "dealer"] },
    { href: "/hesabim/favorilerim", label: t.account.favourites, Icon: Heart, roles: ["individual", "business", "dealer", "admin"] },
    { href: "/hesabim/garantilerim", label: t.account.warranties, Icon: ShieldCheck, roles: ["individual", "business", "dealer"] },
    { href: "/hesabim/adreslerim", label: t.account.addresses, Icon: MapPin, roles: ["individual", "business", "dealer"] },
  ].filter((i) => i.roles.includes(user.role));

  return (
    <div className="zw-container py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold uppercase">{t.account.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zw-grey-600">
          {t.account.welcome.replace("{name}", `${user.firstName} ${user.lastName}`)}
          <Badge tone="dark">{ROLE_LABELS[user.role][locale]}</Badge>
          {user.status === "pending" && <Badge tone="amber">Onay Bekliyor</Badge>}
          {user.role === "admin" && (
            <LocaleLink
              href="/admin"
              className="font-semibold text-zw-red-600 hover:underline"
            >
              {t.nav.adminPanel} →
            </LocaleLink>
          )}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="space-y-1">
            {items.map(({ href, label, Icon }) => {
              const active = pathname.endsWith(href);
              return (
                <LocaleLink
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-[4px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-zw-ink text-white"
                      : "text-zw-grey-700 hover:bg-zw-grey-100"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                </LocaleLink>
              );
            })}
            <LocaleLink
              href="/cikis"
              className="mt-3 block rounded-[4px] border border-zw-grey-300 px-3 py-2.5 text-center text-sm font-semibold text-zw-grey-700 hover:border-zw-ink"
            >
              {t.nav.logout}
            </LocaleLink>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

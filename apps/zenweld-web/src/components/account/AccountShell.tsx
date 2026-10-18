"use client";

import { usePathname } from "next/navigation";
import {
  FileText,
  Heart,
  MapPin,
  Package,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "@zenweld/auth";
import { Badge, Button, EmptyState } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";

export function AccountShell({ children }: { children: React.ReactNode }) {
  const t = useT();
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
            <Link href="/giris">
              <Button size="lg">{t.nav.login}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const items = [
    { href: "/hesabim/profil", label: t.account.profile, Icon: UserIcon },
    { href: "/hesabim/tekliflerim", label: t.account.myQuotes, Icon: FileText },
    { href: "/hesabim/siparislerim", label: t.account.myOrders, Icon: Package },
    { href: "/hesabim/favorilerim", label: t.account.favourites, Icon: Heart },
    { href: "/hesabim/garantilerim", label: t.account.warranties, Icon: ShieldCheck },
    { href: "/hesabim/adreslerim", label: t.account.addresses, Icon: MapPin },
  ];

  return (
    <div className="zw-container py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold uppercase">{t.account.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zw-grey-600">
          {t.account.welcome.replace("{name}", `${user.firstName} ${user.lastName}`)}
          <Badge tone="dark">{ROLE_LABELS[user.role]}</Badge>
          {user.status === "pending" && <Badge tone="amber">Onay Bekliyor</Badge>}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <nav className="space-y-1">
            {items.map(({ href, label, Icon }) => {
              // Alt sayfalarda da (siparis detayi gibi) sekme secili kalir.
              const target = href;
              const active = pathname === target || pathname.startsWith(`${target}/`);
              return (
                <Link
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
                </Link>
              );
            })}
            <Link
              href="/cikis"
              className="mt-3 block rounded-[4px] border border-zw-grey-300 px-3 py-2.5 text-center text-sm font-semibold text-zw-grey-700 hover:border-zw-ink"
            >
              {t.nav.logout}
            </Link>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

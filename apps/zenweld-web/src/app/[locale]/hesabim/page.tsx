"use client";

import { FileText, Heart, Package, ShieldCheck, Store } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { ordersForUser, quotesForUser, useDatabase } from "@zenweld/store";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useFavourites } from "@/lib/favourites";
import { useT } from "@/lib/i18n-client";

export default function AccountHome() {
  const t = useT();
  const { user } = useAuth();
  const db = useDatabase();
  const favourites = useFavourites();

  if (!user) return null;

  const quotes = quotesForUser(user.id, db);
  const orders = ordersForUser(user.id, db);
  const warranties = db.warranties.filter((w) => w.email === user.email);

  const cards = [
    { href: "/hesabim/tekliflerim", label: t.account.myQuotes, value: quotes.length, Icon: FileText, show: user.role === "business" || user.role === "dealer" },
    { href: "/hesabim/siparislerim", label: t.account.myOrders, value: orders.length, Icon: Package, show: user.role !== "admin" },
    { href: "/hesabim/favorilerim", label: t.account.favourites, value: favourites.ids.length, Icon: Heart, show: true },
    { href: "/hesabim/garantilerim", label: t.account.warranties, value: warranties.length, Icon: ShieldCheck, show: user.role !== "admin" },
    { href: "/hesabim/stok-bildirimi", label: t.account.stockNotice, value: "→", Icon: Store, show: user.role === "dealer" },
  ].filter((c) => c.show);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ href, label, value, Icon }) => (
        <LocaleLink
          key={href}
          href={href}
          className="rounded-[4px] border border-zw-grey-200 p-5 transition-colors hover:border-zw-ink"
        >
          <Icon size={22} className="text-zw-red-600" />
          <div className="mt-3 font-display text-3xl font-bold">{value}</div>
          <div className="text-sm text-zw-grey-600">{label}</div>
        </LocaleLink>
      ))}
    </div>
  );
}

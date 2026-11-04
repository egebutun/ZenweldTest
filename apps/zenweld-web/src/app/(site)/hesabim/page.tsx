"use client";

import { FileText, Heart, Package, ShieldCheck } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import Link from "next/link";
import { useFavourites } from "@/lib/favourites";
import { useT } from "@/lib/i18n-client";
import { useMemberOrders } from "@/lib/member-orders";
import { useMemberRecords } from "@/lib/member-records";

export default function AccountHome() {
  const t = useT();
  const { user } = useAuth();
  const favourites = useFavourites();
  const { orders, ready } = useMemberOrders();
  const records = useMemberRecords();

  if (!user) return null;

  const quotes = records.ready ? records.quotes.length : "…";
  const warranties = records.ready ? records.warranties.length : "…";

  const cards = [
    { href: "/hesabim/tekliflerim", label: t.account.myQuotes, value: quotes, Icon: FileText, show: user.role !== "admin" },
    { href: "/hesabim/siparislerim", label: t.account.myOrders, value: ready ? orders.length : "…", Icon: Package, show: user.role !== "admin" },
    { href: "/hesabim/favorilerim", label: t.account.favourites, value: favourites.ids.length, Icon: Heart, show: true },
    { href: "/hesabim/garantilerim", label: t.account.warranties, value: warranties, Icon: ShieldCheck, show: user.role !== "admin" },
  ].filter((c) => c.show);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ href, label, value, Icon }) => (
        <Link
          key={href}
          href={href}
          className="rounded-[4px] border border-zw-grey-200 p-5 transition-colors hover:border-zw-ink"
        >
          <Icon size={22} className="text-zw-red-600" />
          <div className="mt-3 font-display text-3xl font-bold">{value}</div>
          <div className="text-sm text-zw-grey-600">{label}</div>
        </Link>
      ))}
    </div>
  );
}

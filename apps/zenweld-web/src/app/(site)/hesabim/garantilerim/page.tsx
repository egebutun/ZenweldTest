"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { useAuth } from "@zenweld/auth";
import { findProductById, useDatabase, warrantiesForEmail } from "@zenweld/store";
import { Badge, Button, EmptyState } from "@zenweld/ui";
import Link from "next/link";
import { useT } from "@/lib/i18n-client";
import { formatDate } from "@zenweld/utils";

export default function MyWarrantiesPage() {
  const t = useT();
  const { user } = useAuth();
  const db = useDatabase();

  if (!user) return null;
  const records = warrantiesForEmail(user.email, db);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck size={38} />}
        title={t.account.noWarranties}
        action={
          <Link href="/garanti/kayit">
            <Button>{t.explore.registerWarranty}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/garanti/kayit">
          <Button leftIcon={<Plus size={17} />}>{t.account.newWarranty}</Button>
        </Link>
      </div>
      {records.map((w) => {
        const product = findProductById(w.productId, db);
        return (
          <div key={w.id} className="rounded-[4px] border border-zw-grey-200 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-lg font-bold">{product?.name ?? w.productId}</span>
              {w.extended && <Badge tone="green">{t.warranty.extended}</Badge>}
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zw-grey-500">{t.warranty.serialNumber}</dt>
                <dd className="font-semibold">{w.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-zw-grey-500">{t.warranty.registeredAt}</dt>
                <dd className="font-semibold">{formatDate(w.registeredAt)}</dd>
              </div>
              <div>
                <dt className="text-zw-grey-500">{t.warranty.expiresAt}</dt>
                <dd className="font-semibold text-zw-red-600">
                  {formatDate(w.expiresAt)}
                </dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

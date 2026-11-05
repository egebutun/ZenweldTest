"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { byProductOrder, normalizeEmail, type Coupon, type CouponDiscountType } from "@zenweld/data";
import { couponRedemptions, useDatabase } from "@zenweld/store";
import { Badge, Button, Checkbox, FormRow, Input, Select } from "@zenweld/ui";
import { formatDateTime, formatPrice, fromDateTimeLocal, toDateTimeLocal } from "@zenweld/utils";
import { useSalesActions } from "@/lib/admin-sales";
import { ContentFormShell, FormPanel, useContentForm } from "./content-form";

/**
 * KUPON FORMU (Satis > Kuponlar; KARARLAR K-85, IS-KURALLARI › 21)
 *
 * Sekmeler: temel bilgiler (kod, indirim, tarihler, sinirlar), kapsam
 * (butun urunler ya da secilen urun ve kategoriler), kimler kullanabilir
 * (herkes ya da kisiye ozel: e-posta adresleri, KARARLAR K-86) ve
 * duzenlemede kuponun kullanildigi siparisler. Veritabani modunda kayit
 * sunucuya gider (lib/admin-sales.ts).
 */

/** Formdaki hali: sayilar yazildigi gibi tutulur, kayitta cevrilir. */
interface CouponFormState {
  code: string;
  name: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minCartTotal: string;
  startsAt?: string;
  endsAt?: string;
  totalUsageLimit: string;
  perUserLimit: string;
  scope: Coupon["scope"];
  productIds: string[];
  categoryIds: string[];
  audience: Coupon["audience"];
  customerEmails: string[];
  active: boolean;
}

const text = (n?: number) => (n === undefined ? "" : String(n));
/** Bos alan: sinir yok (undefined). Virgul de kabul edilir. */
const numberOrUndefined = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(",", ".")));

function toForm(c?: Coupon): CouponFormState {
  return {
    code: c?.code ?? "",
    name: c?.name ?? "",
    discountType: c?.discountType ?? "percent",
    discountValue: text(c?.discountValue),
    minCartTotal: text(c?.minCartTotal),
    startsAt: c?.startsAt,
    endsAt: c?.endsAt,
    totalUsageLimit: text(c?.totalUsageLimit),
    perUserLimit: text(c?.perUserLimit),
    scope: c?.scope ?? "all",
    productIds: c?.productIds ?? [],
    categoryIds: c?.categoryIds ?? [],
    audience: c?.audience ?? "all",
    customerEmails: c?.customerEmails ?? [],
    active: c?.active ?? true,
  };
}

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const db = useDatabase();
  const actions = useSalesActions();
  const isNew = !coupon;
  const form = useContentForm<CouponFormState>(toForm(coupon));
  const { draft, set } = form;
  const usage = coupon ? couponRedemptions(coupon.id, db) : [];

  const submit = async () => {
    form.setError(null);
    const draftCoupon = {
      code: draft.code,
      name: draft.name,
      discountType: draft.discountType,
      discountValue: Number(draft.discountValue.replace(",", ".")),
      minCartTotal: numberOrUndefined(draft.minCartTotal),
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      totalUsageLimit: numberOrUndefined(draft.totalUsageLimit),
      perUserLimit: numberOrUndefined(draft.perUserLimit),
      scope: draft.scope,
      productIds: draft.productIds,
      categoryIds: draft.categoryIds,
      audience: draft.audience,
      customerEmails: draft.customerEmails,
      active: draft.active,
    };
    const result = await actions.saveCoupon(draftCoupon, coupon);
    if (!result.ok) {
      const tab = /ürün ya da kategori/.test(result.error) ? "kapsam" : /e-posta/.test(result.error) ? "kisiler" : "temel";
      return form.fail(result.error, tab);
    }
    if (isNew && result.id) router.push(`/yonetim/kuponlar/${result.id}`);
    else form.flashSaved();
  };

  const targetCount = draft.productIds.length + draft.categoryIds.length;

  return (
    <ContentFormShell
      form={form}
      onSubmit={() => void submit()}
      pending={actions.pending}
      savedText="Kupon kaydedildi."
      submitLabel={isNew ? "Kuponu Oluştur" : "Değişiklikleri Kaydet"}
      tabs={[
        { id: "temel", label: "Temel Bilgiler" },
        { id: "kapsam", label: "Kapsam", badge: draft.scope === "targets" ? targetCount : undefined },
        {
          id: "kisiler",
          label: "Kimler Kullanabilir",
          badge: draft.audience === "customers" ? draft.customerEmails.length : undefined,
        },
        ...(isNew ? [] : [{ id: "kullanimlar", label: "Kullanımlar", badge: usage.length }]),
      ]}
    >
      {form.tab === "temel" && (
        <FormPanel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow
              label="Kupon Kodu"
              htmlFor="coupon-code"
              required
              hint="Müşterinin sepette yazacağı kod. Harf (Türkçe karakter olmadan), rakam ve tire; büyük/küçük harf fark etmez."
            >
              <Input
                id="coupon-code"
                required
                value={draft.code}
                maxLength={30}
                className="font-mono uppercase"
                onChange={(e) => set("code", e.target.value.toUpperCase())}
              />
            </FormRow>
            <FormRow label="Ad / Not" htmlFor="coupon-name" hint="Yalnızca panelde görünür.">
              <Input id="coupon-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormRow label="İndirim Türü" htmlFor="coupon-type" required>
              <Select
                id="coupon-type"
                value={draft.discountType}
                onChange={(e) => set("discountType", e.target.value as CouponDiscountType)}
              >
                <option value="percent">Yüzde (%)</option>
                <option value="amount">Sabit tutar (₺, KDV dahil)</option>
              </Select>
            </FormRow>
            <FormRow
              label={draft.discountType === "percent" ? "İndirim Oranı (%)" : "İndirim Tutarı (₺)"}
              htmlFor="coupon-value"
              required
              hint={
                draft.discountType === "percent"
                  ? "Kupona uyan ürünlerin toplamına uygulanır."
                  : "Siparişte bir kez düşülür; uyan ürünlerin toplamını geçmez."
              }
            >
              <Input
                id="coupon-value"
                required
                inputMode="numeric"
                value={draft.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
              />
            </FormRow>
            <FormRow label="En Az Sepet Tutarı (₺)" htmlFor="coupon-min" hint="Ürünlerin KDV dahil toplamı; boşsa sınır yok.">
              <Input
                id="coupon-min"
                inputMode="numeric"
                value={draft.minCartTotal}
                onChange={(e) => set("minCartTotal", e.target.value)}
              />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Başlangıç" htmlFor="coupon-start" hint="Boşsa hemen geçerli.">
              <Input
                id="coupon-start"
                type="datetime-local"
                value={toDateTimeLocal(draft.startsAt)}
                onChange={(e) => set("startsAt", fromDateTimeLocal(e.target.value))}
              />
            </FormRow>
            <FormRow label="Bitiş" htmlFor="coupon-end" hint="Boşsa süresiz.">
              <Input
                id="coupon-end"
                type="datetime-local"
                value={toDateTimeLocal(draft.endsAt)}
                onChange={(e) => set("endsAt", fromDateTimeLocal(e.target.value))}
              />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Toplam Kullanım Sınırı" htmlFor="coupon-total-limit" hint="Boşsa sınırsız. İptal edilen sipariş sayılmaz.">
              <Input
                id="coupon-total-limit"
                inputMode="numeric"
                value={draft.totalUsageLimit}
                onChange={(e) => set("totalUsageLimit", e.target.value)}
              />
            </FormRow>
            <FormRow label="Kişi Başı Kullanım Sınırı" htmlFor="coupon-user-limit" hint="Bir üyenin kaç siparişte kullanabileceği; boşsa sınırsız.">
              <Input
                id="coupon-user-limit"
                inputMode="numeric"
                value={draft.perUserLimit}
                onChange={(e) => set("perUserLimit", e.target.value)}
              />
            </FormRow>
          </div>

          <Checkbox
            checked={draft.active}
            onChange={(e) => set("active", e.target.checked)}
            label="Aktif (pasif kupon sepette kabul edilmez)"
          />
        </FormPanel>
      )}

      {form.tab === "kapsam" && (
        <FormPanel>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="scope"
                checked={draft.scope === "all"}
                onChange={() => set("scope", "all")}
                className="accent-zw-red-600"
              />
              Bütün ürünler
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="scope"
                checked={draft.scope === "targets"}
                onChange={() => set("scope", "targets")}
                className="accent-zw-red-600"
              />
              Yalnızca seçilen ürün ve kategoriler
            </label>
          </div>
          {draft.scope === "targets" && (
            <TargetPicker
              productIds={draft.productIds}
              categoryIds={draft.categoryIds}
              onProducts={(ids) => set("productIds", ids)}
              onCategories={(ids) => set("categoryIds", ids)}
            />
          )}
        </FormPanel>
      )}

      {form.tab === "kisiler" && (
        <FormPanel>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="audience"
                checked={draft.audience === "all"}
                onChange={() => set("audience", "all")}
                className="accent-zw-red-600"
              />
              Herkes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="audience"
                checked={draft.audience === "customers"}
                onChange={() => set("audience", "customers")}
                className="accent-zw-red-600"
              />
              Yalnızca belirli kişiler (kişiye özel)
            </label>
          </div>
          {draft.audience === "customers" && (
            <CustomerEmails emails={draft.customerEmails} onChange={(emails) => set("customerEmails", emails)} />
          )}
        </FormPanel>
      )}

      {form.tab === "kullanimlar" && coupon && <UsageTable couponId={coupon.id} />}
    </ContentFormShell>
  );
}

const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

/** Kuponun gecerli oldugu urun ve kategorilerin secimi. */
function TargetPicker({
  productIds,
  categoryIds,
  onProducts,
  onCategories,
}: {
  productIds: string[];
  categoryIds: string[];
  onProducts: (ids: string[]) => void;
  onCategories: (ids: string[]) => void;
}) {
  const db = useDatabase();
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("tr");

  const categories = useMemo(() => {
    const groupName = new Map(db.categoryGroups.map((g) => [g.slug, g.name]));
    return db.categories
      .map((c) => ({ id: c.id, label: `${groupName.get(c.group) ?? c.group} › ${c.name}`, order: c.code ?? c.name }))
      .sort((a, b) => a.order.localeCompare(b.order, "tr", { numeric: true }));
  }, [db]);
  const products = useMemo(() => [...db.products].sort(byProductOrder), [db]);

  const shownCategories = categories.filter((c) => !q || c.label.toLocaleLowerCase("tr").includes(q));
  const shownProducts = products.filter(
    (p) => !q || p.name.toLocaleLowerCase("tr").includes(q) || p.sku.toLocaleLowerCase("tr").includes(q),
  );

  const chips = [
    ...categoryIds.map((id) => ({
      id,
      label: categories.find((c) => c.id === id)?.label ?? id,
      remove: () => onCategories(toggle(categoryIds, id)),
    })),
    ...productIds.map((id) => ({
      id,
      label: db.products.find((p) => p.id === id)?.name ?? id,
      remove: () => onProducts(toggle(productIds, id)),
    })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-zw-grey-600">
        Kategori seçilirse kategorideki bütün ürünler (sonradan eklenenler dahil) kupona girer.
      </p>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="coupon-targets">
          {chips.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-[3px] border border-zw-grey-300 bg-zw-grey-50 py-1 pl-2.5 pr-1 text-xs font-semibold"
            >
              {c.label}
              <button type="button" onClick={c.remove} title="Çıkar" className="rounded-[2px] p-0.5 hover:bg-zw-grey-200">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zw-grey-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kategori, ürün adı veya kod ara…"
          className="pl-9"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PickList title="Kategoriler">
          {shownCategories.map((c) => (
            <Checkbox
              key={c.id}
              checked={categoryIds.includes(c.id)}
              onChange={() => onCategories(toggle(categoryIds, c.id))}
              label={c.label}
            />
          ))}
        </PickList>
        <PickList title="Ürünler">
          {shownProducts.map((p) => (
            <Checkbox
              key={p.id}
              checked={productIds.includes(p.id)}
              onChange={() => onProducts(toggle(productIds, p.id))}
              label={
                <>
                  {p.name} <span className="text-xs text-zw-grey-500">{p.sku}</span>
                </>
              }
            />
          ))}
        </PickList>
      </div>
    </div>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Kisiye ozel kuponun e-posta adresleri. Kisi henuz uye olmasa da eklenir;
 * o e-postayla uye olup giris yapinca kuponu kullanabilir.
 */
function CustomerEmails({ emails, onChange }: { emails: string[]; onChange: (emails: string[]) => void }) {
  const db = useDatabase();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const members = useMemo(() => db.users.filter((u) => u.role !== "admin"), [db]);
  const memberOf = (email: string) => members.find((u) => normalizeEmail(u.email) === email);

  const add = () => {
    const email = normalizeEmail(value);
    if (!EMAIL.test(email)) return setError("Geçerli bir e-posta adresi yazın.");
    if (!emails.includes(email)) onChange([...emails, email]);
    setValue("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-zw-grey-600">
        Kuponu yalnızca bu e-posta adresleriyle giriş yapan üyeler kullanabilir. Kişi henüz üye değilse aynı
        e-postayla üye olunca kullanır. Genellikle kişi başı kullanım sınırı 1 yapılır.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          list="coupon-member-emails"
          aria-label="E-posta adresi"
          placeholder="ornek@firma.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            // Enter formu kaydetmesin, adresi eklesin.
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <datalist id="coupon-member-emails">
          {members.map((u) => (
            <option key={u.id} value={u.email}>{`${u.firstName} ${u.lastName}`}</option>
          ))}
        </datalist>
        <Button type="button" variant="outline" onClick={add}>
          Ekle
        </Button>
      </div>
      {error && <p className="text-xs font-semibold text-zw-red-700">{error}</p>}
      {emails.length > 0 && (
        <ul className="divide-y divide-zw-grey-100 rounded-[4px] border border-zw-grey-200" data-testid="coupon-emails">
          {emails.map((email) => {
            const member = memberOf(email);
            return (
              <li key={email} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold">{email}</span>
                  <span className="ml-2 text-xs text-zw-grey-500">
                    {member ? `${member.firstName} ${member.lastName} · üye` : "henüz üye değil"}
                  </span>
                </span>
                <button
                  type="button"
                  title="Çıkar"
                  onClick={() => onChange(emails.filter((e) => e !== email))}
                  className="rounded-[2px] p-1 text-zw-grey-500 hover:bg-zw-grey-100 hover:text-zw-red-600"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PickList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zw-grey-600">{title}</div>
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-[4px] border border-zw-grey-200 p-3">{children}</div>
    </div>
  );
}

/** Kuponun kullanildigi siparisler. */
function UsageTable({ couponId }: { couponId: string }) {
  const db = useDatabase();
  const rows = couponRedemptions(couponId, db);
  return (
    <div className="overflow-x-auto rounded-[4px] border border-zw-grey-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-zw-grey-50 text-left text-xs uppercase tracking-wide text-zw-grey-600">
          <tr>
            <th className="px-4 py-3">Sipariş</th>
            <th className="px-4 py-3">Üye</th>
            <th className="px-4 py-3 text-right">İndirim</th>
            <th className="px-4 py-3">Tarih</th>
            <th className="px-4 py-3">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zw-grey-100">
          {rows.map((r) => {
            const order = db.orders.find((o) => o.id === r.orderId);
            const user = r.userId ? db.users.find((u) => u.id === r.userId) : undefined;
            return (
              <tr key={r.id}>
                <td className="px-4 py-2.5">
                  {order ? (
                    <Link href={`/yonetim/siparisler/${order.id}`} className="font-semibold text-zw-red-600 hover:underline">
                      {order.code}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {user ? `${user.firstName} ${user.lastName}` : order?.customerName ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">−{formatPrice(r.discountAmount)}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-zw-grey-600">{formatDateTime(r.createdAt)}</td>
                <td className="px-4 py-2.5">
                  {r.releasedAt ? (
                    <Badge tone="outline">İptal edildi · sayılmıyor</Badge>
                  ) : (
                    <Badge tone="green">Kullanıldı</Badge>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-zw-grey-500">
                Bu kupon henüz kullanılmadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

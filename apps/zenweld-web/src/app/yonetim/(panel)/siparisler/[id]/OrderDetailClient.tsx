"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, PackageCheck, RotateCcw, Truck, XCircle } from "lucide-react";
import { trackingLink, type Order, type OrderAddress, type OrderSapExport } from "@zenweld/data";
import { tr } from "@zenweld/i18n";
import { findOrder, getShopSettings, useDatabase } from "@zenweld/store";
import { Alert, Button, FormRow, Input, Select, Textarea } from "@zenweld/ui";
import { formatDate, formatDateTime, formatPrice } from "@zenweld/utils";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";
import { AdminOrderStatus, ORDER_STATUS } from "@/components/admin/order-status";
import { useDemoExpiredTransfers, useSalesActions, type PanelAnswer } from "@/lib/admin-sales";

/**
 * SIPARIS DETAYI (panel)
 *
 *   Odeme Bekleniyor  -> [Odeme Alindi]        havale hesaba gecince
 *   Hazirlaniyor      -> [Kargoya Ver]         firma + takip no girilir
 *   Kargoda           -> [Teslim Edildi]       takip no duzeltilebilir
 *   (teslim edilmemis her siparis iptal edilebilir)
 *
 * Musteri her adimi Hesabim > Siparislerim'de gorur. Veritabani modunda
 * islemler sunucuya yazilir (lib/admin-sales.ts).
 */
export function OrderDetailClient({ id }: { id: string }) {
  const db = useDatabase();
  const order = findOrder(id, db);
  // Odeme suresi dolan havale siparisi musteri sayfalarindaki gibi iptal edilir
  // (veritabani modunda sunucu yapar).
  useDemoExpiredTransfers();

  if (!order) return <Alert tone="danger">Sipariş bulunamadı.</Alert>;

  return (
    <>
      <AdminPageHeader
        title={order.code}
        description={`${formatDateTime(order.createdAt)} · ${order.customerName}`}
        action={
          <Link href="/yonetim/siparisler" className="text-sm font-semibold text-zw-grey-600 hover:text-zw-ink">
            ← Tüm siparişler
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Actions key={order.updatedAt} order={order} />

          <AdminCard>
            <Title>Ürünler</Title>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-zw-grey-500">
                <tr>
                  <th className="py-2">Ürün</th>
                  <th className="py-2 text-right">Adet</th>
                  <th className="py-2 text-right">Birim (KDV dahil)</th>
                  <th className="py-2 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zw-grey-100">
                {order.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      <div className="font-semibold">{i.productName}</div>
                      <div className="text-xs text-zw-grey-500">
                        {i.sku}
                        {i.variantLabel && ` · ${i.variantLabel}`}
                      </div>
                    </td>
                    <td className="py-2 text-right">{i.quantity}</td>
                    <td className="py-2 text-right">{formatPrice(i.unitPrice)}</td>
                    <td className="py-2 text-right font-semibold">
                      {formatPrice(i.unitPrice * i.quantity)}
                      {i.couponDiscount ? (
                        <div className="text-xs font-normal text-zw-grey-500" title="İadede ödenecek tutar bu pay düşülerek bulunur">
                          Kupon payı −{formatPrice(i.couponDiscount)}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t border-zw-grey-200 pt-3 text-sm">
              <Row label="Ara toplam" value={formatPrice(order.subtotal)} />
              {order.coupon && (
                <Row
                  label={
                    <>
                      Kupon (
                      <Link href={`/yonetim/kuponlar/${order.coupon.couponId}`} className="font-semibold text-zw-red-600 hover:underline">
                        {order.coupon.code}
                      </Link>
                      )
                    </>
                  }
                  value={<span className="text-emerald-700">−{formatPrice(order.coupon.discount)}</span>}
                />
              )}
              <Row label="İçindeki KDV" value={formatPrice(order.vat)} muted />
              <Row label="Kargo" value={order.shipping === 0 ? "Ücretsiz" : formatPrice(order.shipping)} />
              {order.installmentFee > 0 && <Row label="Vade farkı" value={formatPrice(order.installmentFee)} />}
              <Row label="Toplam" value={<strong>{formatPrice(order.total)}</strong>} />
            </dl>
          </AdminCard>

          <div className="grid gap-6 md:grid-cols-2">
            <AdminCard>
              <Title>Teslimat Adresi</Title>
              <Address a={order.shippingAddress} />
            </AdminCard>
            <AdminCard>
              <Title>Fatura Bilgileri</Title>
              <div className="text-sm text-zw-grey-700">
                {order.invoice.type === "corporate" ? (
                  <>
                    <div className="font-semibold">{order.invoice.companyName}</div>
                    <div>
                      VD: {order.invoice.taxOffice} · VKN: {order.invoice.taxNumber}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">{order.invoice.fullName}</div>
                    <div>TCKN: {order.invoice.tcKimlikNo}</div>
                  </>
                )}
                <div className="mt-2">
                  <Address a={order.invoice.address} />
                </div>
              </div>
            </AdminCard>
          </div>
        </div>

        <div className="space-y-6">
          <AdminCard>
            <Title>Durum</Title>
            <AdminOrderStatus status={order.status} />
            <ol className="mt-4 space-y-2 border-l-2 border-zw-grey-200 pl-4 text-sm">
              {order.history.map((h, idx) => (
                <li key={idx}>
                  <div className="font-semibold">{ORDER_STATUS[h.status].label}</div>
                  <div className="text-xs text-zw-grey-500">
                    {formatDateTime(h.at)}
                    {h.note && ` — ${h.note}`}
                  </div>
                </li>
              ))}
            </ol>
          </AdminCard>

          <AdminCard>
            <Title>Müşteri</Title>
            <div className="text-sm">
              <div className="font-semibold">{order.customerName}</div>
              <div className="text-zw-grey-600">{order.email}</div>
              <div className="text-zw-grey-600">{order.phone}</div>
              <Link href="/yonetim/uyeler" className="mt-2 inline-block text-xs font-semibold text-zw-red-700 hover:underline">
                Üyeler sayfası →
              </Link>
            </div>
          </AdminCard>

          <AdminCard>
            <Title>Ödeme</Title>
            <PaymentInfo order={order} />
          </AdminCard>

          {/* Yalnizca veritabani modunda, odemesi kesinlesen sipariste (K-108). */}
          {order.sapExport && <SapExportInfo key={order.sapExport.status} order={order} sap={order.sapExport} />}

          {order.customerNote && (
            <AdminCard>
              <Title>Müşteri Notu</Title>
              <p className="whitespace-pre-line text-sm text-zw-grey-700">{order.customerNote}</p>
            </AdminCard>
          )}

          <AdminNote key={order.id} order={order} />
        </div>
      </div>
    </>
  );
}

/** Siparisin durumuna gore yapilabilecek isler. */
function Actions({ order }: { order: Order }) {
  const db = useDatabase();
  const actions = useSalesActions();
  const carriers = getShopSettings(db).carriers;
  // Magaza ayarlarindan cikarilmis firma da listede gorunur; yoksa ekranda
  // baska firma gorunurken kayitli firma kaydedilirdi.
  const storedCarrier = order.shipment?.carrier;
  const removed = storedCarrier && !carriers.some((c) => c.name === storedCarrier) ? storedCarrier : undefined;
  const trackingUrl = order.shipment && trackingLink(carriers, order.shipment);
  const [carrier, setCarrier] = useState(storedCarrier ?? carriers[0]?.name ?? "");
  const [tracking, setTracking] = useState(order.shipment?.trackingNumber ?? "");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Promise<PanelAnswer>) => {
    setError(null);
    const answer = await action;
    if (!answer.ok) setError(answer.error);
  };
  const ship = () => {
    if (!carrier.trim() || !tracking.trim()) return setError(tr.panel.shipmentRequired);
    void run(actions.ship(order, carrier.trim(), tracking.trim()));
  };

  const closed = order.status === "delivered" || order.status === "cancelled";

  return (
    <AdminCard>
      <Title>İşlem</Title>

      {/* Takip sayfasi: firmanin takip adresi Magaza Ayarlari'nda girildiyse (K-105). */}
      {order.shipment && trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-zw-red-600 hover:underline"
        >
          {order.shipment.carrier} takip sayfasını aç <ExternalLink size={13} />
        </a>
      )}

      {order.status === "awaiting_payment" && (
        <div className="space-y-3">
          <Alert tone="warning">
            Havale/EFT bekleniyor. Son ödeme tarihi:{" "}
            <strong>{order.payment.dueAt ? formatDate(order.payment.dueAt) : "—"}</strong>. Açıklamada{" "}
            <strong>{order.code}</strong> yazan ödeme hesaba geçince onaylayın.
          </Alert>
          <Button
            leftIcon={<CheckCircle2 size={17} />}
            disabled={actions.pending}
            onClick={() => void run(actions.markPaid(order))}
          >
            Ödeme Alındı
          </Button>
        </div>
      )}

      {(order.status === "preparing" || order.status === "shipped") && (
        <div className="space-y-3">
          <p className="text-sm text-zw-grey-600">
            {order.status === "preparing"
              ? "Sipariş kargoya verildiğinde firmayı ve takip numarasını girin; müşteri hesabında görür."
              : "Takip numarasında hata varsa düzeltip kaydedebilirsiniz."}
          </p>
          <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
            <FormRow label="Kargo firması" htmlFor="order-carrier">
              <Select id="order-carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                {removed && <option value={removed}>{removed} (listede yok)</option>}
                {carriers.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Takip numarası" htmlFor="order-tracking">
              <Input id="order-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} />
            </FormRow>
            <Button
              leftIcon={<Truck size={17} />}
              onClick={ship}
              disabled={actions.pending}
              variant={order.status === "shipped" ? "outline" : "primary"}
            >
              {order.status === "preparing" ? "Kargoya Ver" : "Kaydet"}
            </Button>
          </div>
          {order.status === "shipped" && (
            <Button
              leftIcon={<PackageCheck size={17} />}
              disabled={actions.pending}
              onClick={() => void run(actions.markDelivered(order))}
            >
              Teslim Edildi
            </Button>
          )}
        </div>
      )}

      {closed && (
        <p className="text-sm text-zw-grey-600">
          Bu sipariş {order.status === "delivered" ? "teslim edildi" : "iptal edildi"}; başka işlem yok.
        </p>
      )}

      {!closed && (
        <div className="mt-5 border-t border-zw-grey-200 pt-4">
          {!cancelling ? (
            <Button size="sm" variant="danger" leftIcon={<XCircle size={15} />} onClick={() => setCancelling(true)}>
              Siparişi İptal Et
            </Button>
          ) : (
            <div className="space-y-2">
              <FormRow label="İptal nedeni (müşteri görür)">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </FormRow>
              {order.payment.paidAt && (
                <p className="text-xs text-amber-700">
                  Ödeme alınmış bir sipariş. İadeyi ödeme kuruluşu / banka üzerinden ayrıca yapmanız gerekir.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  disabled={actions.pending}
                  onClick={() => void run(actions.cancel(order, reason.trim() || undefined))}
                >
                  İptal Et
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>
                  Vazgeç
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </AdminCard>
  );
}

function PaymentInfo({ order }: { order: Order }) {
  const p = order.payment;
  return (
    <dl className="space-y-1 text-sm">
      <Row label="Yöntem" value={p.method === "card" ? "Kredi / banka kartı" : "Havale / EFT"} />
      {p.method === "card" && (
        <>
          <Row label="Kart" value={`${p.cardBrand ?? ""} •••• ${p.cardLast4 ?? ""}`} />
          {p.cardProgram && <Row label="Program" value={p.cardProgram} />}
          {p.posName && <Row label="POS" value={p.posName} />}
          <Row label="Taksit" value={(p.installments ?? 1) > 1 ? `${p.installments} taksit` : "Tek çekim"} />
          {p.commissionPercent !== undefined && <Commission order={order} percent={p.commissionPercent} />}
        </>
      )}
      {p.dueAt && <Row label="Son ödeme" value={formatDate(p.dueAt)} />}
      <Row label="Ödendi" value={p.paidAt ? formatDateTime(p.paidAt) : "—"} />
      <Row label="Sözleşme onayı" value={formatDateTime(order.termsAcceptedAt)} />
    </dl>
  );
}

/**
 * Bankanin kestigi komisyon: siparis anindaki firma taksit orani x
 * musteriden cekilen tutar (vade farki dahil). Tahminidir; kesin tutar
 * banka ekstresindedir.
 */
function Commission({ order, percent }: { order: Order; percent: number }) {
  const fee = Math.round((order.total * percent) / 100);
  return (
    <>
      <Row label="Banka komisyonu (tahmini)" value={`%${percent.toLocaleString("tr-TR")} · ${formatPrice(fee)}`} />
      <Row label="Net tahsilat (tahmini)" value={formatPrice(order.total - fee)} />
    </>
  );
}

const SAP_STATUS: Record<OrderSapExport["status"], string> = {
  pending: "Sırada",
  sent: "Aktarıldı",
  failed: "Aktarılamadı",
  skipped: "Aktarılmadı",
};

/**
 * Siparisin SAP'a aktarimi: odemesi kesinlesen siparis siraya girer,
 * zamanlanmis is gonderir; olmazsa artan aralarla yeniden dener. Deneme
 * hakki biten siparis buradan yeniden siraya alinir.
 */
function SapExportInfo({ order, sap }: { order: Order; sap: OrderSapExport }) {
  const actions = useSalesActions();
  const [error, setError] = useState<string | null>(null);
  const requeue = async () => {
    setError(null);
    const answer = await actions.requeueSap(order);
    if (!answer.ok) setError(answer.error);
  };
  return (
    <AdminCard>
      <Title>SAP Aktarımı</Title>
      <dl className="space-y-1 text-sm">
        <Row label="Durum" value={<strong>{SAP_STATUS[sap.status]}</strong>} />
        {sap.sapDocNo && <Row label="SAP belge no" value={sap.sapDocNo} />}
        {sap.sentAt && <Row label="Aktarıldığı an" value={formatDateTime(sap.sentAt)} />}
        {sap.nextAttemptAt && <Row label="Sıradaki deneme" value={formatDateTime(sap.nextAttemptAt)} />}
        {sap.attempts > 0 && sap.status !== "sent" && <Row label="Deneme" value={sap.attempts} />}
      </dl>
      {sap.lastError && sap.status !== "sent" && (
        <p className={`mt-2 text-xs ${sap.status === "skipped" ? "text-zw-grey-600" : "text-red-700"}`}>{sap.lastError}</p>
      )}
      {sap.status === "failed" && (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          leftIcon={<RotateCcw size={15} />}
          disabled={actions.pending}
          onClick={() => void requeue()}
        >
          Yeniden sıraya al
        </Button>
      )}
      {error && (
        <div className="mt-2">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </AdminCard>
  );
}

function AdminNote({ order }: { order: Order }) {
  const actions = useSalesActions();
  const [note, setNote] = useState(order.adminNote ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setError(null);
    const answer = await actions.saveOrderNote(order, note.trim());
    if (answer.ok) setSaved(true);
    else setError(answer.error);
  };
  return (
    <AdminCard>
      <Title>İç Not</Title>
      <Textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Yalnızca panelde görünür"
        className="min-h-20"
      />
      <div className="mt-2 flex items-center gap-3">
        <Button size="sm" variant="outline" disabled={actions.pending} onClick={() => void save()}>
          Notu Kaydet
        </Button>
        {saved && <span className="text-xs text-emerald-700">Kaydedildi</span>}
      </div>
      {error && (
        <div className="mt-2">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
    </AdminCard>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-zw-grey-600">{children}</h2>;
}

function Row({ label, value, muted }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "text-xs text-zw-grey-500" : ""}`}>
      <dt className={muted ? "" : "text-zw-grey-600"}>{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function Address({ a }: { a: OrderAddress }) {
  return (
    <div className="text-sm text-zw-grey-700">
      <div className="font-semibold">{a.fullName}</div>
      <div>{a.phone}</div>
      <div>{a.line}</div>
      <div>
        {a.district} / {a.city}
      </div>
    </div>
  );
}

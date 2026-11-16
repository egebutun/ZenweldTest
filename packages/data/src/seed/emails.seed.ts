import { formatPrice } from "@zenweld/utils";
import { notificationText } from "../email";
import { serviceCandidates, serviceCreatedMail, serviceNoticeMail } from "../service";
import { dealers } from "./dealers.seed";
import type { EmailMessage, Order, Quote, ServiceRequest, User, WarrantyRecord } from "../types";

/**
 * ORNEK YAZISMALAR (Panel › E-posta; KARARLAR K-116)
 *
 * Panelin E-posta sekmeleri bos gorunmesin diye ornek kayitlara bagli
 * e-postalar: sitenin Zenweld'e gonderdigi bildirimler, panelden musteriye
 * yazilan e-postalar ve posta kutusundan gelen yanitlari. Demo modunda
 * tarayicida, veritabani modunda db:seed ile email_log'da durur; db:yukle
 * yuklemez (ornek hareket).
 */

const ZENWELD = "info@zenweld.com";
const ADMIN = "Zenweld Yönetici";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export function createSampleEmails(
  data: { serviceRequests: ServiceRequest[]; quotes: Quote[]; orders: Order[]; users: User[]; warranties: WarrantyRecord[] },
  now: number,
): EmailMessage[] {
  const list: Omit<EmailMessage, "id">[] = [];
  const at = (iso: string, plus = 0) => new Date(Math.min(new Date(iso).getTime() + plus, now - MINUTE)).toISOString();
  const recent = <T extends { createdAt: string }>(rows: T[], count: number) =>
    [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, count);

  // Servis talepleri: bildirim; ikinci talepte musteriyle yazisma.
  const services = recent(data.serviceRequests, 6);
  services.forEach((r, i) => {
    list.push({
      at: at(r.createdAt, 5_000),
      type: "servis",
      direction: "out",
      from: ZENWELD,
      to: [ZENWELD],
      replyTo: r.email,
      subject: `Yeni servis talebi — ${r.code} — ${r.productName}`,
      body: notificationText({
        title: "Yeni servis talebi",
        rows: [
          ["Talep no", r.code],
          ["Makine", r.productName],
          ["Firma / Ad Soyad", r.companyName],
          ["Yetkili", r.contactName],
          ["E-posta", r.email],
          ["Telefon", r.phone],
          ["İlçe", r.district],
          ["Şehir", r.city],
        ],
        note: ["Şikayet / açıklama", r.complaint],
      }),
      status: "sent",
      entityType: "service_requests",
      entityId: r.id,
      sourcePath: "/servis-talebi",
    });
    // Musteriye "talebiniz alindi" e-postasi (KARARLAR K-117).
    const created = serviceCreatedMail(r);
    list.push({
      at: at(r.createdAt, 6_000),
      type: "servis",
      direction: "out",
      from: ZENWELD,
      to: [r.email],
      subject: created.subject,
      body: created.body,
      status: "sent",
      entityType: "service_requests",
      entityId: r.id,
      sourcePath: "/servis-talebi",
    });
    if (i !== 1) return;
    // Servise talep bildirimi ve servisin yaniti (talebi ustleniyor).
    const candidate = serviceCandidates(r, dealers).find((c) => c.dealer.id === r.serviceDealerId);
    if (candidate?.dealer.email) {
      const notice = serviceNoticeMail(r, candidate);
      list.push({
        at: at(r.createdAt, HOUR),
        type: "servis",
        direction: "out",
        from: ZENWELD,
        to: [candidate.dealer.email],
        subject: notice.subject,
        body: notice.body,
        status: "sent",
        entityType: "service_requests",
        entityId: r.id,
        actorName: ADMIN,
      });
      list.push({
        at: at(r.createdAt, 3 * HOUR),
        type: "servis",
        direction: "in",
        from: candidate.dealer.email,
        to: [ZENWELD],
        subject: `Re: ${notice.subject}`,
        body: `Merhaba,\n\nTalebi üstlenebiliriz. Müşteri bilgilerini gönderirseniz yarın gün içinde arayıp randevu veririz.\n\nİyi çalışmalar,\n${candidate.dealer.name}`,
        status: "received",
        entityType: "service_requests",
        entityId: r.id,
      });
    }
    const subject = `Servis talebiniz ${r.code} hakkında`;
    const question = `Merhaba ${r.contactName},\n\n${r.code} numaralı servis talebiniz bize ulaştı. Yetkili servisimizi yönlendirebilmemiz için makinenizin seri numarasını ve mümkünse arızanın bir fotoğrafını bu e-postaya yanıt olarak gönderebilir misiniz?\n\nZenweld`;
    list.push({
      at: at(r.createdAt, 2 * HOUR),
      type: "servis",
      direction: "out",
      from: ZENWELD,
      to: [r.email],
      subject,
      body: question,
      status: "sent",
      entityType: "service_requests",
      entityId: r.id,
      actorName: ADMIN,
    });
    list.push({
      at: at(r.createdAt, 4 * HOUR),
      type: "servis",
      direction: "in",
      from: r.email,
      to: [ZENWELD],
      subject: `Re: ${subject}`,
      body: `Merhaba,\n\nSeri numarası ZW-2026-418203. Arızanın fotoğrafı ektedir. Makine açılıyor ama ark oluşmuyor.\n\nİyi çalışmalar,\n${r.contactName}\n\n> ${question.split("\n").join("\n> ")}`,
      status: "received",
      entityType: "service_requests",
      entityId: r.id,
      attachments: ["ariza-foto.jpg"],
    });
  });

  // Teklifler: bildirim; ilk teklifte musteriyle yazisma.
  recent(data.quotes, 4).forEach((q, i) => {
    list.push({
      at: at(q.createdAt, 5_000),
      type: "teklif",
      direction: "out",
      from: ZENWELD,
      to: [ZENWELD],
      replyTo: q.email,
      subject: `Yeni teklif talebi — ${q.code} — ${q.companyName || q.contactName}`,
      body: notificationText({
        title: "Yeni teklif talebi",
        rows: [
          ["Teklif no", q.code],
          ["Firma", q.companyName],
          ["Yetkili", q.contactName],
          ["E-posta", q.email],
          ["Ürünler", q.items.map((item) => `${item.quantity} × ${item.productName}`).join("\n")],
        ],
      }),
      status: "sent",
      entityType: "quotes",
      entityId: q.id,
      sourcePath: "/teklif-al",
    });
    if (i !== 0) return;
    const subject = `Teklifiniz hazır — ${q.code}`;
    const offer = `Merhaba ${q.contactName},\n\n${q.code} numaralı teklif talebiniz için hazırladığımız teklif ektedir. Teklif 15 gün geçerlidir.\n\nZenweld`;
    list.push({
      at: at(q.createdAt, 26 * HOUR),
      type: "teklif",
      direction: "out",
      from: ZENWELD,
      to: [q.email],
      subject,
      body: offer,
      status: "sent",
      entityType: "quotes",
      entityId: q.id,
      actorName: ADMIN,
    });
    list.push({
      at: at(q.createdAt, 30 * HOUR),
      type: "teklif",
      direction: "in",
      from: q.email,
      to: [ZENWELD],
      subject: `YNT: ${subject}`,
      body: `Teşekkürler. Ödemeyi 60 gün vadeli yapabilir miyiz?\n\n${q.contactName}`,
      status: "received",
      entityType: "quotes",
      entityId: q.id,
    });
  });

  // Siparisler: bildirim.
  recent(data.orders, 4).forEach((o) =>
    list.push({
      at: at(o.createdAt, 5_000),
      type: "siparis",
      direction: "out",
      from: ZENWELD,
      to: [ZENWELD],
      replyTo: o.email,
      subject: `Yeni sipariş — ${o.code} — ${formatPrice(o.total)}`,
      body: notificationText({
        title: "Yeni sipariş",
        rows: [
          ["Sipariş no", o.code],
          ["Müşteri", o.customerName],
          ["E-posta", o.email],
          ["Telefon", o.phone],
          ["Ürünler", o.items.map((item) => `${item.quantity} × ${item.productName}`).join("\n")],
          ["Toplam", formatPrice(o.total)],
        ],
      }),
      status: "sent",
      entityType: "orders",
      entityId: o.id,
      sourcePath: "/odeme",
    }),
  );

  // Uyelik: bildirim; bir uyeye sifre sifirlama.
  const members = recent(
    data.users.filter((u) => u.role !== "admin"),
    3,
  );
  members.forEach((u) =>
    list.push({
      at: at(u.createdAt, 5_000),
      type: "uye",
      direction: "out",
      from: ZENWELD,
      to: [ZENWELD],
      replyTo: u.email,
      subject: `Yeni üye — ${u.firstName} ${u.lastName} (${u.role === "business" ? "Kurumsal" : "Bireysel"})`,
      body: notificationText({
        title: "Yeni üye",
        rows: [
          ["Ad Soyad", `${u.firstName} ${u.lastName}`],
          ["E-posta", u.email],
          ["Üyelik", u.role === "business" ? "Kurumsal" : "Bireysel"],
        ],
      }),
      status: "sent",
      entityType: "users",
      entityId: u.id,
      sourcePath: "/kayit",
    }),
  );
  const member = members[0];
  if (member) {
    list.push({
      at: at(member.createdAt, 3 * 24 * HOUR),
      type: "sifre-sifirlama",
      direction: "out",
      from: ZENWELD,
      to: [member.email],
      subject: "Zenweld şifre sıfırlama",
      body: `Merhaba ${member.firstName},\n\nZenweld hesabınız için şifre sıfırlama istendi. Yeni şifre belirlemek için aşağıdaki bağlantıyı açın. Bağlantı 1 saat geçerlidir ve bir kez kullanılabilir.\n\n(sıfırlama bağlantısı; güvenlik için saklanmaz)\n\nBu isteği siz yapmadıysanız bu e-postayı dikkate almayın; şifreniz değişmez.`,
      status: "sent",
      entityType: "users",
      entityId: member.id,
      sourcePath: "/sifremi-unuttum",
    });
  }

  // Garanti kayitlari: bildirim.
  [...data.warranties]
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, 2)
    .forEach((w) =>
      list.push({
        at: at(w.registeredAt, 5_000),
        type: "garanti",
        direction: "out",
        from: ZENWELD,
        to: [ZENWELD],
        replyTo: w.email,
        subject: `Yeni garanti kaydı — ${w.serialNumber}`,
        body: notificationText({
          title: "Yeni garanti kaydı",
          rows: [
            ["Seri no", w.serialNumber],
            ["Ad Soyad", w.ownerName],
            ["E-posta", w.email],
            ["Şehir", w.city],
          ],
        }),
        status: "sent",
        entityType: "warranties",
        entityId: w.id,
        sourcePath: "/garanti",
      }),
    );

  // En eski once numaralanir; yanit, yanitladigi e-postaya baglanir.
  const sorted = list.sort((a, b) => a.at.localeCompare(b.at)).map((m, i) => ({ ...m, id: `eml-ornek-${i + 1}` }));
  return sorted.map((m) => {
    if (m.direction !== "in") return m;
    const parent = [...sorted]
      .reverse()
      .find((p) => p.direction === "out" && p.at < m.at && p.entityId === m.entityId && p.to.includes(m.from ?? ""));
    return parent ? { ...m, parentId: parent.id } : m;
  });
}

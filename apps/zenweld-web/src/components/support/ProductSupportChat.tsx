"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { Product } from "@zenweld/data";
import { useAuth } from "@zenweld/auth";
import { Button, Checkbox, Input, Textarea } from "@zenweld/ui";
import { LocaleLink } from "@/components/common/LocaleLink";
import { useLocale, useT } from "@/lib/i18n-client";
import { onOpenSupportChat } from "@/lib/support-chat";

/**
 * URUN DESTEK SOHBETI
 *
 * Yalnizca urun sayfalarinda, sag altta durur. Acildiginda urun adi ve
 * urun kodu ilk mesaj olarak hazir gelir; ziyaretci altina sorusunu
 * yazar. Gonderince soru info@zenweld.com adresine iletilir ve ekranda
 * "en kisa surede donus yapilacak" yaniti gorunur.
 *
 * ILETISIM BILGISI
 * Uye girisi yapilmissa ad/e-posta/telefon hesaptan otomatik doldurulur.
 * Uye degilse en az bir kanal (e-posta ya da telefon) istenir; aksi
 * halde soruyu yanitlamanin yolu olmaz.
 *
 * KVKK
 * Iletisim bilgisi kisisel veridir. Bu yuzden toplandigi yerde acik riza
 * kutusu var ve aydinlatma metnine baglanti veriliyor. Metnin son hali
 * hukuk danismaninizca onaylanmalidir.
 *
 * ILERISI ICIN
 * Simdilik sabit yanit veriyor. Gercek urun fotograflari ve teknik
 * ozellikleri girildikten sonra bir dil modeliyle beslenip sik sorulan
 * sorulari kendisi yanitlayabilir; bilemedigini yine destek ekibine
 * yonlendirir. Mesaj akisi (messages dizisi) bu amacla hazirlandi.
 */

type Message = { from: "bot" | "user"; text: string };

export function ProductSupportChat({ product }: { product: Product }) {
  const t = useT();
  const locale = useLocale();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [delivered, setDelivered] = useState<boolean | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  // Sayfa icindeki "Bize yazin" baglantisi sohbeti acabilsin.
  useEffect(() => onOpenSupportChat(() => setOpen(true)), []);

  // Uye girisi varsa iletisim bilgileri hazir gelir.
  useEffect(() => {
    if (!user) return;
    setName(`${user.firstName} ${user.lastName}`.trim());
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  // Acilista urun bilgisini tasiyan ilk mesaj.
  useEffect(() => {
    if (!open || messages.length > 0) return;
    setMessages([
      { from: "bot", text: t.support.chatGreeting },
      {
        from: "user",
        text: `${t.support.chatProductLine}\n${product.name} · ${product.sku}`,
      },
    ]);
  }, [open, messages.length, product.name, product.sku, t.support]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const sent = messages.some((m) => m.from === "bot" && m.text === t.support.chatAnswer);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question.trim()) return setError(t.support.chatErrorEmpty);
    if (!email.trim() && !phone.trim()) return setError(t.support.chatErrorContact);
    if (!consent) return setError(t.support.chatErrorConsent);

    setSending(true);
    setMessages((m) => [...m, { from: "user", text: question.trim() }]);

    try {
      const res = await fetch("/api/destek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          productSku: product.sku,
          productUrl:
            typeof window !== "undefined" ? window.location.href : `/${locale}/urun/${product.slug}`,
          message: question.trim(),
          name,
          email,
          phone,
          isMember: Boolean(user),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; delivered?: boolean };
      setDelivered(Boolean(data.delivered));
    } catch {
      setDelivered(false);
    }

    setQuestion("");
    setMessages((m) => [...m, { from: "bot", text: t.support.chatAnswer }]);
    setSending(false);
  };

  return (
    <>
      {/* Acma dugmesi — sag alt kose */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[200] flex items-center gap-2 rounded-full bg-zw-red-600 px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-xl transition-colors hover:bg-zw-red-700 zw-focus"
        >
          <MessageCircle size={20} />
          <span className="hidden sm:inline">{t.support.chatButton}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t.support.chatTitle}
          className="fixed bottom-5 right-5 z-[200] flex max-h-[80vh] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[6px] border border-zw-grey-200 bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between bg-zw-ink px-4 py-3 text-white">
            <div>
              <div className="font-display text-base font-bold uppercase">
                {t.support.chatTitle}
              </div>
              <div className="text-[11px] text-zw-grey-400">{t.support.chatSubtitle}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.common.close}
              className="rounded-[4px] p-1 hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-zw-grey-50 px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-line rounded-[6px] px-3 py-2 text-sm ${
                  m.from === "bot"
                    ? "bg-white text-zw-grey-800 shadow-sm"
                    : "ml-auto bg-zw-red-600 text-white"
                }`}
              >
                {m.text}
              </div>
            ))}
            {sent && delivered === false && (
              <p className="rounded-[4px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {t.support.chatMailFallback}
              </p>
            )}
            <div ref={endRef} />
          </div>

          {!sent && (
            <form onSubmit={submit} className="shrink-0 space-y-2.5 border-t border-zw-grey-200 p-3">
              {error && (
                <p className="rounded-[4px] bg-zw-red-50 px-3 py-2 text-xs font-semibold text-zw-red-700">
                  {error}
                </p>
              )}

              <Textarea
                required
                className="min-h-20 text-sm"
                placeholder={t.support.chatPlaceholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              {/* Uye girisi varsa bilgiler hazir; degilse en az biri sart. */}
              {user ? (
                <p className="text-[11px] text-zw-grey-500">
                  {t.support.chatMemberNote.replace("{contact}", email || phone)}
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    className="text-sm"
                    placeholder={t.support.chatEmail}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    className="text-sm"
                    placeholder={t.support.chatPhone}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              )}

              <div className="text-[11px] leading-snug text-zw-grey-600">
                <Checkbox
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  label={t.support.chatConsent}
                />
                <LocaleLink
                  href="/yasal/kvkk"
                  className="mt-1 ml-6 block font-semibold text-zw-red-600 underline"
                >
                  {t.support.chatConsentLink}
                </LocaleLink>
              </div>

              <Button type="submit" fullWidth disabled={sending} leftIcon={<Send size={16} />}>
                {sending ? t.support.chatSending : t.support.chatSend}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

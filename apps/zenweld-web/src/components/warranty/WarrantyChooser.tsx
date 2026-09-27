"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardCheck, Search } from "lucide-react";
import { WarrantyCheck } from "./WarrantyCheck";
import { WarrantyRegister } from "./WarrantyRegister";
import { useT } from "@/lib/i18n-client";

type Action = "kayit" | "sorgula";

/**
 * GARANTI SAYFASI — SECIM
 *
 * Menude tek "Garanti" basligi var. Sayfa acilinca ziyaretci iki
 * secenekten birini secer, ilgili form HEMEN ALTINDA gorunur.
 *
 * Secim adres cubuguna da yazilir (?islem=kayit / ?islem=sorgula), bu
 * sayede dogrudan bir secenege baglanti verilebilir — urun sayfasindaki
 * "Garanti Kaydı →" baglantisi bunu kullanir.
 */
export function WarrantyChooser() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get("islem");
  const [action, setAction] = useState<Action | null>(
    fromUrl === "kayit" || fromUrl === "sorgula" ? fromUrl : null,
  );

  // Tarayicinin geri/ileri tuslari da secimi degistirsin.
  useEffect(() => {
    if (fromUrl === "kayit" || fromUrl === "sorgula") setAction(fromUrl);
  }, [fromUrl]);

  const choose = (next: Action) => {
    setAction(next);
    router.replace(`?islem=${next}`, { scroll: false });
  };

  const options: { id: Action; Icon: typeof Search; title: string; text: string }[] = [
    {
      id: "kayit",
      Icon: ClipboardCheck,
      title: t.explore.registerWarranty,
      text: t.explore.registerWarrantyDesc,
    },
    {
      id: "sorgula",
      Icon: Search,
      title: t.explore.checkWarranty,
      text: t.explore.checkWarrantyDesc,
    },
  ];

  return (
    <div className="zw-container py-12">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zw-grey-500">
        {t.explore.warrantyChoose}
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
        {options.map(({ id, Icon, title, text }) => {
          const selected = action === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              aria-pressed={selected}
              className={`flex items-start gap-4 rounded-[6px] border-2 p-5 text-left transition-colors ${
                selected
                  ? "border-zw-red-600 bg-zw-red-50"
                  : "border-zw-grey-200 hover:border-zw-red-600"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  selected ? "bg-zw-red-600 text-white" : "bg-zw-grey-100 text-zw-red-600"
                }`}
              >
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-display text-lg font-bold uppercase text-zw-ink">
                  {title}
                </span>
                <span className="mt-1 block text-sm text-zw-grey-600">{text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {action && (
        <div className="mt-10 border-t border-zw-grey-200 pt-10">
          {action === "kayit" ? (
            <WarrantyRegister onCheck={() => choose("sorgula")} />
          ) : (
            <WarrantyCheck onRegister={() => choose("kayit")} />
          )}
        </div>
      )}
    </div>
  );
}

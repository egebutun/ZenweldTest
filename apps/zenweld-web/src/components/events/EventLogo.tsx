"use client";

import { useState } from "react";
import { ProductImage } from "@/components/common/ProductImage";
import { logoAlternates } from "@/lib/event-logo";

/**
 * ETKINLIK LOGOSU — HEPSI AYNI BUYUKLUKTE GORUNUR
 *
 * Sorun: logolarin en-boy oranlari cok farkli. Big 5 uzun ve ince (5.10),
 * Istanbul Hirdavat neredeyse kare (1.60). Hepsini ayni kutuya koyup
 * "sigdir" dedigimizde, genis olanlar kisa ve ince kaliyor; goz bunu
 * "kucuk logo" olarak okuyor. Sabit yukseklik de ise yaramiyor, bu sefer
 * genis olanlar devasa goruluyor.
 *
 * Cozum: gozun buyuklugu ALANDAN okudugunu kabul edip her logoyu ayni
 * alani kaplayacak sekilde olcekliyoruz. Oran korunur, logo ezilmez,
 * hicbir yeri kirpilmaz.
 *
 *   yukseklik = kok(hedefAlan / oran)
 *   genislik  = yukseklik * oran
 *
 * Ornek (kart kutusu, hedef alan 11.600 piksel):
 *   oran 5.05 -> 242 x 48     |  oran 2.00 -> 152 x 76
 *   oran 2.98 -> 186 x 62     |  oran 1.60 -> 136 x 85
 * Farkli sekiller, ayni gorsel agirlik.
 *
 * Olculer bilinmeden once (ilk boyama) logo dogal halinde gosterilir;
 * yuklenince olcek uygulanir.
 */

/**
 * Hedef alan kutuya gore secilir; oyle ki EN GENIS logo bile kutuya
 * sigsin. Sigmazsa o logo kirpilir ve esitlik bozulur.
 *
 *   hedefAlan <= genislik^2 / enGenisOran
 *   hedefAlan <= yukseklik^2 * enDarOran
 *
 * Mevcut logolarda oranlar 1.60 ile 5.05 arasinda. Kart kutusu 242x86
 * icin ust sinir 11.693, detay kutusu 320x120 icin 20.277.
 */

export function EventLogo({
  src,
  title,
  maxWidth,
  maxHeight,
  targetArea,
  /** "box": sabit olculu kutu icinde ortalanir (liste kartlari).
   *  "hug": kutu logonun etrafini sarar, yanlarda bos beyaz kalmaz. */
  fit = "box",
  className = "",
}: {
  src: string;
  title: string;
  maxWidth: number;
  maxHeight: number;
  /** Her logonun kaplayacagi hedef alan (piksel kare). */
  targetArea: number;
  fit?: "box" | "hug";
  className?: string;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const scaled = (() => {
    if (!size || size.width === 0 || size.height === 0) return null;

    const ratio = size.width / size.height;
    let height = Math.sqrt(targetArea / ratio);
    let width = height * ratio;

    // Kutuyu asmasin: tasan kenara gore orantili kucult.
    const shrink = Math.min(1, maxWidth / width, maxHeight / height);
    width *= shrink;
    height *= shrink;

    return { width: Math.round(width), height: Math.round(height) };
  })();

  // "hug": kutu logonun tam olcusu olur; dort kenarinda da bos beyaz kalmaz.
  // box-content sayesinde cerceve olcunun disina cizilir, logoyu kirpmaz.
  const box =
    fit === "hug"
      ? scaled
        ? { width: scaled.width, height: scaled.height }
        : { height: maxHeight }
      : { width: maxWidth, height: maxHeight };

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${
        fit === "hug" ? "box-content" : "overflow-hidden"
      } ${className}`}
      style={box}
    >
      <ProductImage
        src={src}
        alternates={logoAlternates(src)}
        alt={title}
        label={title}
        className="shrink-0 object-contain"
        style={
          scaled
            ? { width: scaled.width, height: scaled.height }
            : { maxWidth: "100%", maxHeight: "100%" }
        }
        onReady={setSize}
      />
    </div>
  );
}

"use client";

import { Fragment } from "react";
import type { RichTextStyle } from "@zenweld/data";
import { getRichTextStyle, useDatabase } from "@zenweld/store";

/**
 * ETKINLIK / HABER METIN BICIMLENDIRICI
 *
 * Duz metni hafif bir isaretleme ile bicimlendirir. Metnin kendisi
 * degismez, yalnizca satir baslarina isaret konur:
 *
 *   "## Ara baslik"        -> ara baslik (renkli cizgili)
 *   "- Madde"              -> madde isaretli liste
 *   "- **Etiket:** metin"  -> etiketi kalin madde
 *   "**kalin**"            -> satir ici kalin metin
 *
 * Isaretsiz satirlar paragraf olur; ilk paragraf giris paragrafi olarak
 * biraz daha buyuk gosterilir. Punto ve renkler yonetim panelindeki
 * "Görünüm" sayfasindan degistirilebilir.
 */

type Block =
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "paragraph"; text: string };

function parse(source: string): Block[] {
  const lines = source
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: Block[] = [];

  lines.forEach((line) => {
    if (line.startsWith("## ")) {
      blocks.push({ kind: "heading", text: line.slice(3).trim() });
      return;
    }
    if (line.startsWith("- ")) {
      const item = line.slice(2).trim();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", items: [item] });
      return;
    }
    blocks.push({ kind: "paragraph", text: line });
  });

  return blocks;
}

/** "**Etiket:** metin" -> <strong>Etiket:</strong> metin */
function Inline({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold" style={{ color: "var(--zw-rt-strong)" }}>
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function RichText({
  source,
  className = "",
  overrides,
}: {
  source: string;
  className?: string;
  /** Yonetim panelindeki onizleme icin kaydedilmemis ayarlar. */
  overrides?: RichTextStyle;
}) {
  const db = useDatabase();
  const style = overrides ?? getRichTextStyle(db);
  const blocks = parse(source);
  let paragraphSeen = false;

  const vars = {
    "--zw-rt-accent": style.accentColor,
    "--zw-rt-strong": style.strongColor,
  } as React.CSSProperties;

  return (
    <div className={className} style={vars}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h2 key={i} className="mt-9 first:mt-0">
              <span
                className="block font-display font-bold leading-snug tracking-wide"
                style={{
                  fontSize: `${style.headingSize}px`,
                  color: style.headingColor,
                  textTransform: style.headingUppercase ? "uppercase" : "none",
                }}
              >
                {block.text}
              </span>
              {style.accentWidth > 0 && (
                <span
                  className="mt-2 block h-[3px]"
                  style={{ width: `${style.accentWidth}px`, background: "var(--zw-rt-accent)" }}
                />
              )}
            </h2>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={i} className="mt-4 space-y-2.5">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="flex gap-3 leading-relaxed"
                  style={{ fontSize: `${style.bodySize}px`, color: style.bodyColor }}
                >
                  <span
                    className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--zw-rt-accent)" }}
                  />
                  <span>
                    <Inline text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        const isLead = !paragraphSeen;
        paragraphSeen = true;
        return (
          <p
            key={i}
            className={isLead ? "font-medium leading-relaxed" : "mt-4 leading-relaxed"}
            style={{
              fontSize: `${isLead ? style.leadSize : style.bodySize}px`,
              color: isLead ? style.headingColor : style.bodyColor,
            }}
          >
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

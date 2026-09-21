"use client";

import { Fragment } from "react";

/**
 * ETKINLIK / HABER METIN BICIMLENDIRICI
 *
 * Duz metni hafif bir isaretleme ile bicimlendirir. Metnin kendisi
 * degismez, yalnizca satir baslarina isaret konur:
 *
 *   "## Ara baslik"        -> ara baslik (kirmizi cizgili)
 *   "- Madde"              -> madde isaretli liste
 *   "- **Etiket:** metin"  -> etiketi kalin madde
 *   "**kalin**"            -> satir ici kalin metin
 *
 * Isaretsiz satirlar paragraf olur; ilk paragraf giris paragrafi olarak
 * biraz daha buyuk gosterilir.
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
          <strong key={i} className="font-semibold text-zw-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function RichText({ source, className = "" }: { source: string; className?: string }) {
  const blocks = parse(source);
  let paragraphSeen = false;

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h2 key={i} className="mt-9 first:mt-0">
              <span className="block font-display text-lg font-bold uppercase leading-snug tracking-wide text-zw-ink">
                {block.text}
              </span>
              <span className="mt-2 block h-[3px] w-10 bg-zw-red-600" />
            </h2>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={i} className="mt-4 space-y-2.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-zw-grey-700">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-zw-red-600" />
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
            className={
              isLead
                ? "text-lg font-medium leading-relaxed text-zw-ink"
                : "mt-4 text-[15px] leading-relaxed text-zw-grey-700"
            }
          >
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}

export function ZenweldLogo({
  className = "",
  variant = "dark",
}: {
  className?: string;
  variant?: "dark" | "light";
}) {
  const text = variant === "light" ? "#FFFFFF" : "#141619";
  return (
    <svg viewBox="0 0 220 40" className={className} role="img" aria-label="Zenweld">
      <path d="M2 4 h26 l-18 24 h18 v8 H0 l18-24 H2 Z" fill="#d62027" />
      <text
        x="36"
        y="30"
        fill={text}
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontSize="30"
        fontWeight="700"
        letterSpacing="1"
      >
        ZENWELD
      </text>
    </svg>
  );
}

export function ZenweldBayiLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 40" className={className} role="img" aria-label="Zenweld Bayi A">
      <path d="M2 4 h26 l-18 24 h18 v8 H0 l18-24 H2 Z" fill="#d62027" />
      <text
        x="36"
        y="30"
        fill="#141619"
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="1"
      >
        ZENWELD-BAYİ-A
      </text>
    </svg>
  );
}

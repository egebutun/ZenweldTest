"use client";

/**
 * KAYNAKÇI ANİMASYONU
 *
 * Tamamen SVG + CSS ile çizildi; dış görsel veya animasyon kütüphanesi
 * kullanılmaz. Silüet tarzı seçildi çünkü ışık kaynağı (ark) sahneyi
 * aydınlatınca en okunaklı sonucu veriyor.
 *
 * prefers-reduced-motion açık olan ziyaretçilerde animasyonlar durur,
 * sahne sabit kalır.
 */
export function WelderAnimation({ className = "" }: { className?: string }) {
  const sparks = [
    { dx: 70, dy: -55, delay: 0, dur: 1.1, size: 2.6 },
    { dx: 95, dy: -18, delay: 0.15, dur: 1.3, size: 2 },
    { dx: 52, dy: -78, delay: 0.3, dur: 1.0, size: 2.2 },
    { dx: -48, dy: -62, delay: 0.1, dur: 1.2, size: 2.4 },
    { dx: -72, dy: -30, delay: 0.42, dur: 1.15, size: 1.8 },
    { dx: 110, dy: -48, delay: 0.55, dur: 1.4, size: 2.1 },
    { dx: -95, dy: -12, delay: 0.68, dur: 1.25, size: 1.6 },
    { dx: 30, dy: -95, delay: 0.22, dur: 1.35, size: 2.3 },
    { dx: -25, dy: -88, delay: 0.75, dur: 1.1, size: 2 },
    { dx: 128, dy: -8, delay: 0.38, dur: 1.5, size: 1.7 },
    { dx: -118, dy: -40, delay: 0.85, dur: 1.45, size: 1.9 },
    { dx: 8, dy: -110, delay: 0.5, dur: 1.2, size: 2.5 },
    { dx: 82, dy: -86, delay: 0.95, dur: 1.3, size: 1.8 },
    { dx: -60, dy: -100, delay: 0.62, dur: 1.4, size: 2 },
  ];

  return (
    <div className={`zw-welder ${className}`}>
      <svg viewBox="0 0 400 290" className="h-full w-full" role="img" aria-label="Kaynak yapan işçi animasyonu">
        <defs>
          <radialGradient id="arcGlow">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#cfe8ff" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#7fb6ff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7fb6ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a4048" />
            <stop offset="100%" stopColor="#1a1d21" />
          </linearGradient>
          <linearGradient id="plateGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2e343a" />
            <stop offset="55%" stopColor="#525a63" />
            <stop offset="100%" stopColor="#2e343a" />
          </linearGradient>
        </defs>

        {/* Zemin */}
        <rect x="0" y="243" width="400" height="47" fill="url(#floorGrad)" />

        {/* Ark ışığının zemine vuran yansıması */}
        <ellipse className="zw-flicker" cx="258" cy="243" rx="120" ry="16" fill="url(#arcGlow)" />

        {/* İşçinin gölgesi */}
        <ellipse cx="136" cy="241" rx="62" ry="7" fill="#000000" opacity="0.45" />

        {/* Çelik plaka */}
        <rect x="206" y="228" width="162" height="15" rx="2" fill="url(#plateGrad)" />
        <rect x="206" y="228" width="162" height="3" rx="1.5" fill="#6b757f" opacity="0.7" />

        {/* Kaynak dikişi — soldan sağa ilerliyor */}
        <path
          className="zw-bead"
          d="M 214 231 L 256 231"
          stroke="#ff8a3d"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Duman */}
        <g className="zw-smoke" fill="#aab3bd" opacity="0.14">
          <circle className="zw-smoke-1" cx="258" cy="215" r="9" />
          <circle className="zw-smoke-2" cx="266" cy="200" r="12" />
          <circle className="zw-smoke-3" cx="252" cy="185" r="10" />
        </g>

        {/* --- KAYNAKÇI (silüet) --- */}
        <g className="zw-welder-body" fill="none" stroke="#12151a" strokeLinecap="round" strokeLinejoin="round">
          {/* Arka bacak */}
          <path d="M 128 168 L 104 208 L 82 240" strokeWidth="19" />
          {/* Ön bacak */}
          <path d="M 132 168 L 164 202 L 176 240" strokeWidth="19" />
          {/* Ayakkabılar */}
          <path d="M 76 240 L 100 240" strokeWidth="12" />
          <path d="M 172 240 L 196 240" strokeWidth="12" />
          {/* Gövde */}
          <path d="M 129 170 L 124 112" strokeWidth="30" />
          {/* Önlük */}
          <path d="M 112 120 L 146 118 L 150 176 L 114 180 Z" fill="#191d23" stroke="#191d23" strokeWidth="3" />
          {/* Destek kol (sol) */}
          <path d="M 126 124 L 152 158 L 186 176" strokeWidth="14" />
          {/* Torç tutan kol (sağ) */}
          <path d="M 128 118 L 178 134 L 214 178" strokeWidth="15" />
        </g>

        {/* Eldivenler */}
        <circle cx="214" cy="180" r="10" fill="#242a31" />
        <circle cx="188" cy="178" r="9" fill="#181c22" />

        {/* Kask */}
        <g>
          <path
            d="M 106 74 Q 105 60 119 58 L 146 55 Q 160 54 161 68 L 164 98 Q 165 112 152 114 L 124 117 Q 110 118 108 104 Z"
            fill="#15191e"
          />
          {/* Vizör */}
          <path d="M 140 70 L 160 67 L 161 81 L 141 84 Z" fill="#0a0d10" />
          <path className="zw-visor" d="M 140 70 L 160 67 L 161 81 L 141 84 Z" fill="#6fb2ff" />
          {/* Kask üst şerit — marka kırmızısı */}
          <path d="M 108 70 Q 107 60 119 58 L 146 55 Q 158 54 160 66 L 158 69 Q 156 60 146 60 L 121 63 Q 111 64 111 71 Z" fill="#d62027" />
        </g>

        {/* Torç */}
        <g className="zw-torch">
          <path d="M 214 180 L 246 216" stroke="#2b3138" strokeWidth="9" strokeLinecap="round" />
          <path d="M 240 210 L 252 222" stroke="#8b949d" strokeWidth="6" strokeLinecap="round" />
          {/* Kablo */}
          <path
            d="M 212 184 Q 190 212 150 214 Q 120 216 108 240"
            stroke="#1c2128"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* --- ARK --- */}
        <g className="zw-arc-group">
          <circle className="zw-flicker" cx="256" cy="228" r="62" fill="url(#arcGlow)" />
          <circle className="zw-flicker zw-arc-core" cx="256" cy="228" r="9" fill="#ffffff" />
          <circle className="zw-flicker" cx="256" cy="228" r="16" fill="#cfe8ff" opacity="0.5" />
          {/* Yatay ve dikey parlama — arkın yıldız etkisi */}
          <g className="zw-flicker" opacity="0.9">
            <ellipse cx="256" cy="228" rx="46" ry="1.6" fill="#ffffff" opacity="0.75" />
            <ellipse cx="256" cy="228" rx="1.6" ry="34" fill="#ffffff" opacity="0.65" />
            <ellipse
              cx="256"
              cy="228"
              rx="26"
              ry="1.2"
              fill="#cfe8ff"
              transform="rotate(45 256 228)"
              opacity="0.45"
            />
            <ellipse
              cx="256"
              cy="228"
              rx="26"
              ry="1.2"
              fill="#cfe8ff"
              transform="rotate(-45 256 228)"
              opacity="0.45"
            />
          </g>
        </g>

        {/* Kıvılcımlar */}
        <g className="zw-sparks">
          {sparks.map((s, i) => (
            <circle
              key={i}
              className="zw-spark"
              cx="256"
              cy="228"
              r={s.size}
              fill={i % 3 === 0 ? "#ffd27a" : "#ffb347"}
              style={
                {
                  "--dx": `${s.dx}px`,
                  "--dy": `${s.dy}px`,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.dur}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>

        {/* Kaskın ark tarafına vuran kenar ışığı */}
        <path
          className="zw-flicker zw-rimlight"
          d="M 161 68 L 164 98 Q 165 112 152 114"
          stroke="#9ccbff"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n-client";

/** Bu calismanin bir sunum/demo oldugunu belirten ust serit. */
export function DemoRibbon() {
  const t = useT();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(window.sessionStorage.getItem("zw.demoRibbon") === "hidden");
  }, []);

  if (hidden) return null;

  return (
    <div className="bg-zw-ink px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
        <span className="rounded-[2px] bg-zw-red-600 px-1.5 py-0.5 text-[10px] font-bold">
          {t.common.demoBadge}
        </span>
        <span className="text-zw-grey-300">{t.footer.demoDisclaimer}</span>
        <button
          onClick={() => {
            window.sessionStorage.setItem("zw.demoRibbon", "hidden");
            setHidden(true);
          }}
          className="ml-auto shrink-0 text-zw-grey-400 transition-colors hover:text-white"
          aria-label={t.common.close}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * BOT TUZAGI (gorunmez alan)
 *
 * Ziyaretci bu alani gormez ve klavyeyle ulasamaz; formu otomatik dolduran
 * botlar ise doldurur. Deger gonderime "website" adiyla eklenir; dolu
 * gelirse sunucu e-posta gondermez (lib/server/mail.ts → isBot).
 *
 *   const bot = useBotTrap();
 *   <form>… {bot.field} …</form>
 *   notifyZenweld("iletisim", form, bot.website);
 */
export function useBotTrap() {
  const [website, setWebsite] = useState("");
  const field = (
    <div aria-hidden="true" className="sr-only">
      <label>
        Web siteniz
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>
    </div>
  );
  return { website, field };
}

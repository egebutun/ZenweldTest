"use client";

import { useState } from "react";

/**
 * BOT TUZAGI (gorunmez alan)
 *
 * Ziyaretci bu alani gormez ve klavyeyle ulasamaz; formu otomatik dolduran
 * botlar ise doldurur. Deger gonderime "website" adiyla eklenir; dolu
 * gelirse sunucu e-posta gondermez (lib/server/mail.ts → isBot).
 *
 * Alanin adi ve etiketi tarayicinin ve sifre yoneticilerinin otomatik
 * doldurmasinin tanimadigi bir ad: "website", "url" gibi adlari 1Password
 * gibi araclar doldurabilir, gercek ziyaretcinin mesaji kaybolurdu.
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
        Bu alanı boş bırakın
        <input
          type="text"
          name="zw_dogrulama"
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

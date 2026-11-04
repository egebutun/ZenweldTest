"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ACCOUNT_LIMITS, useAuth } from "@zenweld/auth";
import { tr } from "@zenweld/i18n";
import { accountRequest } from "./account-api";

const STORAGE_KEY = "zenweld.favourites.v1";
const NONE: string[] = [];
const LIMIT_ERROR = tr.account.errors.favouriteLimit.replace("{max}", String(ACCOUNT_LIMITS.favourites));

interface FavouritesValue {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

const FavouritesContext = createContext<FavouritesValue | null>(null);

const parse = (raw: string | null): string[] => {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

function readStored(): string[] {
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeStored(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* yok say */
  }
}

/**
 * FAVORI URUNLER (KARARLAR K-96)
 *
 * - Giris yapmamis ziyaretci ve demo modu: liste tarayicida.
 * - Veritabani modunda giris yapmis uye: liste sunucuda (Asama 5.1); her
 *   cihazda ayni. Giriste tarayicidaki favoriler hesaba eklenir ve
 *   tarayicidan silinir. Cikista hesaptaki favoriler kalir, kalpler bos
 *   gorunur.
 * - En fazla 500 favori.
 *
 * Liste tek yerde tutulur: her kart kendi kopyasini tutsaydi, bir kartta
 * eklenen favori digerinin kaydiyla silinirdi. Baska sekmedeki degisiklik
 * de buraya alinir.
 */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user, api } = useAuth();
  const member = api && user ? user.id : null;
  const [local, setLocal] = useState<string[]>([]);
  const [remote, setRemote] = useState<string[] | null>(null);

  useEffect(() => {
    setLocal(readStored());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setLocal(parse(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Uye girince hesaptaki liste okunur; tarayicidaki favoriler hesaba eklenir.
  useEffect(() => {
    if (!api || !member) {
      setRemote(null);
      return;
    }
    let active = true;
    const pending = readStored();
    const request = pending.length
      ? accountRequest<{ ids: string[] }>(api, "favori-ekle", { ids: pending })
      : accountRequest<{ ids: string[] }>(api, "favoriler");
    void request.then((answer) => {
      if (!active) return;
      setRemote(answer.ok ? answer.ids : []);
      if (answer.ok && pending.length) {
        writeStored([]);
        setLocal([]);
      }
    });
    return () => {
      active = false;
    };
  }, [api, member]);

  const ids = useMemo(() => (member ? (remote ?? NONE) : local), [member, remote, local]);

  const toggle = useCallback(
    (id: string) => {
      const adding = !ids.includes(id);
      if (adding && ids.length >= ACCOUNT_LIMITS.favourites) {
        window.alert(LIMIT_ERROR);
        return;
      }
      if (!api || !member) {
        const next = adding ? [...ids, id] : ids.filter((x) => x !== id);
        writeStored(next);
        setLocal(next);
        return;
      }
      // Hemen gosterilir; sunucunun yaniti listeyi kesinlestirir.
      setRemote(adding ? [...ids, id] : ids.filter((x) => x !== id));
      void accountRequest<{ ids: string[] }>(api, adding ? "favori-ekle" : "favori-cikar", adding ? { ids: [id] } : { id }).then(
        (answer) => {
          if (answer.ok) setRemote(answer.ids);
          else {
            setRemote(ids);
            window.alert(answer.error);
          }
        },
      );
    },
    [api, member, ids],
  );

  const value = useMemo<FavouritesValue>(() => ({ ids, toggle, has: (id) => ids.includes(id) }), [ids, toggle]);

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites, FavouritesProvider içinde kullanılmalıdır.");
  return ctx;
}

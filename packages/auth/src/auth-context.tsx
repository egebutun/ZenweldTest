"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, UserRole } from "@zenweld/data";
import { addUser, findUserById, getSnapshot, saveUser, useDatabase } from "@zenweld/store";
import { demoHash, verifyPassword } from "./hash";

/** Ana site (musteri) oturumu. */
const SESSION_KEY = "zenweld.session.v1";

export interface RegisterInput {
  role: Exclude<UserRole, "admin">;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  city?: string;
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  sector?: string;
  dealerCode?: string;
  newsletter?: boolean;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

interface AuthContextValue {
  user: User | null;
  /** Oturum localStorage'dan okundu mu (ilk render'da false) */
  ready: boolean;
  login: (email: string, password: string) => AuthResult;
  logout: () => void;
  register: (input: RegisterInput) => AuthResult;
  updateProfile: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * OTURUM SAGLAYICI
 *
 * Ana site ile yonetim paneli (ana site /yonetim) ayni tarayici deposunu
 * paylasir, ama oturumlari AYRIDIR:
 *
 *   - sessionKey: her uygulama oturumu kendi anahtarinda tutar; panelden
 *     cikis yapmak ana sitedeki oturumu etkilemez, tersi de oyle.
 *   - roles: uygulamaya giris yapabilecek roller. Ana site yonetici
 *     hesaplarini kabul etmez; panel yalnizca yonetici hesaplarini kabul
 *     eder. Izinsiz rol, "hesap bulunamadi" ile ayni mesaji alir — boylece
 *     ana sitenin giris formu yonetici e-postalarini ele vermez.
 *   - storeId: hangi sitenin hesaplari. Bos = ana site (Zenweld). Bir bayi
 *     magazasinin kimligi verilirse yalnizca o magazanin uyeleri (User.storeId)
 *     ve o magazayi isleten bayi hesabi (User.retailerId) kabul edilir.
 *     Kayit olan kullanici o magazanin uyesi olarak acilir.
 *
 *   ana site           roles: bireysel, kurumsal        storeId: -
 *   ana yonetim paneli roles: yonetici                  storeId: -
 *   bayi magazasi      roles: bireysel, kurumsal        storeId: magaza
 *   bayi paneli        roles: bayi                      storeId: magaza
 */
export function AuthProvider({
  children,
  sessionKey = SESSION_KEY,
  roles,
  storeId,
}: {
  children: ReactNode;
  sessionKey?: string;
  /** Bos birakilirsa tum roller giris yapabilir. */
  roles?: UserRole[];
  /** Bayi magazasi (Retailer.id); bos ise ana site. */
  storeId?: string;
}) {
  const db = useDatabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const allowed = useCallback(
    (u: User) => {
      if (roles && !roles.includes(u.role)) return false;
      // Bayi hesabi kendi magazasina, musteri uye oldugu siteye baglidir.
      const site = u.role === "dealer" ? u.retailerId : u.storeId;
      return (site || undefined) === (storeId || undefined);
    },
    // roles dizisi her render'da yeniden olusabilir; icerigine bagliyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles?.join("|"), storeId],
  );

  /**
   * Bu sitenin hesaplari arasinda e-posta arar. Ayni e-posta ana sitede ve
   * bir bayi magazasinda ayri ayri uye olabilir; ikisi farkli hesaptir.
   */
  const findHere = useCallback(
    (email: string) => {
      const wanted = email.toLowerCase().trim();
      return getSnapshot().users.find(
        (u) => u.email.toLowerCase() === wanted && allowed(u),
      );
    },
    [allowed],
  );

  useEffect(() => {
    try {
      setUserId(window.localStorage.getItem(sessionKey));
    } catch {
      /* gizli sekme vb. */
    }
    setReady(true);
  }, [sessionKey]);

  const user = useMemo(() => {
    if (!userId) return null;
    const found = findUserById(userId, db);
    return found && allowed(found) ? found : null;
  }, [userId, db, allowed]);

  const login = useCallback<AuthContextValue["login"]>((email, password) => {
    const found = findHere(email);
    if (!found) {
      return { ok: false, error: "Bu e-posta ile kayıtlı bir hesap bulunamadı." };
    }
    if (!verifyPassword(password, found.passwordHash)) {
      return { ok: false, error: "Şifre hatalı." };
    }
    if (found.status === "suspended") {
      return { ok: false, error: "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin." };
    }
    saveUser({ ...found, lastLoginAt: new Date().toISOString() });
    try {
      window.localStorage.setItem(sessionKey, found.id);
    } catch {
      /* yok say */
    }
    setUserId(found.id);
    return { ok: true, user: found };
  }, [findHere, sessionKey]);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(sessionKey);
    } catch {
      /* yok say */
    }
    setUserId(null);
  }, [sessionKey]);

  const register = useCallback<AuthContextValue["register"]>((input) => {
    // Kayit, bu sitenin (ana site ya da magaza) hesaplari arasinda tekil olmali.
    const wanted = input.email.toLowerCase().trim();
    const taken = getSnapshot().users.some(
      (u) =>
        u.email.toLowerCase() === wanted &&
        ((u.role === "dealer" ? u.retailerId : u.storeId) || undefined) === (storeId || undefined),
    );
    if (taken) {
      return { ok: false, error: "Bu e-posta adresi zaten kayıtlı." };
    }
    if (input.password.length < 6) {
      return { ok: false, error: "Şifre en az 6 karakter olmalıdır." };
    }
    const newUser: User = {
      id: `u-${Date.now().toString(36)}`,
      role: input.role,
      // Bayi hesaplari onaya tabi, digerleri aninda aktif.
      status: input.role === "dealer" ? "pending" : "active",
      email: input.email.trim().toLowerCase(),
      passwordHash: demoHash(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      city: input.city,
      companyName: input.companyName,
      taxOffice: input.taxOffice,
      taxNumber: input.taxNumber,
      sector: input.sector,
      dealerCode: input.dealerCode,
      storeId,
      createdAt: new Date().toISOString(),
      newsletter: input.newsletter ?? false,
    };
    addUser(newUser);
    try {
      window.localStorage.setItem(sessionKey, newUser.id);
    } catch {
      /* yok say */
    }
    setUserId(newUser.id);
    return { ok: true, user: newUser };
  }, [sessionKey, storeId]);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    (patch) => {
      if (!user) return;
      saveUser({ ...user, ...patch });
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, ready, login, logout, register, updateProfile }),
    [user, ready, login, logout, register, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return ctx;
}

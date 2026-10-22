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
import { addUser, deleteUser, findUserById, getSnapshot, saveUser, useDatabase } from "@zenweld/store";
import { demoHash, verifyPassword } from "./hash";

/** Ana site (musteri) oturumu. */
const SESSION_KEY = "zenweld.session.v1";

/** Uye olurken ve sifre degistirirken en kisa sifre. */
const MIN_PASSWORD_LENGTH = 6;

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
  /** Giris yapmis kisinin sifresi: mevcut sifre dogru olmali. */
  changePassword: (current: string, next: string) => AuthResult;
  /**
   * Giris yapmis kisi kendi hesabini siler (sifresiyle onaylar) ve oturum
   * kapanir. Panelden silmeyle ayni: hesap ve adresler silinir; siparis,
   * teklif, servis talebi, garanti ve yorumlar kalir.
   */
  deleteAccount: (password: string) => AuthResult;
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
 *
 *   ana site           roles: bireysel, kurumsal
 *   yonetim paneli     roles: yonetici
 */
export function AuthProvider({
  children,
  sessionKey = SESSION_KEY,
  roles,
}: {
  children: ReactNode;
  sessionKey?: string;
  /** Bos birakilirsa tum roller giris yapabilir. */
  roles?: UserRole[];
}) {
  const db = useDatabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const allowed = useCallback(
    (u: User) => !roles || roles.includes(u.role),
    // roles dizisi her render'da yeniden olusabilir; icerigine bagliyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles?.join("|")],
  );

  /** Bu uygulamaya giris yapabilecek hesaplar arasinda e-posta arar. */
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
    // Yonetici hesabi askiya alirsa acik oturum da hemen kapanir.
    return found && allowed(found) && found.status !== "suspended" ? found : null;
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
    const wanted = input.email.toLowerCase().trim();
    const taken = getSnapshot().users.some((u) => u.email.toLowerCase() === wanted);
    if (taken) {
      return { ok: false, error: "Bu e-posta adresi zaten kayıtlı." };
    }
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` };
    }
    const newUser: User = {
      id: `u-${Date.now().toString(36)}`,
      role: input.role,
      status: "active",
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
  }, [sessionKey]);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    (patch) => {
      if (!user) return;
      saveUser({ ...user, ...patch });
    },
    [user],
  );

  const changePassword = useCallback<AuthContextValue["changePassword"]>(
    (current, next) => {
      if (!user) return { ok: false, error: "Oturumunuz kapanmış. Lütfen yeniden giriş yapın." };
      if (!verifyPassword(current, user.passwordHash)) return { ok: false, error: "Mevcut şifre hatalı." };
      if (next.length < MIN_PASSWORD_LENGTH) {
        return { ok: false, error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` };
      }
      if (!saveUser({ ...user, passwordHash: demoHash(next) })) {
        return { ok: false, error: "Şifre kaydedilemedi. Lütfen tekrar deneyin." };
      }
      return { ok: true, user };
    },
    [user],
  );

  const deleteAccount = useCallback<AuthContextValue["deleteAccount"]>(
    (password) => {
      if (!user) return { ok: false, error: "Oturumunuz kapanmış. Lütfen yeniden giriş yapın." };
      if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: "Şifre hatalı." };
      if (!deleteUser(user.id)) return { ok: false, error: "Hesap silinemedi. Lütfen tekrar deneyin." };
      logout();
      return { ok: true };
    },
    [user, logout],
  );

  const value = useMemo(
    () => ({ user, ready, login, logout, register, updateProfile, changePassword, deleteAccount }),
    [user, ready, login, logout, register, updateProfile, changePassword, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return ctx;
}

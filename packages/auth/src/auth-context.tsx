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
import { addUser, findUserByEmail, findUserById, saveUser, useDatabase } from "@zenweld/store";
import { demoHash, verifyPassword } from "./hash";

/** Ana site (musteri ve bayi) oturumu. */
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
 * Ana site ile yonetim paneli (apps/admin) ayni tarayici deposunu
 * paylasir, ama oturumlari AYRIDIR:
 *
 *   - sessionKey: her uygulama oturumu kendi anahtarinda tutar; panelden
 *     cikis yapmak ana sitedeki oturumu etkilemez, tersi de oyle.
 *   - roles: uygulamaya giris yapabilecek roller. Ana site yonetici
 *     hesaplarini kabul etmez; panel yalnizca yonetici hesaplarini kabul
 *     eder. Izinsiz rol, "hesap bulunamadi" ile ayni mesaji alir — boylece
 *     ana sitenin giris formu yonetici e-postalarini ele vermez.
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
    const found = findUserByEmail(email);
    if (!found || !allowed(found)) {
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
  }, [allowed, sessionKey]);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(sessionKey);
    } catch {
      /* yok say */
    }
    setUserId(null);
  }, [sessionKey]);

  const register = useCallback<AuthContextValue["register"]>((input) => {
    if (findUserByEmail(input.email)) {
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

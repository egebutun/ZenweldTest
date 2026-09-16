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

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setUserId(window.localStorage.getItem(SESSION_KEY));
    } catch {
      /* gizli sekme vb. */
    }
    setReady(true);
  }, []);

  const user = useMemo(() => {
    if (!userId) return null;
    return findUserById(userId, db) ?? null;
  }, [userId, db]);

  const login = useCallback<AuthContextValue["login"]>((email, password) => {
    const found = findUserByEmail(email);
    if (!found) return { ok: false, error: "Bu e-posta ile kayıtlı bir hesap bulunamadı." };
    if (!verifyPassword(password, found.passwordHash)) {
      return { ok: false, error: "Şifre hatalı." };
    }
    if (found.status === "suspended") {
      return { ok: false, error: "Hesabınız askıya alınmış. Lütfen bizimle iletişime geçin." };
    }
    saveUser({ ...found, lastLoginAt: new Date().toISOString() });
    try {
      window.localStorage.setItem(SESSION_KEY, found.id);
    } catch {
      /* yok say */
    }
    setUserId(found.id);
    return { ok: true, user: found };
  }, []);

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      /* yok say */
    }
    setUserId(null);
  }, []);

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
      window.localStorage.setItem(SESSION_KEY, newUser.id);
    } catch {
      /* yok say */
    }
    setUserId(newUser.id);
    return { ok: true, user: newUser };
  }, []);

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

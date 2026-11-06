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
import { AUTH_ERRORS, passwordProblem } from "./rules";

/** Ana site (musteri) oturumu, demo modunda tarayicida. */
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
  newsletter?: boolean;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User;
}

/** Profilde degisebilen alanlar (e-posta degismez). */
export type ProfilePatch = Partial<
  Pick<User, "firstName" | "lastName" | "phone" | "city" | "companyName" | "taxOffice" | "taxNumber">
>;

interface AuthContextValue {
  user: User | null;
  /** Uyelik sunucudaysa uclarin adresi (veritabani modu); demo modunda null. */
  api: string | null;
  /** Oturum okundu mu (ilk cizimde false) */
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  updateProfile: (patch: ProfilePatch) => Promise<AuthResult>;
  /** Giris yapmis kisinin sifresi: mevcut sifre dogru olmali. */
  changePassword: (current: string, next: string) => Promise<AuthResult>;
  /**
   * Giris yapmis kisi kendi hesabini siler (sifresiyle onaylar) ve oturum
   * kapanir. Panelden silmeyle ayni: hesap ve adresler silinir; siparis,
   * teklif, servis ve iade talebi, garanti ve yorumlar kalir.
   */
  deleteAccount: (password: string) => Promise<AuthResult>;
  /** Sifre sifirlama baglantisi ister; hesap olsa da olmasa da ayni sonuc. */
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  /** E-postadaki baglantinin anahtariyla yeni sifre. */
  resetPassword: (token: string, password: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * OTURUM SAGLAYICI
 *
 * api: uyelik sunucuda (veritabani modu, Asama 4.2–4.3): islemler bu
 * adresteki uclara gider (site /api/uyelik, panel /api/yonetim/oturum),
 * oturum yalnizca sunucunun okuyabildigi cerezdedir. Yoksa demo: uyeler ve
 * oturum tarayicidadir.
 *
 * Demo modunda ana site ile yonetim paneli ayni tarayici deposunu paylasir,
 * ama oturumlari AYRIDIR:
 *
 *   - sessionKey: her uygulama oturumu kendi anahtarinda tutar; panelden
 *     cikis yapmak ana sitedeki oturumu etkilemez, tersi de oyle.
 *   - roles: uygulamaya giris yapabilecek roller. Ana site yonetici
 *     hesaplarini kabul etmez; panel yalnizca yonetici hesaplarini kabul
 *     eder. Izinsiz rol, yanlis sifreyle ayni mesaji alir.
 *
 *   ana site           roles: bireysel, kurumsal
 *   yonetim paneli     roles: yonetici
 */
export function AuthProvider({
  children,
  sessionKey = SESSION_KEY,
  roles,
  api,
}: {
  children: ReactNode;
  sessionKey?: string;
  /** Bos birakilirsa tum roller giris yapabilir (yalnizca demo modu). */
  roles?: UserRole[];
  /** Sunucudaki uyelik uclarinin adresi; verilmezse demo modu. */
  api?: string;
}) {
  return api ? (
    <ServerAuth api={api}>{children}</ServerAuth>
  ) : (
    <BrowserAuth sessionKey={sessionKey} roles={roles}>
      {children}
    </BrowserAuth>
  );
}

/* ------------------------------------------------------------------ */
/* Sunucu (veritabani modu)                                            */
/* ------------------------------------------------------------------ */

interface ApiAnswer {
  ok: boolean;
  user?: User | null;
  error?: string;
}

async function call(api: string, action: string, body?: unknown): Promise<ApiAnswer> {
  try {
    const response = await fetch(`${api}/${action}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const answer = (await response.json().catch(() => ({}))) as ApiAnswer;
    return response.ok ? { ...answer, ok: true } : { ok: false, error: answer.error ?? AUTH_ERRORS.failed };
  } catch {
    return { ok: false, error: AUTH_ERRORS.unreachable };
  }
}

function ServerAuth({ children, api }: { children: ReactNode; api: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void call(api, "ben").then((answer) => {
      if (!active) return;
      setUser(answer.ok ? (answer.user ?? null) : null);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [api]);

  const signIn = useCallback(
    async (action: string, body: unknown): Promise<AuthResult> => {
      const answer = await call(api, action, body);
      if (!answer.ok || !answer.user) return { ok: false, error: answer.error ?? AUTH_ERRORS.failed };
      setUser(answer.user);
      return { ok: true, user: answer.user };
    },
    [api],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      api,
      ready,
      login: (email, password) => signIn("giris", { email, password }),
      register: (input) => signIn("kayit", input),
      updateProfile: (patch) => signIn("profil", patch),
      logout: async () => {
        await call(api, "cikis", {});
        setUser(null);
      },
      changePassword: async (current, next) => {
        const answer = await call(api, "sifre", { current, next });
        return answer.ok ? { ok: true } : { ok: false, error: answer.error };
      },
      deleteAccount: async (password) => {
        const answer = await call(api, "hesap-sil", { password });
        if (!answer.ok) return { ok: false, error: answer.error };
        setUser(null);
        return { ok: true };
      },
      requestPasswordReset: async (email) => {
        const answer = await call(api, "sifre-unuttum", { email });
        return answer.ok ? { ok: true } : { ok: false, error: answer.error };
      },
      resetPassword: async (token, password) => {
        const answer = await call(api, "sifre-sifirla", { token, password });
        if (!answer.ok) return { ok: false, error: answer.error };
        setUser(null);
        return { ok: true };
      },
    }),
    [api, user, ready, signIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Tarayici (demo modu)                                                */
/* ------------------------------------------------------------------ */

function BrowserAuth({
  children,
  sessionKey,
  roles,
}: {
  children: ReactNode;
  sessionKey: string;
  roles?: UserRole[];
}) {
  const db = useDatabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // roles dizisi her render'da yeniden olusabilir; icerigine bagliyoruz.
  const rolesKey = roles?.join("|");
  const allowed = useCallback(
    (u: User) => !rolesKey || rolesKey.split("|").includes(u.role),
    [rolesKey],
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

  const remember = useCallback(
    (id: string | null) => {
      try {
        if (id) window.localStorage.setItem(sessionKey, id);
        else window.localStorage.removeItem(sessionKey);
      } catch {
        /* yok say */
      }
      setUserId(id);
    },
    [sessionKey],
  );

  const login = useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      const wanted = email.toLowerCase().trim();
      const found = getSnapshot().users.find((u) => u.email.toLowerCase() === wanted && allowed(u));
      // Hesap yoksa da sifre yanlissa da ayni mesaj (K-94).
      if (!found || !verifyPassword(password, found.passwordHash)) {
        return { ok: false, error: AUTH_ERRORS.invalidLogin };
      }
      if (found.status === "suspended") return { ok: false, error: AUTH_ERRORS.suspended };
      saveUser({ ...found, lastLoginAt: new Date().toISOString() });
      remember(found.id);
      return { ok: true, user: found };
    },
    [allowed, remember],
  );

  const logout = useCallback(async () => remember(null), [remember]);

  const register = useCallback<AuthContextValue["register"]>(
    async (input) => {
      const wanted = input.email.toLowerCase().trim();
      if (getSnapshot().users.some((u) => u.email.toLowerCase() === wanted)) {
        return { ok: false, error: AUTH_ERRORS.emailTaken };
      }
      const problem = passwordProblem(input.password);
      if (problem) return { ok: false, error: problem };
      const newUser: User = {
        id: `u-${Date.now().toString(36)}`,
        role: input.role,
        status: "active",
        email: wanted,
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
      if (!addUser(newUser)) return { ok: false, error: AUTH_ERRORS.storageFull };
      remember(newUser.id);
      return { ok: true, user: newUser };
    },
    [remember],
  );

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (patch) => {
      if (!user) return { ok: false, error: AUTH_ERRORS.sessionEnded };
      const updated = { ...user, ...patch };
      saveUser(updated);
      return { ok: true, user: updated };
    },
    [user],
  );

  const changePassword = useCallback<AuthContextValue["changePassword"]>(
    async (current, next) => {
      if (!user) return { ok: false, error: AUTH_ERRORS.sessionEnded };
      if (!verifyPassword(current, user.passwordHash)) return { ok: false, error: AUTH_ERRORS.wrongCurrentPassword };
      const problem = passwordProblem(next);
      if (problem) return { ok: false, error: problem };
      if (!saveUser({ ...user, passwordHash: demoHash(next) })) return { ok: false, error: AUTH_ERRORS.failed };
      return { ok: true, user };
    },
    [user],
  );

  const deleteAccount = useCallback<AuthContextValue["deleteAccount"]>(
    async (password) => {
      if (!user) return { ok: false, error: AUTH_ERRORS.sessionEnded };
      if (!verifyPassword(password, user.passwordHash)) return { ok: false, error: AUTH_ERRORS.wrongPassword };
      if (!deleteUser(user.id)) return { ok: false, error: AUTH_ERRORS.failed };
      remember(null);
      return { ok: true };
    },
    [user, remember],
  );

  // Demo modunda e-posta gonderilmez; sifirlama baglantisi yoktur.
  const requestPasswordReset = useCallback<AuthContextValue["requestPasswordReset"]>(async () => ({ ok: true }), []);
  const resetPassword = useCallback<AuthContextValue["resetPassword"]>(
    async () => ({ ok: false, error: AUTH_ERRORS.resetLinkInvalid }),
    [],
  );

  const value = useMemo(
    () => ({
      user,
      api: null,
      ready,
      login,
      logout,
      register,
      updateProfile,
      changePassword,
      deleteAccount,
      requestPasswordReset,
      resetPassword,
    }),
    [user, ready, login, logout, register, updateProfile, changePassword, deleteAccount, requestPasswordReset, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  return ctx;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@zenweld/auth";
import { Alert, Button, FormRow, Input } from "@zenweld/ui";
import { useT } from "@/lib/i18n-client";

export default function ProfilePage() {
  const t = useT();
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    city: user?.city ?? "",
    companyName: user?.companyName ?? "",
    taxOffice: user?.taxOffice ?? "",
    taxNumber: user?.taxNumber ?? "",
  });

  if (!user) return null;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="max-w-xl space-y-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile(form);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        }}
        className="space-y-4"
      >
        {saved && <Alert tone="success">Profiliniz güncellendi.</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow label={t.auth.firstName}>
            <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </FormRow>
          <FormRow label={t.auth.lastName}>
            <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </FormRow>
        </div>

        <FormRow label={t.auth.email}>
          <Input value={user.email} disabled />
        </FormRow>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow label={t.auth.phone}>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </FormRow>
          <FormRow label={t.auth.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </FormRow>
        </div>

        {user.role !== "individual" && (
          <>
            <FormRow label={t.auth.companyName}>
              <Input
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </FormRow>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label={t.auth.taxOffice}>
                <Input value={form.taxOffice} onChange={(e) => set("taxOffice", e.target.value)} />
              </FormRow>
              <FormRow label={t.auth.taxNumber}>
                <Input value={form.taxNumber} onChange={(e) => set("taxNumber", e.target.value)} />
              </FormRow>
            </div>
          </>
        )}

        <Button type="submit" size="lg">
          {t.common.save}
        </Button>
      </form>

      <ChangePassword />
      <DeleteAccount />
    </div>
  );
}

/** Mevcut sifre, yeni sifre ve tekrari; kurallar useAuth().changePassword'da. */
function ChangePassword() {
  const t = useT();
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", again: "" });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (form.next !== form.again) {
          setMessage({ ok: false, text: t.auth.passwordMismatch });
          return;
        }
        const result = changePassword(form.current, form.next);
        setMessage(result.ok ? { ok: true, text: t.account.passwordChanged } : { ok: false, text: result.error ?? "" });
        if (result.ok) setForm({ current: "", next: "", again: "" });
      }}
      className="space-y-4"
    >
      <h2 className="font-display text-xl font-bold uppercase">{t.account.changePassword}</h2>
      {message && <Alert tone={message.ok ? "success" : "danger"}>{message.text}</Alert>}
      <FormRow label={t.account.currentPassword} required htmlFor="current-password">
        <Input
          id="current-password"
          type="password"
          required
          autoComplete="current-password"
          value={form.current}
          onChange={(e) => setForm({ ...form, current: e.target.value })}
        />
      </FormRow>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow label={t.account.newPassword} required hint="En az 6 karakter" htmlFor="new-password">
          <Input
            id="new-password"
            type="password"
            required
            autoComplete="new-password"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
          />
        </FormRow>
        <FormRow label={t.account.newPasswordAgain} required htmlFor="new-password-again">
          <Input
            id="new-password-again"
            type="password"
            required
            autoComplete="new-password"
            value={form.again}
            onChange={(e) => setForm({ ...form, again: e.target.value })}
          />
        </FormRow>
      </div>
      <Button type="submit" variant="outline">
        {t.account.changePassword}
      </Button>
    </form>
  );
}

/** Uye kendi hesabini siler; sifresiyle ve onay sorusuyla. */
function DeleteAccount() {
  const t = useT();
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm(t.account.deleteAccountConfirm)) return;
        const result = deleteAccount(password);
        if (!result.ok) {
          setError(result.error ?? "");
          return;
        }
        router.replace("/giris?hesap=silindi");
      }}
      className="space-y-4 border-t border-zw-grey-200 pt-8"
    >
      <h2 className="font-display text-xl font-bold uppercase">{t.account.deleteAccount}</h2>
      <p className="text-sm text-zw-grey-600">{t.account.deleteAccountText}</p>
      {error && <Alert tone="danger">{error}</Alert>}
      <FormRow label={t.account.deleteAccountPassword} required htmlFor="delete-password">
        <Input
          id="delete-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormRow>
      <Button type="submit" variant="outline">
        {t.account.deleteAccount}
      </Button>
    </form>
  );
}

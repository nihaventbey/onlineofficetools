"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("same password") || m.includes("different from the old")) {
    return "Yeni parola mevcut paroladan farklı olmalıdır.";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "Parola çok zayıf. En az 8 karakter kullanın.";
  }
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Mevcut parola hatalı.";
  }
  if (m.includes("email") && m.includes("already")) {
    return "Bu e-posta adresi zaten kullanılıyor.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.";
  }
  return message || "İşlem tamamlanamadı.";
}

export default function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const notice = searchParams.get("notice");
    if (notice === "email-confirmed") {
      setEmailMsg("E-posta değişikliği onaylandı.");
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setLoading(false);
    });
  }, []);

  async function onChangeEmail(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailMsg(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (!newEmail.trim() || newEmail.trim() === email) {
      setEmailError("Geçerli yeni bir e-posta girin.");
      return;
    }
    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim(),
    });
    setEmailBusy(false);
    if (error) {
      setEmailError(friendlyAuthError(error.message));
      return;
    }
    setEmailMsg(
      "Onay e-postaları gönderildi. Değişikliğin tamamlanması için mevcut ve yeni adreslerinizi doğrulayın.",
    );
    setNewEmail("");
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    if (newPassword.length < 8) {
      setPasswordError("Yeni parola en az 8 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Yeni parola tekrarları eşleşmiyor.");
      return;
    }

    setPasswordBusy(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordBusy(false);
      setPasswordError(friendlyAuthError(signInError.message));
      return;
    }

    let nonce: string | undefined;
    try {
      const { data: reauth, error: reauthError } =
        await supabase.auth.reauthenticate();
      if (!reauthError && reauth && "nonce" in reauth) {
        nonce = (reauth as { nonce?: string }).nonce;
      }
    } catch {
      // reauthenticate may be unavailable depending on project settings
    }

    const updatePayload: { password: string; nonce?: string } = {
      password: newPassword,
    };
    if (nonce) updatePayload.nonce = nonce;

    const { error } = await supabase.auth.updateUser(updatePayload);
    setPasswordBusy(false);

    if (error) {
      setPasswordError(friendlyAuthError(error.message));
      return;
    }

    setPasswordMsg("Parola güncellendi.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    router.refresh();
  }

  if (!isSupabaseConfigured()) {
    return (
      <p className="text-sm text-amber-800">Supabase yapılandırılmamış.</p>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Hesabım</h1>
        <p className="mt-1 text-sm text-slate-500">
          Yönetici e-posta ve parola ayarlarını güncelleyin.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">E-posta</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mevcut: <span className="font-medium text-slate-800">{email}</span>
        </p>
        <form onSubmit={onChangeEmail} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Yeni e-posta
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
            />
          </label>
          {emailError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {emailError}
            </p>
          ) : null}
          {emailMsg ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {emailMsg}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={emailBusy}
            className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {emailBusy ? "Gönderiliyor…" : "E-posta değişikliğini başlat"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Parola</h2>
        <form onSubmit={onChangePassword} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Mevcut parola
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Yeni parola
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Yeni parola (tekrar)
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-400"
            />
          </label>
          {passwordError ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          ) : null}
          {passwordMsg ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {passwordMsg}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={passwordBusy}
            className="min-h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {passwordBusy ? "Güncelleniyor…" : "Parolayı güncelle"}
          </button>
        </form>
      </section>
    </div>
  );
}

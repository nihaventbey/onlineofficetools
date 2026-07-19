"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (m.includes("email not confirmed")) {
    return "E-posta henüz doğrulanmamış.";
  }
  if (m.includes("too many")) {
    return "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin.";
  }
  return message || "Giriş yapılamadı.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!configured) {
      setError("Supabase ortam değişkenleri eksik. .env.local dosyasını kontrol edin.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase istemcisi oluşturulamadı.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(friendlyError(signInError.message));
      return;
    }

    const role = data.user?.app_metadata?.role;
    if (role !== "admin") {
      await supabase.auth.signOut();
      setError("Bu hesap yönetici yetkisine sahip değil.");
      return;
    }

    // Ensure Server Components / proxy see the cookie session immediately.
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <aside className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 px-6 py-10 text-white lg:flex lg:w-[42%] lg:flex-col lg:justify-between lg:px-12 lg:py-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-sky-200/30 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            Online Office Tools
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Yönetim paneli
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-50/95">
            Araçları, içerikleri ve site ayarlarını güvenli şekilde yönetin.
          </p>
        </div>
        <ul className="relative mt-8 hidden space-y-2 text-sm text-blue-50 lg:block">
          <li>• Araç yayınlama ve düzenleme</li>
          <li>• Logo ve site ayarları</li>
          <li>• Medya yükleme</li>
        </ul>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Giriş yap</h2>
            <p className="mt-1 text-sm text-slate-500">
              Yönetici hesabınızla oturum açın.
            </p>
          </div>

          {!configured ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Supabase yapılandırılmamış.{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
              <code className="text-xs">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>{" "}
              gerekli.
            </p>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">E-posta</span>
            <input
              ref={emailRef}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              placeholder="ornek@email.com"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">Şifre</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-20 text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-medium text-slate-500 hover:text-blue-600"
              >
                {showPassword ? "Gizle" : "Göster"}
              </button>
            </div>
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !configured}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Giriş yapılıyor…
              </>
            ) : (
              "Giriş yap"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

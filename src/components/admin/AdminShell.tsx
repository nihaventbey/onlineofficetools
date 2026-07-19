"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type AdminShellProps = {
  children: React.ReactNode;
};

function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  return user.app_metadata?.role === "admin";
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [configured] = useState(isSupabaseConfigured());

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setChecking(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (checking || isLogin) return;
    if (!configured) return;
    if (!session || !isAdminUser(session.user)) {
      router.replace("/admin/login");
    }
  }, [checking, configured, isLogin, router, session]);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (isLogin) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-lg font-semibold">Supabase yapılandırılmamış</h1>
          <p className="mt-2 text-sm">
            <code>.env.local</code> dosyasında{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> tanımlayın.
          </p>
        </div>
      </div>
    );
  }

  if (!session || !isAdminUser(session.user)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Giriş sayfasına yönlendiriliyor…
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Panel" },
    { href: "/admin/tools", label: "Araçlar" },
    { href: "/admin/media", label: "Medya" },
    { href: "/admin/ads", label: "Reklamlar" },
    { href: "/admin/settings", label: "Ayarlar" },
    { href: "/admin/account", label: "Hesabım" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/admin" className="font-semibold text-slate-900">
              CMS Admin
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm">
              {links.map((link) => {
                const active =
                  link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      active
                        ? "font-medium text-blue-600"
                        : "text-slate-600 hover:text-slate-900"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Çıkış
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

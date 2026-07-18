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
  const role = user.app_metadata?.role;
  return role === "admin";
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
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Checking session…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h1 className="text-lg font-semibold">Supabase is not configured</h1>
          <p className="mt-2 text-sm">
            Copy <code>.env.example</code> to <code>.env.local</code> and set{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  if (!session || !isAdminUser(session.user)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Redirecting to login…
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/tools", label: "Tools" },
    { href: "/admin/media", label: "Media" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              CMS Admin
            </Link>
            <nav className="flex gap-3 text-sm">
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
                        ? "font-medium text-violet-600"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
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
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}

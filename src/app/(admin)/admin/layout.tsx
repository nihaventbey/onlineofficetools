import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/supabase/requireAdminUser";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Admin | Online Office Tools",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: middleware already blocks unauthenticated/non-admin
  // access to everything under `/admin` except `/admin/login`, but this
  // server-side check protects the panel even if middleware is ever
  // bypassed or misconfigured.
  const pathname = (await headers()).get("x-pathname");
  if (pathname !== "/admin/login") {
    const user = await getAdminUser();
    if (!user) {
      redirect("/admin/login");
    }
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

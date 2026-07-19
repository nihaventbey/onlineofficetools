import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/supabase/requireAdminUser";
import "../../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin | Online Office Tools",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: the proxy already blocks unauthenticated/non-admin
  // access to everything under `/admin` except `/admin/login`, but this
  // server-side check protects the panel even if the proxy is ever
  // bypassed or misconfigured.
  const pathname = (await headers()).get("x-pathname");
  if (pathname !== "/admin/login") {
    const user = await getAdminUser();
    if (!user) {
      redirect("/admin/login");
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}

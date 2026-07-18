"use client";

import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage published tools and media. Publishing triggers a Vercel
          rebuild via Supabase webhook (configured in the dashboard).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/tools"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold">Tools</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Create, translate, draft, and publish office tools.
          </p>
        </Link>
        <Link
          href="/admin/media"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold">Media</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Upload and manage images in Supabase Storage.
          </p>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-start justify-center gap-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-300">
        The page you requested does not exist or is no longer available.
      </p>
      <Link
        href="/en"
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Back to home
      </Link>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-4 py-8" aria-busy="true" aria-live="polite">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

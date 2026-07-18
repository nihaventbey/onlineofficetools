import type { Dictionary } from "@/lib/i18n";

type FooterProps = {
  dict: Dictionary;
};

export default function Footer({ dict }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-zinc-400">
        <p>
          © {year} {dict.common.siteName}. {dict.common.footerRights}
        </p>
        <div className="flex gap-4">
          <span>{dict.common.privacy}</span>
          <span>{dict.common.terms}</span>
        </div>
      </div>
    </footer>
  );
}

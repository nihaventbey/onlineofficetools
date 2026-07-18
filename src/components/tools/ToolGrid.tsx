import ToolCard from "@/components/tools/ToolCard";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";

type ToolGridProps = {
  locale: Locale;
  tools: CmsToolCard[];
  dict: Dictionary;
};

export default function ToolGrid({ locale, tools, dict }: ToolGridProps) {
  if (!tools.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        {dict.common.noResults}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard
          key={tool.slug}
          locale={locale}
          slug={tool.slug}
          title={tool.title}
          description={tool.description}
          categoryLabel={dict.categories[tool.category]}
          cta={dict.common.openTool}
        />
      ))}
    </div>
  );
}

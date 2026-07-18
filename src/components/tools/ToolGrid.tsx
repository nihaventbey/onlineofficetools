import ToolCard from "@/components/tools/ToolCard";
import type { CmsToolCard } from "@/lib/cms";
import type { Dictionary, Locale } from "@/lib/i18n";

type ToolGridProps = {
  locale: Locale;
  tools: CmsToolCard[];
  dict: Dictionary;
  compact?: boolean;
};

export default function ToolGrid({
  locale,
  tools,
  dict,
  compact = false,
}: ToolGridProps) {
  if (!tools.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {dict.common.noResults}
      </p>
    );
  }

  const badgeLabels = {
    new: dict.common.newBadge,
    popular: dict.common.popularBadge,
    beta: dict.common.betaBadge,
  };

  return (
    <div
      className={
        compact
          ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {tools.map((tool) => (
        <ToolCard
          key={tool.slug}
          locale={locale}
          slug={tool.slug}
          title={tool.title}
          description={tool.description}
          categoryLabel={dict.categories[tool.category]}
          cta={dict.common.openTool}
          compact={compact}
          coverUrl={tool.coverUrl}
          badgeLabels={badgeLabels}
        />
      ))}
    </div>
  );
}

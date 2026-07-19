export const toolCategories = [
  "text",
  "documents",
  "spreadsheets",
  "presentations",
  "pdf",
  "image",
  "archive",
  "video",
  "ebys",
  "developer",
  "security",
  "calculator",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

/** Categories that only appear for specific locales (others see all). */
const localeOnlyCategories: Partial<Record<ToolCategory, readonly string[]>> = {
  ebys: ["tr"],
};

export function visibleCategories(locale: string): ToolCategory[] {
  return toolCategories.filter((cat) => {
    const allowed = localeOnlyCategories[cat];
    if (!allowed) return true;
    return (allowed as readonly string[]).includes(locale);
  });
}

/** Soft pastel styles per category (Sejda-like) + hero tokens. */
export const categoryStyles: Record<
  ToolCategory,
  {
    bg: string;
    text: string;
    ring: string;
    soft: string;
    border: string;
    heroGradient: string;
    heroAccent: string;
    heroBlob: string;
    /** Hex colors for OG ImageResponse (no Tailwind). */
    ogFrom: string;
    ogTo: string;
    ogAccent: string;
  }
> = {
  text: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "hover:border-blue-300",
    soft: "bg-blue-50/70",
    border: "border-blue-100",
    heroGradient: "bg-gradient-to-br from-blue-100 via-blue-50/50 to-white",
    heroAccent: "text-blue-600",
    heroBlob: "bg-blue-200/40",
    ogFrom: "#dbeafe",
    ogTo: "#ffffff",
    ogAccent: "#2563eb",
  },
  documents: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    ring: "hover:border-sky-300",
    soft: "bg-sky-50/70",
    border: "border-sky-100",
    heroGradient: "bg-gradient-to-br from-sky-100 via-sky-50/50 to-white",
    heroAccent: "text-sky-600",
    heroBlob: "bg-sky-200/40",
    ogFrom: "#e0f2fe",
    ogTo: "#ffffff",
    ogAccent: "#0284c7",
  },
  spreadsheets: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "hover:border-emerald-300",
    soft: "bg-emerald-50/70",
    border: "border-emerald-100",
    heroGradient: "bg-gradient-to-br from-emerald-100 via-emerald-50/50 to-white",
    heroAccent: "text-emerald-600",
    heroBlob: "bg-emerald-200/40",
    ogFrom: "#d1fae5",
    ogTo: "#ffffff",
    ogAccent: "#059669",
  },
  presentations: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "hover:border-amber-300",
    soft: "bg-amber-50/70",
    border: "border-amber-100",
    heroGradient: "bg-gradient-to-br from-amber-100 via-amber-50/50 to-white",
    heroAccent: "text-amber-600",
    heroBlob: "bg-amber-200/40",
    ogFrom: "#fef3c7",
    ogTo: "#ffffff",
    ogAccent: "#d97706",
  },
  pdf: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "hover:border-rose-300",
    soft: "bg-rose-50/70",
    border: "border-rose-100",
    heroGradient: "bg-gradient-to-br from-rose-100 via-rose-50/50 to-white",
    heroAccent: "text-rose-600",
    heroBlob: "bg-rose-200/40",
    ogFrom: "#ffe4e6",
    ogTo: "#ffffff",
    ogAccent: "#e11d48",
  },
  image: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "hover:border-orange-300",
    soft: "bg-orange-50/70",
    border: "border-orange-100",
    heroGradient: "bg-gradient-to-br from-orange-100 via-orange-50/50 to-white",
    heroAccent: "text-orange-600",
    heroBlob: "bg-orange-200/40",
    ogFrom: "#ffedd5",
    ogTo: "#ffffff",
    ogAccent: "#ea580c",
  },
  archive: {
    bg: "bg-stone-50",
    text: "text-stone-700",
    ring: "hover:border-stone-300",
    soft: "bg-stone-50/70",
    border: "border-stone-100",
    heroGradient: "bg-gradient-to-br from-stone-100 via-stone-50/50 to-white",
    heroAccent: "text-stone-600",
    heroBlob: "bg-stone-200/40",
    ogFrom: "#f5f5f4",
    ogTo: "#ffffff",
    ogAccent: "#57534e",
  },
  video: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "hover:border-violet-300",
    soft: "bg-violet-50/70",
    border: "border-violet-100",
    heroGradient: "bg-gradient-to-br from-violet-100 via-violet-50/50 to-white",
    heroAccent: "text-violet-600",
    heroBlob: "bg-violet-200/40",
    ogFrom: "#ede9fe",
    ogTo: "#ffffff",
    ogAccent: "#7c3aed",
  },
  ebys: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    ring: "hover:border-amber-300",
    soft: "bg-amber-50/70",
    border: "border-slate-200",
    heroGradient: "bg-gradient-to-br from-slate-100 via-amber-50/40 to-white",
    heroAccent: "text-amber-700",
    heroBlob: "bg-amber-200/40",
    ogFrom: "#f1f5f9",
    ogTo: "#ffffff",
    ogAccent: "#b45309",
  },
  developer: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "hover:border-indigo-300",
    soft: "bg-indigo-50/70",
    border: "border-indigo-100",
    heroGradient: "bg-gradient-to-br from-indigo-100 via-indigo-50/50 to-white",
    heroAccent: "text-indigo-600",
    heroBlob: "bg-indigo-200/40",
    ogFrom: "#e0e7ff",
    ogTo: "#ffffff",
    ogAccent: "#4f46e5",
  },
  security: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "hover:border-teal-300",
    soft: "bg-teal-50/70",
    border: "border-teal-100",
    heroGradient: "bg-gradient-to-br from-teal-100 via-teal-50/50 to-white",
    heroAccent: "text-teal-600",
    heroBlob: "bg-teal-200/40",
    ogFrom: "#ccfbf1",
    ogTo: "#ffffff",
    ogAccent: "#0d9488",
  },
  calculator: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "hover:border-cyan-300",
    soft: "bg-cyan-50/70",
    border: "border-cyan-100",
    heroGradient: "bg-gradient-to-br from-cyan-100 via-cyan-50/50 to-white",
    heroAccent: "text-cyan-600",
    heroBlob: "bg-cyan-200/40",
    ogFrom: "#cffafe",
    ogTo: "#ffffff",
    ogAccent: "#0891b2",
  },
};

export function isToolCategory(value: string): value is ToolCategory {
  return (toolCategories as readonly string[]).includes(value);
}

export const toolCategories = [
  "text",
  "documents",
  "spreadsheets",
  "presentations",
  "pdf",
  "image",
  "developer",
  "security",
  "calculator",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

/** Soft pastel styles per category (Sejda-like). */
export const categoryStyles: Record<
  ToolCategory,
  { bg: string; text: string; ring: string; soft: string; border: string }
> = {
  text: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "hover:border-blue-300",
    soft: "bg-blue-50/70",
    border: "border-blue-100",
  },
  documents: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    ring: "hover:border-sky-300",
    soft: "bg-sky-50/70",
    border: "border-sky-100",
  },
  spreadsheets: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "hover:border-emerald-300",
    soft: "bg-emerald-50/70",
    border: "border-emerald-100",
  },
  presentations: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "hover:border-amber-300",
    soft: "bg-amber-50/70",
    border: "border-amber-100",
  },
  pdf: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "hover:border-rose-300",
    soft: "bg-rose-50/70",
    border: "border-rose-100",
  },
  image: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "hover:border-orange-300",
    soft: "bg-orange-50/70",
    border: "border-orange-100",
  },
  developer: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "hover:border-indigo-300",
    soft: "bg-indigo-50/70",
    border: "border-indigo-100",
  },
  security: {
    bg: "bg-teal-50",
    text: "text-teal-800",
    ring: "hover:border-teal-300",
    soft: "bg-teal-50/70",
    border: "border-teal-100",
  },
  calculator: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "hover:border-cyan-300",
    soft: "bg-cyan-50/70",
    border: "border-cyan-100",
  },
};

export function isToolCategory(value: string): value is ToolCategory {
  return (toolCategories as readonly string[]).includes(value);
}

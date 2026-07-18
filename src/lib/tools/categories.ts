export const toolCategories = [
  "text",
  "developer",
  "security",
  "image",
  "calculator",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

/** Soft pastel styles per category (Sejda-like). */
export const categoryStyles: Record<
  ToolCategory,
  { bg: string; text: string; ring: string }
> = {
  text: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "hover:border-blue-300",
  },
  developer: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "hover:border-indigo-300",
  },
  security: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "hover:border-emerald-300",
  },
  image: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "hover:border-orange-300",
  },
  calculator: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "hover:border-cyan-300",
  },
};

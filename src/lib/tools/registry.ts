/**
 * Public re-exports for tool catalog metadata.
 * Heavy tool components load via `@/lib/tools/loaders` only on tool pages.
 */
export type { ToolDictKey } from "@/lib/tools/types";
export type { ToolMeta, ToolBadge } from "@/lib/tools/metadata";
export {
  toolMetaList as toolRegistry,
  toolSlugs,
  getToolMeta as getToolBySlug,
  isRegisteredSlug,
  toolsByCategory,
  featuredTools,
} from "@/lib/tools/metadata";

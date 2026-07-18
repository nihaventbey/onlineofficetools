import type { ComponentType } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { ToolCategory } from "@/lib/tools/categories";
import WordCounter from "@/components/tools/WordCounter";
import JsonFormatter from "@/components/tools/JsonFormatter";
import PasswordGenerator from "@/components/tools/PasswordGenerator";
import LoremIpsum from "@/components/tools/LoremIpsum";
import TextDiff from "@/components/tools/TextDiff";
import Base64Tool from "@/components/tools/Base64Tool";
import CaseConverter from "@/components/tools/CaseConverter";

export type ToolDictKey = keyof Dictionary["tools"];

type AnyToolLabels = Dictionary["tools"][ToolDictKey];

export type ToolDefinition = {
  slug: string;
  category: ToolCategory;
  dictKey: ToolDictKey;
  icon: string;
  Component: ComponentType<{ labels: AnyToolLabels }>;
};

export const toolRegistry: ToolDefinition[] = [
  {
    slug: "word-counter",
    category: "text",
    dictKey: "wordCounter",
    icon: "Aa",
    Component: WordCounter as ComponentType<{ labels: AnyToolLabels }>,
  },
  {
    slug: "case-converter",
    category: "text",
    dictKey: "caseConverter",
    icon: "Aa⇄",
    Component: CaseConverter as ComponentType<{ labels: AnyToolLabels }>,
  },
  {
    slug: "lorem-ipsum",
    category: "text",
    dictKey: "loremIpsum",
    icon: "¶",
    Component: LoremIpsum as ComponentType<{ labels: AnyToolLabels }>,
  },
  {
    slug: "text-diff",
    category: "text",
    dictKey: "textDiff",
    icon: "≠",
    Component: TextDiff as ComponentType<{ labels: AnyToolLabels }>,
  },
  {
    slug: "json-formatter",
    category: "developer",
    dictKey: "jsonFormatter",
    icon: "{}",
    Component: JsonFormatter as ComponentType<{ labels: AnyToolLabels }>,
  },
  {
    slug: "base64",
    category: "developer",
    dictKey: "base64",
    icon: "64",
    Component: Base64Tool as ComponentType<{ labels: AnyToolLabels }>,
  },
  {
    slug: "password-generator",
    category: "security",
    dictKey: "passwordGenerator",
    icon: "✱",
    Component: PasswordGenerator as ComponentType<{ labels: AnyToolLabels }>,
  },
];

export const toolSlugs = toolRegistry.map((t) => t.slug);

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return toolRegistry.find((t) => t.slug === slug);
}

export function isRegisteredSlug(slug: string): boolean {
  return toolSlugs.includes(slug);
}

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
import OcrTool from "@/components/tools/OcrTool";
import QrGenerator from "@/components/tools/QrGenerator";
import ColorConverter from "@/components/tools/ColorConverter";
import HtmlEditor from "@/components/tools/HtmlEditor";
import MarkdownPreview from "@/components/tools/MarkdownPreview";
import UrlEncoder from "@/components/tools/UrlEncoder";
import UuidGenerator from "@/components/tools/UuidGenerator";
import UnitConverter from "@/components/tools/UnitConverter";
import DateDifference from "@/components/tools/DateDifference";

export type ToolDictKey = keyof Dictionary["tools"];

type AnyToolLabels = Dictionary["tools"][ToolDictKey];

export type ToolDefinition = {
  slug: string;
  category: ToolCategory;
  dictKey: ToolDictKey;
  icon: string;
  Component: ComponentType<{ labels: AnyToolLabels }>;
};

function asTool(
  Component: ComponentType<{ labels: never }>,
): ComponentType<{ labels: AnyToolLabels }> {
  return Component as ComponentType<{ labels: AnyToolLabels }>;
}

export const toolRegistry: ToolDefinition[] = [
  { slug: "word-counter", category: "text", dictKey: "wordCounter", icon: "Aa", Component: asTool(WordCounter) },
  { slug: "case-converter", category: "text", dictKey: "caseConverter", icon: "Aa⇄", Component: asTool(CaseConverter) },
  { slug: "lorem-ipsum", category: "text", dictKey: "loremIpsum", icon: "¶", Component: asTool(LoremIpsum) },
  { slug: "text-diff", category: "text", dictKey: "textDiff", icon: "≠", Component: asTool(TextDiff) },
  { slug: "json-formatter", category: "developer", dictKey: "jsonFormatter", icon: "{}", Component: asTool(JsonFormatter) },
  { slug: "base64", category: "developer", dictKey: "base64", icon: "64", Component: asTool(Base64Tool) },
  { slug: "html-editor", category: "developer", dictKey: "htmlEditor", icon: "</>", Component: asTool(HtmlEditor) },
  { slug: "markdown-preview", category: "developer", dictKey: "markdownPreview", icon: "MD", Component: asTool(MarkdownPreview) },
  { slug: "url-encoder", category: "developer", dictKey: "urlEncoder", icon: "%", Component: asTool(UrlEncoder) },
  { slug: "uuid-generator", category: "developer", dictKey: "uuidGenerator", icon: "ID", Component: asTool(UuidGenerator) },
  { slug: "password-generator", category: "security", dictKey: "passwordGenerator", icon: "✱", Component: asTool(PasswordGenerator) },
  { slug: "ocr", category: "image", dictKey: "ocr", icon: "OCR", Component: asTool(OcrTool) },
  { slug: "qr-generator", category: "image", dictKey: "qrGenerator", icon: "QR", Component: asTool(QrGenerator) },
  { slug: "color-converter", category: "image", dictKey: "colorConverter", icon: "◈", Component: asTool(ColorConverter) },
  { slug: "unit-converter", category: "calculator", dictKey: "unitConverter", icon: "⇄", Component: asTool(UnitConverter) },
  { slug: "date-difference", category: "calculator", dictKey: "dateDifference", icon: "📅", Component: asTool(DateDifference) },
];

export const toolSlugs = toolRegistry.map((t) => t.slug);

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return toolRegistry.find((t) => t.slug === slug);
}

export function isRegisteredSlug(slug: string): boolean {
  return toolSlugs.includes(slug);
}

export function toolsByCategory(category: ToolCategory): ToolDefinition[] {
  return toolRegistry.filter((t) => t.category === category);
}

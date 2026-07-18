import type { ToolCategory } from "@/lib/tools/categories";
import type { ToolDictKey } from "@/lib/tools/types";

export type ToolBadge = "new" | "popular" | "beta" | null;

export type ToolMeta = {
  slug: string;
  category: ToolCategory;
  dictKey: ToolDictKey;
  icon: string;
  keywords: string[];
  badge: ToolBadge;
  featured: boolean;
  accepts?: string[];
  outputs?: string[];
};

/** Lightweight catalog — safe to import from Header / cards (no tool components). */
export const toolMetaList: ToolMeta[] = [
  // Text
  { slug: "word-counter", category: "text", dictKey: "wordCounter", icon: "Aa", keywords: ["word", "count", "character"], badge: "popular", featured: true },
  { slug: "case-converter", category: "text", dictKey: "caseConverter", icon: "Aa⇄", keywords: ["case", "upper", "lower"], badge: null, featured: false },
  { slug: "lorem-ipsum", category: "text", dictKey: "loremIpsum", icon: "¶", keywords: ["lorem", "placeholder"], badge: null, featured: false },
  { slug: "text-diff", category: "text", dictKey: "textDiff", icon: "≠", keywords: ["diff", "compare"], badge: null, featured: false },
  { slug: "find-replace", category: "text", dictKey: "findReplace", icon: "⌕", keywords: ["find", "replace", "whitespace"], badge: "new", featured: false },

  // Documents / Word
  { slug: "pdf-to-text", category: "documents", dictKey: "pdfToText", icon: "TXT", keywords: ["pdf", "extract", "text"], badge: "new", featured: true, accepts: ["pdf"], outputs: ["txt"] },
  { slug: "docx-viewer", category: "documents", dictKey: "docxViewer", icon: "W", keywords: ["word", "docx", "view"], badge: "new", featured: true, accepts: ["docx"], outputs: ["html", "txt"] },
  { slug: "docx-to-html", category: "documents", dictKey: "docxToHtml", icon: "W→", keywords: ["docx", "html", "convert"], badge: "new", featured: false, accepts: ["docx"], outputs: ["html"] },
  { slug: "html-to-docx", category: "documents", dictKey: "htmlToDocx", icon: "→W", keywords: ["html", "docx", "word"], badge: "new", featured: false, accepts: ["html", "txt"], outputs: ["docx"] },
  { slug: "docx-diff", category: "documents", dictKey: "docxDiff", icon: "W≠", keywords: ["docx", "compare", "diff"], badge: "new", featured: false, accepts: ["docx"] },
  { slug: "text-to-pdf", category: "documents", dictKey: "textToPdf", icon: "T→P", keywords: ["text", "pdf"], badge: "new", featured: false, outputs: ["pdf"] },

  // Spreadsheets / Excel
  { slug: "xlsx-viewer", category: "spreadsheets", dictKey: "xlsxViewer", icon: "X", keywords: ["excel", "xlsx", "sheet"], badge: "new", featured: true, accepts: ["xlsx", "xls"] },
  { slug: "xlsx-to-csv", category: "spreadsheets", dictKey: "xlsxToCsv", icon: "X→C", keywords: ["xlsx", "csv", "excel"], badge: "new", featured: false, accepts: ["xlsx"], outputs: ["csv"] },
  { slug: "csv-to-xlsx", category: "spreadsheets", dictKey: "csvToXlsx", icon: "C→X", keywords: ["csv", "xlsx", "excel"], badge: "new", featured: false, accepts: ["csv"], outputs: ["xlsx"] },
  { slug: "csv-editor", category: "spreadsheets", dictKey: "csvEditor", icon: "⊞", keywords: ["csv", "table", "edit"], badge: "new", featured: false, accepts: ["csv"], outputs: ["csv"] },

  // Presentations
  { slug: "images-to-pptx", category: "presentations", dictKey: "imagesToPptx", icon: "▣→P", keywords: ["pptx", "powerpoint", "images"], badge: "new", featured: false, accepts: ["png", "jpg", "webp"], outputs: ["pptx"] },
  { slug: "text-to-pptx", category: "presentations", dictKey: "textToPptx", icon: "T→P", keywords: ["pptx", "powerpoint", "outline"], badge: "new", featured: false, outputs: ["pptx"] },
  { slug: "pptx-extract", category: "presentations", dictKey: "pptxExtract", icon: "P→T", keywords: ["pptx", "extract", "text"], badge: "new", featured: false, accepts: ["pptx"], outputs: ["txt"] },

  // PDF
  { slug: "pdf-merge", category: "pdf", dictKey: "pdfMerge", icon: "⧉", keywords: ["pdf", "merge", "combine"], badge: "popular", featured: true, accepts: ["pdf"], outputs: ["pdf"] },
  { slug: "pdf-split", category: "pdf", dictKey: "pdfSplit", icon: "✂", keywords: ["pdf", "split"], badge: null, featured: false, accepts: ["pdf"], outputs: ["pdf"] },
  { slug: "pdf-rotate", category: "pdf", dictKey: "pdfRotate", icon: "↻", keywords: ["pdf", "rotate"], badge: null, featured: false, accepts: ["pdf"], outputs: ["pdf"] },
  { slug: "pdf-compress", category: "pdf", dictKey: "pdfCompress", icon: "↓", keywords: ["pdf", "compress"], badge: null, featured: false, accepts: ["pdf"], outputs: ["pdf"] },
  { slug: "images-to-pdf", category: "pdf", dictKey: "imagesToPdf", icon: "▣", keywords: ["images", "pdf"], badge: null, featured: false, accepts: ["png", "jpg", "webp"], outputs: ["pdf"] },
  { slug: "pdf-to-images", category: "pdf", dictKey: "pdfToImages", icon: "P→▣", keywords: ["pdf", "images", "png"], badge: "new", featured: false, accepts: ["pdf"], outputs: ["png"] },

  // Image
  { slug: "image-resize", category: "image", dictKey: "imageResize", icon: "↔", keywords: ["resize", "scale", "dimensions"], badge: "new", featured: true, accepts: ["png", "jpg", "webp"] },
  { slug: "image-compress", category: "image", dictKey: "imageCompress", icon: "↓▣", keywords: ["compress", "optimize"], badge: "new", featured: true, accepts: ["png", "jpg", "webp"] },
  { slug: "image-crop", category: "image", dictKey: "imageCrop", icon: "✂▣", keywords: ["crop", "rotate", "flip"], badge: "new", featured: false, accepts: ["png", "jpg", "webp"] },
  { slug: "image-convert", category: "image", dictKey: "imageConvert", icon: "⇄▣", keywords: ["convert", "jpg", "png", "webp"], badge: "new", featured: false, accepts: ["png", "jpg", "webp", "gif"] },
  { slug: "image-metadata", category: "image", dictKey: "imageMetadata", icon: "i", keywords: ["exif", "metadata", "strip"], badge: "new", featured: false, accepts: ["png", "jpg", "webp"] },
  { slug: "image-enhance", category: "image", dictKey: "imageEnhance", icon: "✦", keywords: ["enhance", "sharpen", "hd"], badge: "new", featured: true, accepts: ["png", "jpg", "webp"] },
  { slug: "image-ai-upscale", category: "image", dictKey: "imageAiUpscale", icon: "AI", keywords: ["ai", "upscale", "esrgan"], badge: "beta", featured: false, accepts: ["png", "jpg", "webp"] },
  { slug: "ocr", category: "image", dictKey: "ocr", icon: "OCR", keywords: ["ocr", "text", "image"], badge: null, featured: false },
  { slug: "qr-generator", category: "image", dictKey: "qrGenerator", icon: "QR", keywords: ["qr", "code"], badge: null, featured: false },
  { slug: "color-converter", category: "image", dictKey: "colorConverter", icon: "◈", keywords: ["color", "hex", "rgb"], badge: null, featured: false },

  // Developer
  { slug: "json-formatter", category: "developer", dictKey: "jsonFormatter", icon: "{}", keywords: ["json", "format"], badge: "popular", featured: true },
  { slug: "base64", category: "developer", dictKey: "base64", icon: "64", keywords: ["base64"], badge: null, featured: false },
  { slug: "html-editor", category: "developer", dictKey: "htmlEditor", icon: "</>", keywords: ["html", "editor", "wysiwyg"], badge: "popular", featured: true },
  { slug: "markdown-preview", category: "developer", dictKey: "markdownPreview", icon: "MD", keywords: ["markdown"], badge: null, featured: false },
  { slug: "url-encoder", category: "developer", dictKey: "urlEncoder", icon: "%", keywords: ["url", "encode"], badge: null, featured: false },
  { slug: "uuid-generator", category: "developer", dictKey: "uuidGenerator", icon: "ID", keywords: ["uuid"], badge: null, featured: false },

  // Security
  { slug: "password-generator", category: "security", dictKey: "passwordGenerator", icon: "✱", keywords: ["password", "secure"], badge: "popular", featured: true },

  // Calculator
  { slug: "unit-converter", category: "calculator", dictKey: "unitConverter", icon: "⇄", keywords: ["unit", "convert"], badge: null, featured: false },
  { slug: "date-difference", category: "calculator", dictKey: "dateDifference", icon: "📅", keywords: ["date", "difference"], badge: null, featured: false },
];

export const toolSlugs = toolMetaList.map((t) => t.slug);

export function getToolMeta(slug: string): ToolMeta | undefined {
  return toolMetaList.find((t) => t.slug === slug);
}

export function isRegisteredSlug(slug: string): boolean {
  return toolSlugs.includes(slug);
}

export function toolsByCategory(category: ToolCategory): ToolMeta[] {
  return toolMetaList.filter((t) => t.category === category);
}

export function featuredTools(): ToolMeta[] {
  return toolMetaList.filter((t) => t.featured);
}

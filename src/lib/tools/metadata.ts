import type { ToolCategory } from "@/lib/tools/categories";
import type { ToolDictKey } from "@/lib/tools/types";
import type { Locale } from "@/lib/i18n";

export type ToolBadge = "new" | "popular" | "beta" | null;

export type ToolMeta = {
  slug: string;
  category: ToolCategory;
  dictKey: ToolDictKey;
  icon: string;
  emoji: string;
  keywords: string[];
  badge: ToolBadge;
  featured: boolean;
  accepts?: string[];
  outputs?: string[];
  /** Logical next tools for internal linking. */
  nextSteps?: string[];
  /**
   * When set, the tool is only available for these locales (hard gate).
   * Omit to allow every locale.
   */
  locales?: Locale[];
};

/** Lightweight catalog — safe to import from Header / cards (no tool components). */
export const toolMetaList: ToolMeta[] = [
  // Text
  { slug: "word-counter", category: "text", dictKey: "wordCounter", icon: "Aa", emoji: "🔢", keywords: ["word", "count", "character"], badge: "popular", featured: true, nextSteps: ["case-converter", "find-replace"] },
  { slug: "case-converter", category: "text", dictKey: "caseConverter", icon: "Aa⇄", emoji: "🔠", keywords: ["case", "upper", "lower"], badge: null, featured: false, nextSteps: ["word-counter", "find-replace"] },
  { slug: "lorem-ipsum", category: "text", dictKey: "loremIpsum", icon: "¶", emoji: "📜", keywords: ["lorem", "placeholder"], badge: null, featured: false, nextSteps: ["word-counter", "text-to-pdf"] },
  { slug: "text-diff", category: "text", dictKey: "textDiff", icon: "≠", emoji: "📝", keywords: ["diff", "compare"], badge: null, featured: false, nextSteps: ["find-replace", "docx-diff"] },
  { slug: "find-replace", category: "text", dictKey: "findReplace", icon: "⌕", emoji: "🔍", keywords: ["find", "replace", "whitespace"], badge: "new", featured: false, nextSteps: ["word-counter", "text-diff"] },

  // Documents / Word
  { slug: "pdf-to-text", category: "documents", dictKey: "pdfToText", icon: "TXT", emoji: "📃", keywords: ["pdf", "extract", "text"], badge: "new", featured: true, accepts: ["pdf"], outputs: ["txt"], nextSteps: ["word-counter", "text-to-pdf"] },
  { slug: "docx-viewer", category: "documents", dictKey: "docxViewer", icon: "W", emoji: "📄", keywords: ["word", "docx", "view"], badge: "new", featured: true, accepts: ["docx"], outputs: ["html", "txt"], nextSteps: ["docx-to-html", "docx-diff"] },
  { slug: "docx-to-html", category: "documents", dictKey: "docxToHtml", icon: "W→", emoji: "🔄", keywords: ["docx", "html", "convert"], badge: "new", featured: false, accepts: ["docx"], outputs: ["html"], nextSteps: ["html-editor", "html-to-docx"] },
  { slug: "html-to-docx", category: "documents", dictKey: "htmlToDocx", icon: "→W", emoji: "📝", keywords: ["html", "docx", "word"], badge: "new", featured: false, accepts: ["html", "txt"], outputs: ["docx"], nextSteps: ["docx-viewer", "html-editor"] },
  { slug: "docx-diff", category: "documents", dictKey: "docxDiff", icon: "W≠", emoji: "⚖️", keywords: ["docx", "compare", "diff"], badge: "new", featured: false, accepts: ["docx"], nextSteps: ["docx-viewer", "text-diff"] },
  { slug: "text-to-pdf", category: "documents", dictKey: "textToPdf", icon: "T→P", emoji: "📑", keywords: ["text", "pdf"], badge: "new", featured: false, outputs: ["pdf"], nextSteps: ["pdf-merge", "pdf-compress"] },

  // Spreadsheets / Excel
  { slug: "xlsx-viewer", category: "spreadsheets", dictKey: "xlsxViewer", icon: "X", emoji: "📊", keywords: ["excel", "xlsx", "sheet"], badge: "new", featured: true, accepts: ["xlsx", "xls"], nextSteps: ["xlsx-to-csv", "csv-editor"] },
  { slug: "xlsx-to-csv", category: "spreadsheets", dictKey: "xlsxToCsv", icon: "X→C", emoji: "📤", keywords: ["xlsx", "csv", "excel"], badge: "new", featured: false, accepts: ["xlsx"], outputs: ["csv"], nextSteps: ["csv-editor", "csv-to-xlsx"] },
  { slug: "csv-to-xlsx", category: "spreadsheets", dictKey: "csvToXlsx", icon: "C→X", emoji: "📥", keywords: ["csv", "xlsx", "excel"], badge: "new", featured: false, accepts: ["csv"], outputs: ["xlsx"], nextSteps: ["xlsx-viewer", "csv-editor"] },
  { slug: "csv-editor", category: "spreadsheets", dictKey: "csvEditor", icon: "⊞", emoji: "🧮", keywords: ["csv", "table", "edit"], badge: "new", featured: false, accepts: ["csv"], outputs: ["csv"], nextSteps: ["csv-to-xlsx", "xlsx-to-csv"] },

  // Presentations
  { slug: "images-to-pptx", category: "presentations", dictKey: "imagesToPptx", icon: "▣→P", emoji: "📽️", keywords: ["pptx", "powerpoint", "images"], badge: "new", featured: false, accepts: ["png", "jpg", "webp"], outputs: ["pptx"], nextSteps: ["image-resize", "text-to-pptx"] },
  { slug: "text-to-pptx", category: "presentations", dictKey: "textToPptx", icon: "T→P", emoji: "🗣️", keywords: ["pptx", "powerpoint", "outline"], badge: "new", featured: false, outputs: ["pptx"], nextSteps: ["images-to-pptx", "pptx-extract"] },
  { slug: "pptx-extract", category: "presentations", dictKey: "pptxExtract", icon: "P→T", emoji: "📋", keywords: ["pptx", "extract", "text"], badge: "new", featured: false, accepts: ["pptx"], outputs: ["txt"], nextSteps: ["word-counter", "text-to-pptx"] },

  // PDF
  { slug: "pdf-merge", category: "pdf", dictKey: "pdfMerge", icon: "⧉", emoji: "📎", keywords: ["pdf", "merge", "combine"], badge: "popular", featured: true, accepts: ["pdf"], outputs: ["pdf"], nextSteps: ["pdf-compress", "pdf-split"] },
  { slug: "pdf-split", category: "pdf", dictKey: "pdfSplit", icon: "✂", emoji: "✂️", keywords: ["pdf", "split"], badge: null, featured: false, accepts: ["pdf"], outputs: ["pdf"], nextSteps: ["pdf-merge", "pdf-to-images"] },
  { slug: "pdf-rotate", category: "pdf", dictKey: "pdfRotate", icon: "↻", emoji: "🔄", keywords: ["pdf", "rotate"], badge: null, featured: false, accepts: ["pdf"], outputs: ["pdf"], nextSteps: ["pdf-compress", "pdf-merge"] },
  { slug: "pdf-compress", category: "pdf", dictKey: "pdfCompress", icon: "↓", emoji: "🗜️", keywords: ["pdf", "compress"], badge: null, featured: false, accepts: ["pdf"], outputs: ["pdf"], nextSteps: ["pdf-merge", "pdf-to-images"] },
  { slug: "images-to-pdf", category: "pdf", dictKey: "imagesToPdf", icon: "▣", emoji: "🖼️", keywords: ["images", "pdf"], badge: null, featured: false, accepts: ["png", "jpg", "webp"], outputs: ["pdf"], nextSteps: ["pdf-compress", "image-resize"] },
  { slug: "pdf-to-images", category: "pdf", dictKey: "pdfToImages", icon: "P→▣", emoji: "🖼️", keywords: ["pdf", "images", "png"], badge: "new", featured: false, accepts: ["pdf"], outputs: ["png"], nextSteps: ["image-compress", "images-to-pdf"] },

  // Image
  { slug: "image-resize", category: "image", dictKey: "imageResize", icon: "↔", emoji: "📐", keywords: ["resize", "scale", "dimensions"], badge: "new", featured: true, accepts: ["png", "jpg", "webp"], nextSteps: ["image-compress", "image-crop"] },
  { slug: "image-compress", category: "image", dictKey: "imageCompress", icon: "↓▣", emoji: "🗜️", keywords: ["compress", "optimize"], badge: "new", featured: true, accepts: ["png", "jpg", "webp"], nextSteps: ["image-resize", "image-convert"] },
  { slug: "image-crop", category: "image", dictKey: "imageCrop", icon: "✂▣", emoji: "✂️", keywords: ["crop", "rotate", "flip"], badge: "new", featured: false, accepts: ["png", "jpg", "webp"], nextSteps: ["image-resize", "image-enhance"] },
  { slug: "image-convert", category: "image", dictKey: "imageConvert", icon: "⇄▣", emoji: "🔃", keywords: ["convert", "jpg", "png", "webp"], badge: "new", featured: false, accepts: ["png", "jpg", "webp", "gif"], nextSteps: ["image-compress", "image-resize"] },
  { slug: "image-metadata", category: "image", dictKey: "imageMetadata", icon: "i", emoji: "ℹ️", keywords: ["exif", "metadata", "strip"], badge: "new", featured: false, accepts: ["png", "jpg", "webp"], nextSteps: ["image-compress", "image-convert"] },
  { slug: "image-enhance", category: "image", dictKey: "imageEnhance", icon: "✦", emoji: "✨", keywords: ["enhance", "sharpen", "hd"], badge: "new", featured: true, accepts: ["png", "jpg", "webp"], nextSteps: ["image-ai-upscale", "image-resize"] },
  { slug: "image-ai-upscale", category: "image", dictKey: "imageAiUpscale", icon: "AI", emoji: "🤖", keywords: ["ai", "upscale", "esrgan"], badge: "beta", featured: false, accepts: ["png", "jpg", "webp"], nextSteps: ["image-enhance", "image-compress"] },
  { slug: "ocr", category: "image", dictKey: "ocr", icon: "OCR", emoji: "👁️", keywords: ["ocr", "text", "image"], badge: null, featured: false, nextSteps: ["word-counter", "pdf-to-text"] },
  { slug: "qr-generator", category: "image", dictKey: "qrGenerator", icon: "QR", emoji: "🔳", keywords: ["qr", "code"], badge: null, featured: false, nextSteps: ["url-encoder", "color-converter"] },
  { slug: "color-converter", category: "image", dictKey: "colorConverter", icon: "◈", emoji: "🎨", keywords: ["color", "hex", "rgb"], badge: null, featured: false, nextSteps: ["qr-generator", "html-editor"] },

  // Archive / ZIP
  { slug: "zip-create", category: "archive", dictKey: "zipCreate", icon: "ZIP", emoji: "📦", keywords: ["zip", "archive", "compress", "pack"], badge: "new", featured: true, outputs: ["zip"], nextSteps: ["zip-extract", "zip-viewer"] },
  { slug: "zip-extract", category: "archive", dictKey: "zipExtract", icon: "⇄Z", emoji: "📂", keywords: ["zip", "extract", "unzip", "unpack"], badge: "new", featured: true, accepts: ["zip"], nextSteps: ["zip-viewer", "zip-create"] },
  { slug: "zip-viewer", category: "archive", dictKey: "zipViewer", icon: "Z", emoji: "🗂️", keywords: ["zip", "view", "inspect", "list"], badge: "new", featured: false, accepts: ["zip"], nextSteps: ["zip-extract", "zip-create"] },

  // Video
  { slug: "video-frame-extractor", category: "video", dictKey: "videoFrames", icon: "▣", emoji: "🎞️", keywords: ["video", "frame", "screenshot", "png"], badge: "new", featured: true, accepts: ["mp4", "webm", "mov"], outputs: ["png", "zip"], nextSteps: ["video-to-gif", "image-compress"] },
  { slug: "video-to-gif", category: "video", dictKey: "videoToGif", icon: "GIF", emoji: "🎬", keywords: ["video", "gif", "convert", "animate"], badge: "new", featured: true, accepts: ["mp4", "webm", "mov"], outputs: ["gif"], nextSteps: ["video-frame-extractor", "video-trim"] },
  { slug: "video-trim", category: "video", dictKey: "videoTrim", icon: "✂V", emoji: "✂️", keywords: ["video", "trim", "cut", "mute", "webm"], badge: "new", featured: false, accepts: ["mp4", "webm", "mov"], outputs: ["webm"], nextSteps: ["video-to-gif", "video-metadata"] },
  { slug: "video-metadata", category: "video", dictKey: "videoInfo", icon: "ℹV", emoji: "ℹ️", keywords: ["video", "metadata", "info", "duration"], badge: "new", featured: false, accepts: ["mp4", "webm", "mov"], nextSteps: ["video-trim", "video-frame-extractor"] },

  // EBYS / Belgenet (Turkish only)
  { slug: "belgenet-hazirlik", category: "ebys", dictKey: "belgenetPrep", icon: "BN", emoji: "📋", keywords: ["belgenet", "ebys", "sdp", "ssdp", "arz", "rica", "detsis", "resmi", "yazışma", "html"], badge: "new", featured: true, locales: ["tr"], nextSteps: ["html-editor"] },

  // Developer
  { slug: "json-formatter", category: "developer", dictKey: "jsonFormatter", icon: "{}", emoji: "🧩", keywords: ["json", "format"], badge: "popular", featured: true, nextSteps: ["base64", "uuid-generator"] },
  { slug: "base64", category: "developer", dictKey: "base64", icon: "64", emoji: "🔐", keywords: ["base64"], badge: null, featured: false, nextSteps: ["url-encoder", "json-formatter"] },
  { slug: "html-editor", category: "developer", dictKey: "htmlEditor", icon: "</>", emoji: "💻", keywords: ["html", "editor", "wysiwyg"], badge: "popular", featured: true, nextSteps: ["markdown-preview", "html-to-docx"] },
  { slug: "markdown-preview", category: "developer", dictKey: "markdownPreview", icon: "MD", emoji: "📘", keywords: ["markdown"], badge: null, featured: false, nextSteps: ["html-editor", "text-to-pdf"] },
  { slug: "url-encoder", category: "developer", dictKey: "urlEncoder", icon: "%", emoji: "🔗", keywords: ["url", "encode"], badge: null, featured: false, nextSteps: ["base64", "qr-generator"] },
  { slug: "uuid-generator", category: "developer", dictKey: "uuidGenerator", icon: "ID", emoji: "🆔", keywords: ["uuid"], badge: null, featured: false, nextSteps: ["password-generator", "json-formatter"] },

  // Security
  { slug: "password-generator", category: "security", dictKey: "passwordGenerator", icon: "✱", emoji: "🔑", keywords: ["password", "secure"], badge: "popular", featured: true, nextSteps: ["uuid-generator", "base64"] },

  // Calculator
  { slug: "unit-converter", category: "calculator", dictKey: "unitConverter", icon: "⇄", emoji: "⚖️", keywords: ["unit", "convert"], badge: null, featured: false, nextSteps: ["date-difference", "word-counter"] },
  { slug: "date-difference", category: "calculator", dictKey: "dateDifference", icon: "📅", emoji: "📅", keywords: ["date", "difference"], badge: null, featured: false, nextSteps: ["unit-converter"] },
];

export const toolSlugs = toolMetaList.map((t) => t.slug);

export function getToolMeta(slug: string): ToolMeta | undefined {
  return toolMetaList.find((t) => t.slug === slug);
}

export function isRegisteredSlug(slug: string): boolean {
  return toolSlugs.includes(slug);
}

/** True when the tool may be listed / opened for this locale. */
export function isToolAvailableInLocale(slug: string, locale: Locale): boolean {
  const meta = getToolMeta(slug);
  if (!meta) return false;
  if (!meta.locales || meta.locales.length === 0) return true;
  return meta.locales.includes(locale);
}

export function toolsByCategory(category: ToolCategory): ToolMeta[] {
  return toolMetaList.filter((t) => t.category === category);
}

export function featuredTools(): ToolMeta[] {
  return toolMetaList.filter((t) => t.featured);
}

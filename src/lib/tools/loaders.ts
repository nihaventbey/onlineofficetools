import type { ComponentType } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { ToolDictKey } from "@/lib/tools/types";

type AnyToolLabels = Dictionary["tools"][ToolDictKey];
export type ToolComponent = ComponentType<{ labels: AnyToolLabels }>;

const loaders: Record<string, () => Promise<{ default: ToolComponent }>> = {
  "word-counter": () => import("@/components/tools/WordCounter").then((m) => ({ default: m.default as ToolComponent })),
  "case-converter": () => import("@/components/tools/CaseConverter").then((m) => ({ default: m.default as ToolComponent })),
  "lorem-ipsum": () => import("@/components/tools/LoremIpsum").then((m) => ({ default: m.default as ToolComponent })),
  "text-diff": () => import("@/components/tools/TextDiff").then((m) => ({ default: m.default as ToolComponent })),
  "find-replace": () => import("@/components/tools/FindReplace").then((m) => ({ default: m.default as ToolComponent })),
  "pdf-to-text": () => import("@/components/tools/PdfToText").then((m) => ({ default: m.default as ToolComponent })),
  "docx-viewer": () => import("@/components/tools/DocxViewer").then((m) => ({ default: m.default as ToolComponent })),
  "docx-to-html": () => import("@/components/tools/DocxToHtml").then((m) => ({ default: m.default as ToolComponent })),
  "html-to-docx": () => import("@/components/tools/HtmlToDocx").then((m) => ({ default: m.default as ToolComponent })),
  "docx-diff": () => import("@/components/tools/DocxDiff").then((m) => ({ default: m.default as ToolComponent })),
  "text-to-pdf": () => import("@/components/tools/TextToPdf").then((m) => ({ default: m.default as ToolComponent })),
  "xlsx-viewer": () => import("@/components/tools/XlsxViewer").then((m) => ({ default: m.default as ToolComponent })),
  "xlsx-to-csv": () => import("@/components/tools/XlsxToCsv").then((m) => ({ default: m.default as ToolComponent })),
  "csv-to-xlsx": () => import("@/components/tools/CsvToXlsx").then((m) => ({ default: m.default as ToolComponent })),
  "csv-editor": () => import("@/components/tools/CsvEditor").then((m) => ({ default: m.default as ToolComponent })),
  "images-to-pptx": () => import("@/components/tools/ImagesToPptx").then((m) => ({ default: m.default as ToolComponent })),
  "text-to-pptx": () => import("@/components/tools/TextToPptx").then((m) => ({ default: m.default as ToolComponent })),
  "pptx-extract": () => import("@/components/tools/PptxExtract").then((m) => ({ default: m.default as ToolComponent })),
  "pdf-merge": () => import("@/components/tools/PdfMerge").then((m) => ({ default: m.default as ToolComponent })),
  "pdf-split": () => import("@/components/tools/PdfSplit").then((m) => ({ default: m.default as ToolComponent })),
  "pdf-rotate": () => import("@/components/tools/PdfRotate").then((m) => ({ default: m.default as ToolComponent })),
  "pdf-compress": () => import("@/components/tools/PdfCompress").then((m) => ({ default: m.default as ToolComponent })),
  "images-to-pdf": () => import("@/components/tools/ImagesToPdf").then((m) => ({ default: m.default as ToolComponent })),
  "pdf-to-images": () => import("@/components/tools/PdfToImages").then((m) => ({ default: m.default as ToolComponent })),
  "image-resize": () => import("@/components/tools/ImageResize").then((m) => ({ default: m.default as ToolComponent })),
  "image-compress": () => import("@/components/tools/ImageCompress").then((m) => ({ default: m.default as ToolComponent })),
  "image-crop": () => import("@/components/tools/ImageCrop").then((m) => ({ default: m.default as ToolComponent })),
  "image-convert": () => import("@/components/tools/ImageConvert").then((m) => ({ default: m.default as ToolComponent })),
  "image-metadata": () => import("@/components/tools/ImageMetadata").then((m) => ({ default: m.default as ToolComponent })),
  "image-enhance": () => import("@/components/tools/ImageEnhance").then((m) => ({ default: m.default as ToolComponent })),
  "image-ai-upscale": () => import("@/components/tools/ImageAiUpscale").then((m) => ({ default: m.default as ToolComponent })),
  "watermark": () => import("@/components/tools/Watermark").then((m) => ({ default: m.default as ToolComponent })),
  "zip-create": () => import("@/components/tools/ZipCreate").then((m) => ({ default: m.default as ToolComponent })),
  "zip-extract": () => import("@/components/tools/ZipExtract").then((m) => ({ default: m.default as ToolComponent })),
  "zip-viewer": () => import("@/components/tools/ZipViewer").then((m) => ({ default: m.default as ToolComponent })),
  "video-frame-extractor": () => import("@/components/tools/VideoFrames").then((m) => ({ default: m.default as ToolComponent })),
  "video-to-gif": () => import("@/components/tools/VideoToGif").then((m) => ({ default: m.default as ToolComponent })),
  "video-trim": () => import("@/components/tools/VideoTrim").then((m) => ({ default: m.default as ToolComponent })),
  "video-metadata": () => import("@/components/tools/VideoInfo").then((m) => ({ default: m.default as ToolComponent })),
  ocr: () => import("@/components/tools/OcrTool").then((m) => ({ default: m.default as ToolComponent })),
  "qr-generator": () => import("@/components/tools/QrGenerator").then((m) => ({ default: m.default as ToolComponent })),
  "color-converter": () => import("@/components/tools/ColorConverter").then((m) => ({ default: m.default as ToolComponent })),
  "json-formatter": () => import("@/components/tools/JsonFormatter").then((m) => ({ default: m.default as ToolComponent })),
  base64: () => import("@/components/tools/Base64Tool").then((m) => ({ default: m.default as ToolComponent })),
  "html-editor": () => import("@/components/tools/HtmlEditor").then((m) => ({ default: m.default as ToolComponent })),
  "markdown-preview": () => import("@/components/tools/MarkdownPreview").then((m) => ({ default: m.default as ToolComponent })),
  "url-encoder": () => import("@/components/tools/UrlEncoder").then((m) => ({ default: m.default as ToolComponent })),
  "uuid-generator": () => import("@/components/tools/UuidGenerator").then((m) => ({ default: m.default as ToolComponent })),
  "password-generator": () => import("@/components/tools/PasswordGenerator").then((m) => ({ default: m.default as ToolComponent })),
  "unit-converter": () => import("@/components/tools/UnitConverter").then((m) => ({ default: m.default as ToolComponent })),
  "date-difference": () => import("@/components/tools/DateDifference").then((m) => ({ default: m.default as ToolComponent })),
  "belgenet-hazirlik": () =>
    import("@/components/tools/BelgenetHazirlik").then((m) => ({
      default: m.default as ToolComponent,
    })),
};

export async function loadToolComponent(
  slug: string,
): Promise<ToolComponent | null> {
  const loader = loaders[slug];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

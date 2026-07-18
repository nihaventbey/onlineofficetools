export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_DOC_BYTES = 25 * 1024 * 1024;
export const MAX_PIXELS = 40_000_000;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string, mime = "text/plain") {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export async function readFileBytes(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function revokeUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)
  );
}

export async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

/** Convert any browser-decodable image to PNG/JPEG bytes for pdf-lib. */
export async function imageFileToPngOrJpeg(
  file: File,
): Promise<{ bytes: Uint8Array; kind: "png" | "jpg" }> {
  const name = file.name.toLowerCase();
  const isPng = file.type === "image/png" || name.endsWith(".png");
  const isJpg =
    file.type === "image/jpeg" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg");

  if (isPng || isJpg) {
    const buf = await file.arrayBuffer();
    return { bytes: new Uint8Array(buf), kind: isPng ? "png" : "jpg" };
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvasToBlob(canvas, "image/png");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: "png" };
}

export function estimateImageMemoryMb(width: number, height: number): number {
  return (width * height * 4) / (1024 * 1024);
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_MERGE_TOTAL_BYTES = 50 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function downloadBlob(data: Uint8Array | Blob, filename: string) {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readFileBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

export function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp)$/i.test(file.name)
  );
}

/** Parse "1-3,5,8-10" into 1-based page numbers (sorted unique). */
export function parsePageRange(input: string, pageCount: number): number[] {
  const set = new Set<number>();
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (m) {
      let a = Number(m[1]);
      let b = Number(m[2]);
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) {
        if (i >= 1 && i <= pageCount) set.add(i);
      }
    } else {
      const n = Number(part);
      if (Number.isInteger(n) && n >= 1 && n <= pageCount) set.add(n);
    }
  }
  return [...set].sort((a, b) => a - b);
}

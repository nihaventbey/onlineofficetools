/**
 * Packs multiple PNG byte arrays (typically 16x16, 32x32, 48x48) into a standard .ico file.
 * Compatible with Windows Vista+ and all modern web browsers.
 */
export function createIcoFromPngs(pngBlobs: { width: number; height: number; bytes: Uint8Array }[]): Uint8Array {
  const count = pngBlobs.length;
  // 6 bytes header + 16 bytes per image directory entry
  const headerSize = 6 + count * 16;
  
  let totalDataSize = 0;
  for (const item of pngBlobs) {
    totalDataSize += item.bytes.length;
  }

  const out = new Uint8Array(headerSize + totalDataSize);
  const view = new DataView(out.buffer);

  // 1. ICONDIR Header
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Image type (1 = ICO)
  view.setUint16(4, count, true); // Number of images

  // 2. ICONDIRENTRY list
  let currentOffset = headerSize;
  for (let i = 0; i < count; i++) {
    const item = pngBlobs[i]!;
    const entryOffset = 6 + i * 16;

    view.setUint8(entryOffset + 0, item.width >= 256 ? 0 : item.width);
    view.setUint8(entryOffset + 1, item.height >= 256 ? 0 : item.height);
    view.setUint8(entryOffset + 2, 0); // Palette count
    view.setUint8(entryOffset + 3, 0); // Reserved
    view.setUint16(entryOffset + 4, 1, true); // Color planes
    view.setUint16(entryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(entryOffset + 8, item.bytes.length, true); // Data size
    view.setUint32(entryOffset + 12, currentOffset, true); // Data offset

    // Copy PNG bytes
    out.set(item.bytes, currentOffset);
    currentOffset += item.bytes.length;
  }

  return out;
}

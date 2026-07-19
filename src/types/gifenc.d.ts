declare module "gifenc" {
  export type RGBPalette = number[][];

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: "rgb565" | "rgb444" | "rgba4444";
      oneBitAlpha?: boolean | number;
      clearAlpha?: boolean;
      clearAlphaThreshold?: number;
      clearAlphaColor?: number;
    },
  ): RGBPalette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: RGBPalette,
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;

  export type GIFEncoderInstance = {
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: RGBPalette;
        delay?: number;
        repeat?: number;
        transparent?: boolean;
        transparentIndex?: number;
        first?: boolean;
      },
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
  };

  export function GIFEncoder(opts?: {
    auto?: boolean;
    initialCapacity?: number;
  }): GIFEncoderInstance;
}

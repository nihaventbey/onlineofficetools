export type WmPosition =
  | "tl"
  | "tc"
  | "tr"
  | "ml"
  | "mc"
  | "mr"
  | "bl"
  | "bc"
  | "br";

export type WmMode = "text" | "image";

/** Fonts available for text watermarks (canvas + PDF stamp). */
export type WmFontId =
  | "arial"
  | "helvetica"
  | "times"
  | "georgia"
  | "courier"
  | "verdana"
  | "impact"
  | "trebuchet";

export type WatermarkOptions = {
  mode: WmMode;
  text: string;
  fontId: WmFontId;
  color: string;
  position: WmPosition;
  /** 0–1 */
  opacity: number;
  /** Degrees, typically −45…45 */
  rotation: number;
  /** Relative size multiplier, typically 0.2–2 */
  scale: number;
  tile: boolean;
  /** Gap between tiled stamps as fraction of min(width,height), 0.05–0.5 */
  tileGap: number;
};

export const WM_FONT_CSS: Record<WmFontId, string> = {
  arial: "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  times: '"Times New Roman", Times, serif',
  georgia: "Georgia, serif",
  courier: '"Courier New", Courier, monospace',
  verdana: "Verdana, Geneva, sans-serif",
  impact: "Impact, Haettenschweiler, sans-serif",
  trebuchet: '"Trebuchet MS", sans-serif',
};

export const DEFAULT_WATERMARK: WatermarkOptions = {
  mode: "text",
  text: "CONFIDENTIAL",
  fontId: "arial",
  color: "#64748b",
  position: "mc",
  opacity: 0.35,
  rotation: -30,
  scale: 1,
  tile: false,
  tileGap: 0.18,
};

export const WM_POSITIONS: WmPosition[] = [
  "tl",
  "tc",
  "tr",
  "ml",
  "mc",
  "mr",
  "bl",
  "bc",
  "br",
];

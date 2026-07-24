/** Polygon geometry helpers for land/area calculator (planar metres). */

export type Point = { x: number; y: number };

export function dist(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

/** Shoelace formula; absolute area in square units of the coordinate system. */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonPerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < points.length; i++) {
    p += dist(points[i]!, points[(i + 1) % points.length]!);
  }
  return p;
}

export function sideLengths(points: Point[]): number[] {
  if (points.length < 2) return [];
  const lengths: number[] = [];
  for (let i = 0; i < points.length; i++) {
    lengths.push(dist(points[i]!, points[(i + 1) % points.length]!));
  }
  return lengths;
}

/** Move vertex i so edge i→i+1 has length `len`, keeping direction. */
export function setEdgeLength(points: Point[], edgeIndex: number, len: number): Point[] {
  if (points.length < 2 || len <= 0) return points.map((p) => ({ ...p }));
  const next = points.map((p) => ({ ...p }));
  const a = next[edgeIndex]!;
  const bIdx = (edgeIndex + 1) % next.length;
  const b = next[bIdx]!;
  const cur = dist(a, b) || 1;
  const scale = len / cur;
  next[bIdx] = {
    x: a.x + (b.x - a.x) * scale,
    y: a.y + (b.y - a.y) * scale,
  };
  return next;
}

export function rectPoints(w: number, h: number, ox = 40, oy = 40): Point[] {
  return [
    { x: ox, y: oy },
    { x: ox + w, y: oy },
    { x: ox + w, y: oy + h },
    { x: ox, y: oy + h },
  ];
}

export function trianglePoints(base: number, height: number, ox = 40, oy = 40): Point[] {
  return [
    { x: ox, y: oy + height },
    { x: ox + base, y: oy + height },
    { x: ox + base / 2, y: oy },
  ];
}

export function regularPolygon(n: number, radius: number, cx = 200, cy = 160): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

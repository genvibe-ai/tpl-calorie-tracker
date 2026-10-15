/** "#RRGGBB" plus an alpha of 0..1 as "#RRGGBBAA". */
export function withAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `${hex.slice(0, 7)}${a.toString(16).padStart(2, "0")}`;
}

/** Blend two "#RRGGBB" colours; t = 0 gives a, t = 1 gives b. */
export function mix(a: string, b: string, t: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

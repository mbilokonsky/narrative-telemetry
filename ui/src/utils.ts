/**
 * Map a significance value (0..1) to an HSL color string.
 * 0.0 = green (hsl 120), 0.5 = yellow (hsl 60), 1.0 = red (hsl 0)
 */
export function significanceColor(sig: number, alpha = 1): string {
  const hue = 120 - sig * 120; // 120 -> 0
  const sat = 70;
  const light = 40 + sig * 10; // 40 -> 50
  if (alpha < 1) {
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  }
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

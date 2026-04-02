/**
 * Map a significance value (0..1) to an accessible color string.
 * Uses a single-hue sequential ramp (blue) that works for colorblind users
 * and doesn't carry "safe/dangerous" connotations.
 *
 * 0.0 = very faint (low saturation, low opacity)
 * 0.5 = medium blue
 * 1.0 = vivid bright blue
 */
export function significanceColor(sig: number, alpha = 1): string {
  // Hue: steady blue (220-230)
  const hue = 225;
  // Saturation: ramps from 20% (faint) to 85% (vivid)
  const sat = 20 + sig * 65;
  // Lightness: ramps from 65% (light/faint) to 45% (dark/intense)
  const light = 65 - sig * 20;
  if (alpha < 1) {
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
  }
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

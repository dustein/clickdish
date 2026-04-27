/**
 * Extracts a diverse color palette from a data: URL image using the Canvas API.
 *
 * Strategy: divide the RGB cube into BINS³ buckets and count pixel frequency.
 * Then greedily select the most frequent colors ensuring minimum perceptual
 * distance between selections, so similar colors (e.g. two shades of beige)
 * don't both get picked and squeeze out distinct colors.
 *
 * This approach naturally captures food colors (beige, orange, brown, white-ish)
 * without penalizing low-saturation colors the way hue-sector methods do.
 */
export async function extractPaletteFromDataUrl(dataUrl: string, count = 6): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 150;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(defaultPalette()); return; }

      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

      // Divide RGB space into BINS³ buckets and count pixel frequency
      const BINS = 12;
      const step = 256 / BINS;
      const buckets = new Map<number, { rSum: number; gSum: number; bSum: number; count: number }>();

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skip near-pure-white (plate, background) and near-pure-black
        if (r > 245 && g > 245 && b > 245) continue;
        if (r < 12 && g < 12 && b < 12) continue;

        const bR = Math.floor(r / step);
        const bG = Math.floor(g / step);
        const bB = Math.floor(b / step);
        const key = bR * BINS * BINS + bG * BINS + bB;

        const existing = buckets.get(key);
        if (existing) {
          existing.count++;
          existing.rSum += r;
          existing.gSum += g;
          existing.bSum += b;
        } else {
          buckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
        }
      }

      // Convert accumulated sums to average representative color, sort by frequency
      const sorted = Array.from(buckets.values())
        .map(({ rSum, gSum, bSum, count }) => ({
          r: Math.round(rSum / count),
          g: Math.round(gSum / count),
          b: Math.round(bSum / count),
          count,
        }))
        .sort((a, b) => b.count - a.count);

      // Greedily pick colors ensuring minimum perceptual distance between selections
      const MIN_DISTANCE = 60;
      const palette: string[] = [];

      for (const candidate of sorted) {
        if (palette.length >= count) break;

        const tooClose = palette.some((hex) => {
          const er = parseInt(hex.slice(1, 3), 16) - candidate.r;
          const eg = parseInt(hex.slice(3, 5), 16) - candidate.g;
          const eb = parseInt(hex.slice(5, 7), 16) - candidate.b;
          return Math.sqrt(er * er + eg * eg + eb * eb) < MIN_DISTANCE;
        });

        if (!tooClose) {
          palette.push(rgbToHex(candidate.r, candidate.g, candidate.b));
        }
      }

      // Pad with defaults if not enough distinct colors were found
      const def = defaultPalette();
      while (palette.length < count) palette.push(def[palette.length % def.length]);

      resolve(palette);
    };
    img.onerror = () => resolve(defaultPalette());
    img.src = dataUrl;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('');
}

/** Darkens a hex color by mixing with black at given ratio (0–1). */
export function darken(hex: string, ratio = 0.3): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return rgbToHex(
    Math.round(r * (1 - ratio)),
    Math.round(g * (1 - ratio)),
    Math.round(b * (1 - ratio)),
  );
}

/** Fallback palette when extraction fails or yields too few colours. */
export function defaultPalette(): string[] {
  return ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#ec4899'];
}

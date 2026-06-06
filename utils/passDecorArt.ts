/**
 * Small scenery props scattered along the slope (huts, pines, rocks).
 */

export type DecorVariant = 'hut' | 'pine' | 'rock' | 'fence' | 'cabin';

const VARIANTS: DecorVariant[] = ['hut', 'pine', 'rock', 'fence', 'cabin'];

const SVG: Record<DecorVariant, { w: number; h: number; html: string }> = {
  hut: {
    w: 36,
    h: 28,
    html: '<path fill="#1a1a2e" d="M4,28 L4,14 L18,4 L32,14 L32,28 Z"/><rect x="14" y="18" width="8" height="10" fill="#2d2d44"/>',
  },
  pine: {
    w: 24,
    h: 40,
    html: '<polygon fill="#1a1a2e" points="12,4 22,22 16,22 20,38 12,38 8,22 2,22"/><polygon fill="#2d2d44" points="12,12 18,24 14,24 16,34 12,34 8,24 6,24"/>',
  },
  rock: {
    w: 32,
    h: 18,
    html: '<ellipse cx="16" cy="12" rx="14" ry="10" fill="#2d2d44"/><ellipse cx="12" cy="10" rx="8" ry="6" fill="#1a1a2e" opacity="0.5"/>',
  },
  fence: {
    w: 48,
    h: 22,
    html: '<rect x="2" y="8" width="4" height="14" fill="#1a1a2e"/><rect x="14" y="8" width="4" height="14" fill="#1a1a2e"/><rect x="26" y="8" width="4" height="14" fill="#1a1a2e"/><rect x="38" y="8" width="4" height="14" fill="#1a1a2e"/><rect x="0" y="10" width="44" height="3" fill="#2d2d44"/>',
  },
  cabin: {
    w: 44,
    h: 32,
    html: '<path fill="#1a1a2e" d="M6,32 L6,16 L22,6 L38,16 L38,32 Z"/><path fill="#2d2d44" d="M22,10 L34,18 L34,32 L10,32 L10,18 Z"/>',
  },
};

function hashSeed(n: number): number {
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export interface DecorItem {
  scrollX: number;
  variant: DecorVariant;
  width: number;
  height: number;
  viewBox: string;
  innerHtml: string;
  scale: number;
  opacity: number;
}

/** Deterministic decor props along the ride path. */
export function generateDecorItems(count: number, spacing: number, startX: number): DecorItem[] {
  const items: DecorItem[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i + 1;
    const variant = VARIANTS[Math.floor(hashSeed(seed) * VARIANTS.length)];
    const art = SVG[variant];
    const jitter = (hashSeed(seed * 2) - 0.5) * spacing * 0.4;
    items.push({
      scrollX: startX + i * spacing + jitter,
      variant,
      width: art.w,
      height: art.h,
      viewBox: `0 0 ${art.w} ${art.h}`,
      innerHtml: art.html,
      scale: 0.85 + hashSeed(seed * 3) * 0.35,
      opacity: 0.55 + hashSeed(seed * 4) * 0.35,
    });
  }
  return items;
}

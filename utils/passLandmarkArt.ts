/**
 * Pass Landmark Art
 *
 * SVG silhouettes keyed by IANA hash — bridge, pagoda, tower, gate, opera, clock.
 */

export type LandmarkVariant = 'bridge' | 'pagoda' | 'tower' | 'gate' | 'opera' | 'clock';

const VARIANTS: LandmarkVariant[] = ['bridge', 'pagoda', 'tower', 'gate', 'opera', 'clock'];

/** Variants that enable grind rail tricks when rider jumps nearby. */
export const GRIND_RAIL_VARIANTS: ReadonlySet<LandmarkVariant> = new Set(['tower', 'gate']);

function hashIana(ianaName: string): number {
  let hash = 0;
  for (let i = 0; i < ianaName.length; i++) {
    hash = (hash * 31 + ianaName.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getLandmarkVariant(ianaName: string): LandmarkVariant {
  return VARIANTS[hashIana(ianaName) % VARIANTS.length];
}

export function hasGrindRail(ianaName: string): boolean {
  return GRIND_RAIL_VARIANTS.has(getLandmarkVariant(ianaName));
}

const SVG_BY_VARIANT: Record<LandmarkVariant, { width: number; height: number; svg: string }> = {
  bridge: {
    width: 80,
    height: 72,
    svg: '<path fill="#1a1a2e" d="M5,72 L5,45 Q20,20 40,35 Q60,20 75,45 L75,72 Z"/><path fill="#2d2d44" d="M15,72 L15,50 Q30,35 40,48 Q50,35 65,50 L65,72 Z"/>',
  },
  pagoda: {
    width: 64,
    height: 90,
    svg: '<path fill="#1a1a2e" d="M32,8 L48,35 L48,80 L16,80 L16,35 Z"/><path fill="#2d2d44" d="M32,18 L40,35 L40,45 L24,45 L24,35 Z"/><rect x="28" y="50" width="8" height="30" fill="#2d2d44"/>',
  },
  tower: {
    width: 52,
    height: 96,
    svg: '<rect x="18" y="30" width="16" height="66" fill="#1a1a2e"/><path fill="#2d2d44" d="M14,30 L38,30 L36,20 L16,20 Z"/><rect x="22" y="8" width="8" height="14" fill="#1a1a2e"/><circle cx="26" cy="50" r="6" fill="#2d2d44"/>',
  },
  gate: {
    width: 70,
    height: 88,
    svg: '<path fill="#1a1a2e" d="M35,5 L55,25 L55,80 L15,80 L15,25 Z"/><circle cx="35" cy="35" r="12" fill="#2d2d44"/><rect x="30" y="55" width="10" height="25" fill="#2d2d44"/>',
  },
  opera: {
    width: 72,
    height: 80,
    svg: '<path fill="#1a1a2e" d="M8,80 L8,45 L16,45 L16,35 L24,35 L24,45 L32,45 L32,30 L40,30 L40,45 L48,45 L48,38 L56,38 L56,45 L64,45 L64,80 Z"/><path fill="#2d2d44" d="M0,80 L72,80 L72,50 Q36,42 0,50 Z"/>',
  },
  clock: {
    width: 56,
    height: 88,
    svg: '<rect x="20" y="10" width="16" height="58" fill="#1a1a2e"/><circle cx="28" cy="8" r="8" fill="#2d2d44"/><path fill="#2d2d44" d="M12,68 L44,68 L40,80 L16,80 Z"/><line x1="28" y1="25" x2="28" y2="55" stroke="#2d2d44" stroke-width="2"/><line x1="28" y1="40" x2="36" y2="40" stroke="#2d2d44" stroke-width="2"/>',
  },
};

export function getLandmarkSvg(ianaName: string): { width: number; height: number; viewBox: string; innerHtml: string } {
  const variant = getLandmarkVariant(ianaName);
  const art = SVG_BY_VARIANT[variant];
  return {
    width: art.width,
    height: art.height,
    viewBox: `0 0 ${art.width} ${art.height}`,
    innerHtml: art.svg,
  };
}

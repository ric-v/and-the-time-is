/**
 * Observatory sky palette — matches horizon-observatory.html SKY_24 / wash.
 * Used for the fixed #sky-wash gradient and optional CSS variables.
 */

/** [zenith, horizon] hex pairs per UTC hour 0–23 */
export const OBSERVATORY_SKY_24: readonly [string, string][] = [
  ['#07091e', '#0f1235'],
  ['#080a21', '#101338'],
  ['#090b23', '#11153e'],
  ['#0b0e2a', '#141840'],
  ['#0e1133', '#18204e'],
  ['#221538', '#3d2e55'],
  ['#4a3a6e', '#e8a38a'],
  ['#6a5082', '#f0b898'],
  ['#82a0c8', '#d4c0a0'],
  ['#6fb8e8', '#b8d8ee'],
  ['#5aaad6', '#c8e0f0'],
  ['#4a9fdb', '#d8e8e0'],
  ['#4a9fdb', '#e8e0c8'],
  ['#52a4d8', '#e0dcc0'],
  ['#5ab0e0', '#c8d8e8'],
  ['#60b8e8', '#b8d0e8'],
  ['#6a90b8', '#a8b8d0'],
  ['#5a6890', '#b8a898'],
  ['#3d2a5a', '#e8856e'],
  ['#2a1a4a', '#c06858'],
  ['#1a1238', '#7a4858'],
  ['#1a1a3f', '#3a2f5a'],
  ['#141830', '#282445'],
  ['#0f1228', '#1e1e3c'],
] as const;

export function getObservatorySkyPair(localHour: number): { zenith: string; horizon: string } {
  const h = ((Math.floor(localHour) % 24) + 24) % 24;
  const [zenith, horizon] = OBSERVATORY_SKY_24[h];
  return { zenith, horizon };
}

export function observatorySkyWashGradient(localHour: number): string {
  const { zenith, horizon } = getObservatorySkyPair(localHour);
  return `linear-gradient(180deg, ${zenith} 0%, ${horizon} 55%, transparent 100%)`;
}

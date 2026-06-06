import { get24StatePaletteForHour, getSkyState, type SkyStateName } from './skyPaletteEngine';

type ObservatoryThemeTokens = {
  salmonAccent: string;
  paper: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  inkMid: string;
  inkFaint: string;
  ruleSoft: string;
  scrubTrackFill: string;
  scrubBtnHoverBg: string;
  scrubHandleShadow: string;
  scrubHandleShadowDrag: string;
  obsBackdropBg: string;
  obsBackdropFilter: string;
  obsSkyWashOpacity: string;
  obsSkyWashBlend: string;
  paperGrainBlend: string;
};

const DARK_TOKENS_BY_STATE: Record<SkyStateName, ObservatoryThemeTokens> = {
  midnight: {
    salmonAccent: '#e27d82',
    paper: '#121828',
    paperDeep: '#0e1422',
    ink: '#f2f6ff',
    inkSoft: '#c2ccde',
    inkMid: '#95a1bb',
    inkFaint: '#6e7891',
    ruleSoft: 'rgba(194, 205, 230, 0.22)',
    scrubTrackFill: 'rgba(255, 255, 255, 0.12)',
    scrubBtnHoverBg: 'rgba(255, 255, 255, 0.08)',
    scrubHandleShadow: '0 2px 8px rgba(3, 6, 12, 0.48)',
    scrubHandleShadowDrag: '0 4px 14px rgba(0, 0, 0, 0.52)',
    obsBackdropBg: 'rgba(14, 20, 34, 0.8)',
    obsBackdropFilter: 'blur(8px) saturate(120%)',
    obsSkyWashOpacity: '0.58',
    obsSkyWashBlend: 'screen',
    paperGrainBlend: 'soft-light',
  },
  dawn: {
    salmonAccent: '#f38b8a',
    paper: '#1d1926',
    paperDeep: '#171320',
    ink: '#fff1e8',
    inkSoft: '#e2c7b8',
    inkMid: '#bba090',
    inkFaint: '#8e766a',
    ruleSoft: 'rgba(255, 214, 196, 0.24)',
    scrubTrackFill: 'rgba(255, 236, 226, 0.16)',
    scrubBtnHoverBg: 'rgba(255, 236, 226, 0.1)',
    scrubHandleShadow: '0 2px 8px rgba(22, 10, 14, 0.45)',
    scrubHandleShadowDrag: '0 4px 14px rgba(22, 10, 14, 0.56)',
    obsBackdropBg: 'rgba(26, 18, 24, 0.82)',
    obsBackdropFilter: 'blur(8px) saturate(125%)',
    obsSkyWashOpacity: '0.52',
    obsSkyWashBlend: 'screen',
    paperGrainBlend: 'soft-light',
  },
  day: {
    salmonAccent: '#f59a8f',
    paper: '#152033',
    paperDeep: '#111a2a',
    ink: '#ecf6ff',
    inkSoft: '#bdd0e4',
    inkMid: '#92a8c1',
    inkFaint: '#6d839d',
    ruleSoft: 'rgba(176, 210, 242, 0.24)',
    scrubTrackFill: 'rgba(222, 240, 255, 0.16)',
    scrubBtnHoverBg: 'rgba(222, 240, 255, 0.1)',
    scrubHandleShadow: '0 2px 8px rgba(10, 18, 30, 0.44)',
    scrubHandleShadowDrag: '0 4px 14px rgba(10, 18, 30, 0.56)',
    obsBackdropBg: 'rgba(16, 24, 38, 0.8)',
    obsBackdropFilter: 'blur(8px) saturate(126%)',
    obsSkyWashOpacity: '0.42',
    obsSkyWashBlend: 'screen',
    paperGrainBlend: 'soft-light',
  },
  noon: {
    salmonAccent: '#f6a196',
    paper: '#162333',
    paperDeep: '#111b29',
    ink: '#eef7ff',
    inkSoft: '#c2d4e6',
    inkMid: '#97acc2',
    inkFaint: '#7188a0',
    ruleSoft: 'rgba(190, 220, 248, 0.22)',
    scrubTrackFill: 'rgba(231, 244, 255, 0.15)',
    scrubBtnHoverBg: 'rgba(231, 244, 255, 0.1)',
    scrubHandleShadow: '0 2px 8px rgba(8, 16, 26, 0.42)',
    scrubHandleShadowDrag: '0 4px 14px rgba(8, 16, 26, 0.52)',
    obsBackdropBg: 'rgba(16, 25, 38, 0.78)',
    obsBackdropFilter: 'blur(8px) saturate(122%)',
    obsSkyWashOpacity: '0.38',
    obsSkyWashBlend: 'screen',
    paperGrainBlend: 'soft-light',
  },
  dusk: {
    salmonAccent: '#f08a86',
    paper: '#211727',
    paperDeep: '#1a1220',
    ink: '#ffece2',
    inkSoft: '#dfc1b6',
    inkMid: '#b69288',
    inkFaint: '#8b6d66',
    ruleSoft: 'rgba(255, 205, 186, 0.24)',
    scrubTrackFill: 'rgba(255, 229, 214, 0.16)',
    scrubBtnHoverBg: 'rgba(255, 229, 214, 0.1)',
    scrubHandleShadow: '0 2px 8px rgba(20, 8, 12, 0.48)',
    scrubHandleShadowDrag: '0 4px 14px rgba(20, 8, 12, 0.58)',
    obsBackdropBg: 'rgba(28, 15, 24, 0.82)',
    obsBackdropFilter: 'blur(8px) saturate(125%)',
    obsSkyWashOpacity: '0.52',
    obsSkyWashBlend: 'screen',
    paperGrainBlend: 'soft-light',
  },
  night: {
    salmonAccent: '#de7a84',
    paper: '#17162a',
    paperDeep: '#121123',
    ink: '#ecebff',
    inkSoft: '#c4c2df',
    inkMid: '#9a98bb',
    inkFaint: '#747294',
    ruleSoft: 'rgba(210, 205, 255, 0.22)',
    scrubTrackFill: 'rgba(233, 228, 255, 0.14)',
    scrubBtnHoverBg: 'rgba(233, 228, 255, 0.1)',
    scrubHandleShadow: '0 2px 8px rgba(8, 6, 16, 0.48)',
    scrubHandleShadowDrag: '0 4px 14px rgba(8, 6, 16, 0.6)',
    obsBackdropBg: 'rgba(18, 16, 34, 0.82)',
    obsBackdropFilter: 'blur(8px) saturate(120%)',
    obsSkyWashOpacity: '0.56',
    obsSkyWashBlend: 'screen',
    paperGrainBlend: 'soft-light',
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((ch) => `${ch}${ch}`).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  const red = (int >> 16) & 255;
  const green = (int >> 8) & 255;
  const blue = int & 255;
  return [red, green, blue];
}

function toRgba(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getDarkObservatoryThemeVars(localHour: number): Record<string, string> {
  const hour = ((Math.floor(localHour) % 24) + 24) % 24;
  const skyState = getSkyState(hour);
  const entry = get24StatePaletteForHour(hour);
  const tokens = DARK_TOKENS_BY_STATE[skyState];
  const accent = tokens.salmonAccent;

  return {
    '--paper': tokens.paper,
    '--paper-deep': tokens.paperDeep,
    '--ink': tokens.ink,
    '--ink-soft': tokens.inkSoft,
    '--ink-mid': tokens.inkMid,
    '--ink-faint': tokens.inkFaint,
    '--rule-soft': tokens.ruleSoft,
    '--ember': accent,
    '--ember-soft': toRgba(accent, 0.2),
    '--chrome-glass': tokens.paper,
    '--chrome-menu-bg': toRgba(tokens.paperDeep, 0.96),
    '--chrome-border': tokens.ruleSoft,
    '--chrome-text-primary': tokens.ink,
    '--chrome-text-secondary': tokens.inkSoft,
    '--chrome-text-muted': tokens.inkMid,
    '--accent': accent,
    '--accent-soft': toRgba(accent, 0.22),
    '--focus-ring': accent,
    '--format-on-accent': '#f7f9ff',
    '--success-soft': toRgba('#6fd8b8', 0.22),
    '--danger-soft': toRgba('#f07f9a', 0.22),
    '--danger-text': '#ffc8d7',
    '--scrub-track-fill': tokens.scrubTrackFill,
    '--scrub-btn-hover-bg': tokens.scrubBtnHoverBg,
    '--scrub-handle-bg': tokens.paper,
    '--scrub-handle-border': `1.5px solid ${tokens.ink}`,
    '--scrub-handle-shadow': tokens.scrubHandleShadow,
    '--scrub-handle-shadow-drag': `${tokens.scrubHandleShadowDrag}, 0 0 0 4px ${toRgba(accent, 0.28)}`,
    '--obs-backdrop-bg': tokens.obsBackdropBg,
    '--obs-backdrop-filter': tokens.obsBackdropFilter,
    '--toast-border': tokens.ruleSoft,
    '--toast-bg-info': toRgba(accent, 0.18),
    '--toast-text-info': tokens.inkSoft,
    '--toast-text-success': '#8deccf',
    '--obs-sky-wash-opacity': tokens.obsSkyWashOpacity,
    '--obs-sky-wash-blend': tokens.obsSkyWashBlend,
    '--obs-paper-grain-blend': tokens.paperGrainBlend,
  };
}

export const OBSERVATORY_THEME_VAR_KEYS = [
  '--paper',
  '--paper-deep',
  '--ink',
  '--ink-soft',
  '--ink-mid',
  '--ink-faint',
  '--rule-soft',
  '--ember',
  '--ember-soft',
  '--chrome-glass',
  '--chrome-menu-bg',
  '--chrome-border',
  '--chrome-text-primary',
  '--chrome-text-secondary',
  '--chrome-text-muted',
  '--accent',
  '--accent-soft',
  '--focus-ring',
  '--format-on-accent',
  '--success-soft',
  '--danger-soft',
  '--danger-text',
  '--scrub-track-fill',
  '--scrub-btn-hover-bg',
  '--scrub-handle-bg',
  '--scrub-handle-border',
  '--scrub-handle-shadow',
  '--scrub-handle-shadow-drag',
  '--obs-backdrop-bg',
  '--obs-backdrop-filter',
  '--toast-border',
  '--toast-bg-info',
  '--toast-text-info',
  '--toast-text-success',
  '--obs-sky-wash-opacity',
  '--obs-sky-wash-blend',
  '--obs-paper-grain-blend',
] as const;

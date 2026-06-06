import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DisplayFormat =
  | 'local'
  | '24h'
  | '12h'
  | 'iso'
  | 'unix'
  | 'ymd24'
  | 'ymd12'
  | 'mdy24'
  | 'mdy12'
  | 'readable';
export type ReducedMotionOverride = 'auto' | 'on' | 'off';
export type ThemeMode = 'light' | 'dark';

export interface HorizonSettings {
  displayFormat: DisplayFormat;
  themeMode: ThemeMode;
  orbDrift: boolean;
  globeAutoRotation: boolean;                     // default true, disabled if reduced motion active
  rememberScrubPosition: boolean;
  reducedMotionOverride: ReducedMotionOverride;
  anchorOrbId: string | null;                     // null = Local Orb
  cameraAngle: { azimuth: number; elevation: number };
  coachMarkDismissed: boolean;
  recentSearches: string[];                       // max 5 IANA names
  lastScrubOffset: number;                        // minutes, only if rememberScrubPosition
  lastScrubTimestamp: number;                     // Unix ms, for expiry check
}

const MAX_RECENT_SEARCHES = 5;

const initialState: HorizonSettings = {
  displayFormat: 'local',
  themeMode: 'dark',
  orbDrift: true,
  globeAutoRotation: true,
  rememberScrubPosition: false,
  reducedMotionOverride: 'auto',
  anchorOrbId: null,
  cameraAngle: { azimuth: 0, elevation: 12 },
  coachMarkDismissed: false,
  recentSearches: [],
  lastScrubOffset: 0,
  lastScrubTimestamp: 0,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDisplayFormat(state, action: PayloadAction<DisplayFormat>) {
      state.displayFormat = action.payload;
    },
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setOrbDrift(state, action: PayloadAction<boolean>) {
      state.orbDrift = action.payload;
    },
    setGlobeAutoRotation(state, action: PayloadAction<boolean>) {
      state.globeAutoRotation = action.payload;
    },
    setReducedMotion(state, action: PayloadAction<ReducedMotionOverride>) {
      state.reducedMotionOverride = action.payload;
    },
    setAnchorOrb(state, action: PayloadAction<string | null>) {
      state.anchorOrbId = action.payload;
    },
    setRememberScrub(state, action: PayloadAction<boolean>) {
      state.rememberScrubPosition = action.payload;
    },
    dismissCoachMark(state) {
      state.coachMarkDismissed = true;
    },
    addRecentSearch(state, action: PayloadAction<string>) {
      // Remove if already present, then prepend; cap at MAX_RECENT_SEARCHES
      state.recentSearches = [
        action.payload,
        ...state.recentSearches.filter((s) => s !== action.payload),
      ].slice(0, MAX_RECENT_SEARCHES);
    },
    setCameraAngle(state, action: PayloadAction<{ azimuth: number; elevation: number }>) {
      state.cameraAngle = action.payload;
    },
    setLastScrubPosition(state, action: PayloadAction<{ offset: number; timestamp: number }>) {
      state.lastScrubOffset = action.payload.offset;
      state.lastScrubTimestamp = action.payload.timestamp;
    },
    loadSettings(_state, action: PayloadAction<HorizonSettings>) {
      return action.payload;
    },
  },
});

export const {
  setDisplayFormat,
  setThemeMode,
  setOrbDrift,
  setGlobeAutoRotation,
  setReducedMotion,
  setAnchorOrb,
  setRememberScrub,
  dismissCoachMark,
  addRecentSearch,
  setCameraAngle,
  setLastScrubPosition,
  loadSettings,
} = settingsSlice.actions;
export default settingsSlice.reducer;

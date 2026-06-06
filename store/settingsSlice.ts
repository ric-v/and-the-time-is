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

/** Persisted app settings (storage key remains horizon.settings for compatibility). */
export interface AppSettings {
  displayFormat: DisplayFormat;
  rememberScrubPosition: boolean;
  reducedMotionOverride: ReducedMotionOverride;
  recentSearches: string[];
  lastScrubOffset: number;
  lastScrubTimestamp: number;
  /** Legacy fields — ignored by Pass UI, kept for migration from older saves. */
  themeMode?: 'light' | 'dark';
  orbDrift?: boolean;
  globeAutoRotation?: boolean;
  anchorOrbId?: string | null;
  cameraAngle?: { azimuth: number; elevation: number };
  coachMarkDismissed?: boolean;
  cameraOrbitHintDismissed?: boolean;
}

const MAX_RECENT_SEARCHES = 5;

const initialState: AppSettings = {
  displayFormat: 'local',
  rememberScrubPosition: false,
  reducedMotionOverride: 'auto',
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
    setReducedMotion(state, action: PayloadAction<ReducedMotionOverride>) {
      state.reducedMotionOverride = action.payload;
    },
    setRememberScrub(state, action: PayloadAction<boolean>) {
      state.rememberScrubPosition = action.payload;
    },
    addRecentSearch(state, action: PayloadAction<string>) {
      state.recentSearches = [
        action.payload,
        ...state.recentSearches.filter((s) => s !== action.payload),
      ].slice(0, MAX_RECENT_SEARCHES);
    },
    setLastScrubPosition(state, action: PayloadAction<{ offset: number; timestamp: number }>) {
      state.lastScrubOffset = action.payload.offset;
      state.lastScrubTimestamp = action.payload.timestamp;
    },
    loadSettings(_state, action: PayloadAction<AppSettings>) {
      return { ...initialState, ...action.payload };
    },
  },
});

export const {
  setDisplayFormat,
  setReducedMotion,
  setRememberScrub,
  addRecentSearch,
  setLastScrubPosition,
  loadSettings,
} = settingsSlice.actions;

/** @deprecated Use AppSettings */
export type HorizonSettings = AppSettings;

export default settingsSlice.reducer;

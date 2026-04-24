import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type HorizonViewMode = 'full' | 'simple';

export interface SessionState {
  expandedOrbId: string | null;
  cameraIsOrbiting: boolean;
  commandPaletteOpen: boolean;
  dateJumpOpen: boolean;
  settingsOpen: boolean;
  /** Full = globe + ring; Simple = scrollable list + horizon dome (reference HTML). */
  horizonViewMode: HorizonViewMode;
}

const initialState: SessionState = {
  expandedOrbId: null,
  cameraIsOrbiting: false,
  commandPaletteOpen: false,
  dateJumpOpen: false,
  settingsOpen: false,
  horizonViewMode: 'full',
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setExpandedOrb(state, action: PayloadAction<string | null>) {
      state.expandedOrbId = action.payload;
    },
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setDateJumpOpen(state, action: PayloadAction<boolean>) {
      state.dateJumpOpen = action.payload;
    },
    setSettingsOpen(state, action: PayloadAction<boolean>) {
      state.settingsOpen = action.payload;
    },
    setCameraOrbiting(state, action: PayloadAction<boolean>) {
      state.cameraIsOrbiting = action.payload;
    },
    setHorizonViewMode(state, action: PayloadAction<HorizonViewMode>) {
      state.horizonViewMode = action.payload;
    },
  },
});

export const {
  setExpandedOrb,
  setCommandPaletteOpen,
  setDateJumpOpen,
  setSettingsOpen,
  setCameraOrbiting,
  setHorizonViewMode,
} = sessionSlice.actions;
export default sessionSlice.reducer;

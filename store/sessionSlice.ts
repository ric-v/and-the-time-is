import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionState {
  commandPaletteOpen: boolean;
  dateJumpOpen: boolean;
  settingsOpen: boolean;
}

const initialState: SessionState = {
  commandPaletteOpen: false,
  dateJumpOpen: false,
  settingsOpen: false,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setDateJumpOpen(state, action: PayloadAction<boolean>) {
      state.dateJumpOpen = action.payload;
    },
    setSettingsOpen(state, action: PayloadAction<boolean>) {
      state.settingsOpen = action.payload;
    },
  },
});

export const {
  setCommandPaletteOpen,
  setDateJumpOpen,
  setSettingsOpen,
} = sessionSlice.actions;
export default sessionSlice.reducer;

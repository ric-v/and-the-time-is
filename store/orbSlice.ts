import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Orb — represents a single pinned timezone on the Horizon Ring.
 */
export interface Orb {
  id: string;              // UUID v4
  ianaName: string;        // Canonical IANA name, e.g. "Asia/Kolkata"
  label: string;           // User-editable, default = city name from API
  isLocal: boolean;        // true only for the Local Orb
  createdAt: number;       // Unix ms timestamp
  displayOrder: number;    // Tiebreaker for identical ring angles
}

interface OrbState {
  list: Orb[];
}

const initialState: OrbState = {
  list: [],
};

const orbSlice = createSlice({
  name: 'orbs',
  initialState,
  reducers: {
    addOrb(state, action: PayloadAction<Orb>) {
      // Only add if not already present (by ianaName)
      if (!state.list.find((orb) => orb.ianaName === action.payload.ianaName)) {
        state.list.push(action.payload);
      }
    },
    removeOrb(state, action: PayloadAction<string>) {
      // Remove by id; the Local Orb should be protected at the component level
      state.list = state.list.filter((orb) => orb.id !== action.payload);
    },
    renameOrb(state, action: PayloadAction<{ id: string; label: string }>) {
      const orb = state.list.find((o) => o.id === action.payload.id);
      if (orb) {
        orb.label = action.payload.label;
      }
    },
    setOrbList(state, action: PayloadAction<Orb[]>) {
      state.list = action.payload;
    },
  },
});

export const { addOrb, removeOrb, renameOrb, setOrbList } = orbSlice.actions;
export default orbSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ScrubState {
  offset: number;              // minutes, signed
  scrubbingInProgress: boolean;
}

const initialState: ScrubState = {
  offset: 0,
  scrubbingInProgress: false,
};

const scrubSlice = createSlice({
  name: 'scrub',
  initialState,
  reducers: {
    setScrubOffset(state, action: PayloadAction<number>) {
      state.offset = action.payload;
    },
    setScrubbingInProgress(state, action: PayloadAction<boolean>) {
      state.scrubbingInProgress = action.payload;
    },
  },
});

export const { setScrubOffset, setScrubbingInProgress } = scrubSlice.actions;
export default scrubSlice.reducer;

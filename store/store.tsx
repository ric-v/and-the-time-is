import { configureStore, createAction, createReducer } from "@reduxjs/toolkit";
import { Timezones } from "../functions/timeNow";

const initState = [] as Timezones[];

const addTzCard = createAction<Timezones>("timezone/add");
const removeTzCard = createAction<Timezones>("timezone/remove");

const tzReducer = createReducer(initState, (builder) => {
  builder.addCase(
    addTzCard, (state, action) => {
      const tz = action.payload;
      return [...state, tz];
    });
  builder.addCase(
    removeTzCard, (state, action) => {
      const tzData = action.payload;
      return state.filter(tz => tzData.name !== tz.name);
    });
});

export const store = configureStore({
  preloadedState: {
    timezones: initState,
  },
  reducer: {
    timezones: tzReducer,
  },
});


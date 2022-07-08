import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';

import { Timezones } from '../functions/timeNow';

/**
 * @description - This is the reducer action data type.
 */
type storeData = {
  payload: Timezones;
  type: string;
}
/**
 * @description - initial state of the store on load.
 */
const initState = [] as Timezones[];

/**
 * @description - add timezone to the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const addTimezone = createAction<Timezones>("timezone/add");
const addTimezoneFunc = (state: Timezones[], action: storeData) => {
  const tz = action.payload;
  if (!state.find((tzData) => tzData.name === tz.name)) {
    // add this timezone to local storage
    localStorage.setItem(
      "timezones",
      JSON.stringify([...state, action.payload]),
    );
    return [...state, tz];
  }
};

/**
 * @description - remove timezone from the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const removeTimezone = createAction<Timezones>("timezone/remove");
const removeTimezoneFunc = (state: Timezones[], action: storeData) => {
  // remove this timezone from local storage
  localStorage.setItem(
    "timezones",
    JSON.stringify(state.filter((tz) => tz.name !== action.payload.name)),
  );

  const tzData = action.payload;
  return state.filter(tz => tzData.name !== tz.name);
};

/**
 * reducer - reducer for the store data
 */
const reducers = createReducer(initState, (builder) => {

  // adding new timezone card to dashboard
  builder.addCase(addTimezone, addTimezoneFunc);
  builder.addCase(removeTimezone, removeTimezoneFunc);
});

/**
 * data store for timezone data
 */
export const store = configureStore({
  preloadedState: {
    storedata: initState,
  },
  reducer: {
    storedata: reducers,
  },
});

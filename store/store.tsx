import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';

import { Timezones } from '../pages/api/functions/timeNow';

/**
 * @description - This is the reducer action data type.
 */
type actionData = {
  timezone: Timezones;
  dateFormat: string;
  miniNav: string;
  timewasData: string;
}

type storeData = {
  timezones: Timezones[];
  dateFormat: string;
  miniNav: string;
  timewasData: string;
}

/**
 * @description - initial state of the store on load.
 */
const initState = {
  timezones: [] as Timezones[],
  dateFormat: "%b %d %Y %H:%M:%S %Z (%:z)",
  miniNav: "full",
  timewasData: '' as string,
} as storeData;

const addTimezone = createAction<actionData>("timezone/add");
/**
 * @description - add timezone to the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const addTimezoneFunc = (state: storeData, action: { payload: actionData; type: string; }) => {
  const tz = action.payload.timezone;
  if (!state.timezones.find((tzData) => tzData.name === tz.name)) {
    // add this timezone to local storage
    localStorage.setItem(
      "timezones",
      JSON.stringify([...state.timezones, action.payload.timezone]),
    );
    return { ...state, timezones: [...state.timezones, action.payload.timezone] };
  }
};

const updateTimezone = createAction<actionData>("timezone/update");
/**
 * @description - updates timezone name in the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const updateTimezoneFunc = (state: storeData, action: { payload: actionData; type: string; }) => {
  const tz = action.payload.timezone;
  if (state.timezones.find((tzData) => tzData.city === tz.city && tzData.country === tz.country)) {
    // add this timezone to local storage
    localStorage.setItem(
      "timezones",
      JSON.stringify(state.timezones.map((tzData) => ((tzData.city === tz.city && tzData.country === tz.country)) ? tz : tzData)),
    );
    return { ...state, timezones: state.timezones.map((tzData) => ((tzData.city === tz.city && tzData.country === tz.country)) ? tz : tzData) };
  }
};

const removeTimezone = createAction<actionData>("timezone/remove");
/**
 * @description - remove timezone from the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const removeTimezoneFunc = (state: storeData, action: { payload: actionData; type: string; }): storeData => {
  // remove this timezone from local storage
  localStorage.setItem(
    "timezones",
    JSON.stringify(state.timezones.filter((tz) => tz.name !== action.payload.timezone.name)),
  );

  const tzData = action.payload.timezone;
  return { ...state, timezones: state.timezones.filter((tz) => tz.name !== tzData.name) };
};

const setDateFormat = createAction<string>("dateformat/update");
/**
 * @description - remove timezone from the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const dateFormatSetFunc = (state: storeData, action: { payload: string; type: string; }) => {
  // store the value to local storage
  localStorage.setItem("dateFormat", action.payload);
  return { ...state, dateFormat: action.payload };
};

const setMiniNav = createAction<string>("navbar/resize");
/**
 * @description - resize the size of the navbar
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const setMiniNavFunc = (state: storeData, action: { payload: string; type: string; }) => {
  // store the value to local storage
  localStorage.setItem("navbar-size", action.payload);
  return { ...state, miniNav: action.payload };
};

const setPickedtime = createAction<string>("timewas/data");
/**
 * @description - remove timezone from the store and update the state & local storage
 * 
 * @param state - current state
 * @param action - action to be performed
 * @returns new state
 */
const pickedDateFunc = (state: storeData, action: { payload: string; type: string; }) => {
  // store the value to local storage
  return { ...state, timewasData: action.payload };
};

/**
 * reducer - reducer for the store data
 */
const reducers = createReducer(initState, (builder) => {

  // adding new timezone card to dashboard
  builder.addCase(addTimezone, addTimezoneFunc);
  builder.addCase(removeTimezone, removeTimezoneFunc);
  builder.addCase(updateTimezone, updateTimezoneFunc);
  builder.addCase(setDateFormat, dateFormatSetFunc);
  builder.addCase(setMiniNav, setMiniNavFunc);
  builder.addCase(setPickedtime, pickedDateFunc);
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

import tz from 'timezone/loaded';
import { store } from '../../store/store';

/**
 * type Timezones
 */
export type Timezones = {
  code: string;
  name: string;
  country: string;
  city: string;
  timezone: string;
  offset: string;
  currentTime: string;
}

/**
 * @description get current time in YYYY-MM-DD HH:mm:ss.SSS format
 * @param {string} timezone
 * @param {string} format
 * @returns {string} currentTime
 */
export const getCurrentTime = (timezone: string, format: string): string => {
  return tz(new Date(), format, timezone);
};


/**
 * @description get time based on the date-time from picker in YYYY-MM-DD HH:mm:ss.SSS format
 * @param {string} timezone
 * @returns {string} currentTime
 */
export const getParsedTime = (timezone: string): string => {

  console.log(tz(
    new Date(store.getState().storedata.timewasData),
    store.getState().storedata.dateFormat,
    timezone,
  ))
  return tz(
    new Date(store.getState().storedata.timewasData),
    store.getState().storedata.dateFormat,
    timezone,
  );
};


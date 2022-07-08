import tz from 'timezone/loaded';

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
const getCurrentTime = (timezone: string, format: string): string => {
  return tz(new Date(), format, timezone);
};

export default getCurrentTime;

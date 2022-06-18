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
 * @description
 * get current time in YYYY-MM-DD HH:mm:ss.SSS format
 *
 * @returns {string}
 */
const getCurrentTime = (timezone: string): string => {
  return tz(new Date(), "%B %0d %Y %H:%M:%S %Z (%:z)", timezone);
};

export default getCurrentTime;

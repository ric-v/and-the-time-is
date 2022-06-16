import tz from 'timezone/loaded';

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

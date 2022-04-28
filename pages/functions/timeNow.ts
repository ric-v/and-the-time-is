import moment from "moment-timezone";

/**
 * @description
 * get current time in YYYY-MM-DD HH:mm:ss.SSS format
 *
 * @returns {string}
 */
const getCurrentTime = (timezone: string): string => {
  return moment
    .tz(new Date(), timezone)
    .format("YYYY-MM-DD HH:mm:ss z/Z");
};

export default getCurrentTime;

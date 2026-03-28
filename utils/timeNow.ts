import tz from 'timezone/loaded';
import { store } from '../store/store';

const timezoneAliases: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
};

export const canonicalizeTimezoneId = (timezone: string): string => timezoneAliases[timezone] || timezone;

/**
 * type Timezones
 */
export type Timezones = {
  customname: string;
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
  if (format === '%s') {
    const rawDate = new Date();
    const targetOffsetStr = getUtcOffsetIntl(timezone, rawDate);
    const [h, m] = targetOffsetStr.replace(/[+-]/, '').split(':').map(Number);
    const sign = targetOffsetStr.startsWith('-') ? -1 : 1;
    const offsetMs = sign * (h * 60 + m) * 60000;
    return Math.floor((rawDate.getTime() + offsetMs) / 1000).toString();
  }
  return tz(new Date(), format, canonicalizeTimezoneId(timezone));
};

/**
 * @description get UTC offset for timezone using Intl APIs (e.g. +05:30)
 * @param {string} timezone
 * @param {Date} date
 * @returns {string}
 */
export const getUtcOffsetIntl = (timezone: string, date: Date = new Date()): string => {
  const canonicalTimezone = canonicalizeTimezoneId(timezone);
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: canonicalTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = dtf.formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || '00';

    const asUtcMs = Date.UTC(
      Number.parseInt(getPart('year'), 10),
      Number.parseInt(getPart('month'), 10) - 1,
      Number.parseInt(getPart('day'), 10),
      Number.parseInt(getPart('hour'), 10),
      Number.parseInt(getPart('minute'), 10),
      Number.parseInt(getPart('second'), 10),
    );

    const offsetMinutes = Math.round((asUtcMs - date.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const minutes = String(abs % 60).padStart(2, '0');

    return `${sign}${hours}:${minutes}`;
  } catch {
    return '+00:00';
  }
};

/**
 * @description get relative offset against local timezone (e.g. +5h 30m)
 * @param {string} timezone
 * @param {Date} date
 * @returns {string}
 */
export const getRelativeOffsetToLocal = (timezone: string, date: Date = new Date()): string => {
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const target = getUtcOffsetIntl(canonicalizeTimezoneId(timezone), date);
  const local = getUtcOffsetIntl(localTimezone, date);

  const toMinutes = (offset: string) => {
    const sign = offset.startsWith('-') ? -1 : 1;
    const [h, m] = offset.replace(/[+-]/, '').split(':').map((v) => Number.parseInt(v, 10));
    return sign * (h * 60 + m);
  };

  const delta = toMinutes(target) - toMinutes(local);
  if (delta === 0) {
    return 'same as you';
  }

  const sign = delta > 0 ? '+' : '-';
  const abs = Math.abs(delta);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return minutes === 0 ? `${sign}${hours}h` : `${sign}${hours}h ${minutes}m`;
};


/**
 * @description get time based on the date-time from picker in YYYY-MM-DD HH:mm:ss.SSS format
 * @param {string} timezone
 * @returns {string} currentTime
 */
export const getParsedTime = (timezone: string): string => {
  return tz(
    new Date(store.getState().storedata.timewasData),
    store.getState().storedata.dateFormat,
    canonicalizeTimezoneId(timezone),
  );
};

/**
 * @description get custom formatted time based on the date-time from picker
 * @param {string} timezone
 * @param {string} format
 * @returns {string} formattedTime
 */
export const getParsedTimeWithFormat = (timezone: string, format: string): string => {
  if (format === '%s') {
    const rawDate = new Date(store.getState().storedata.timewasData);
    const targetOffsetStr = getUtcOffsetIntl(timezone, rawDate);
    const [h, m] = targetOffsetStr.replace(/[+-]/, '').split(':').map(Number);
    const sign = targetOffsetStr.startsWith('-') ? -1 : 1;
    const offsetMs = sign * (h * 60 + m) * 60000;
    return Math.floor((rawDate.getTime() + offsetMs) / 1000).toString();
  }
  return tz(
    new Date(store.getState().storedata.timewasData),
    format,
    canonicalizeTimezoneId(timezone),
  );
};

/**
 * @description trim additional % from time for display
 * @param {string} time
 * @returns {string}
 */
export const trimTimeFormat = (time: string): string => {
  return time.replaceAll(/%:/g, "").replaceAll(/%/g, "")
};

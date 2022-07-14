
import { useEffect, useState } from 'react';
import { Timezones } from '../functions/timeNow';
import type { TimePickerType } from './Navbar';

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) => fetch(input, init).then((res) => res.json());

type timePickerProps = {
  now: Date;
  dateString: TimePickerType;
  setDateString: (dateString: TimePickerType) => void;
}

/**
 * @description Timezone search component for Navbar
 */
const TimePicker = ({ now, dateString, setDateString }: timePickerProps) => {
  // fetch number of days in a month of the year 
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  }

  useEffect(() => {
    const date = new Date();
  }, [dateString]);

  return (
    <div className="mt-2 mb-4 sm:mt-10">
      <div className="w-full">
        <label className="block uppercase tracking-wide text-teal-400 text-sm font-bold">
          Select a date
        </label>
        <div className='grid grid-cols-3 gap-2 md:gap-10 p-2 mt-5'>
          <select
            className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-800'
            onChange={(e) => {
              setDateString({ ...dateString, year: e.target.value });
            }}
            value={dateString.year}>
            {
              Array.from(Array(now.getFullYear() - 1600).keys()).map((year) => (
                <option key={year + 1} value={now.getFullYear() - year}>{now.getFullYear() - year}</option>
              ))
            }
          </select>
          <select
            className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-none'
            onChange={(e) => {
              setDateString({ ...dateString, month: e.target.value });
            }}
            value={dateString.month}
          >
            {
              Array.from(Array(12).keys()).map((month) => (
                <option key={month} value={month}>
                  {
                    // show month in full name
                    new Date(Number.parseInt(dateString.year), month, 1).toLocaleString('default', { month: 'long' })
                  }
                </option>
              ))
            }
          </select>
          <select
            className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-none'
            onChange={(e) => {
              setDateString({ ...dateString, day: e.target.value });
            }}
            value={dateString.day}
          >
            {
              Array.from(Array(daysInMonth(Number.parseInt(dateString.month), Number.parseInt(dateString.year))).keys()).map((date) => (
                <option key={date + 1} value={date + 1}>
                  {
                    date + 1 < 10 ? `0${date + 1}` : date + 1
                  }
                </option>
              ))
            }
          </select>
        </div>
        <label className="block uppercase tracking-wide text-teal-400 mt-5 text-sm font-bold">
          Select the time
        </label>
        <div className='grid grid-cols-3 gap-2 md:gap-10 p-2 mt-5'>
          <select
            className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-none'
            onChange={(e) => {
              setDateString({ ...dateString, hour: e.target.value });
            }}
            value={dateString.hour}
          >
            {
              Array.from(Array(24).keys()).map((hour) => (
                <option key={hour} value={hour}>
                  {
                    hour < 10 ? `0${hour}` : hour
                  }
                </option>
              ))
            }
          </select>
          <select
            className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-none'
            onChange={(e) => {
              setDateString({ ...dateString, minute: e.target.value });
            }}
            value={dateString.minute}
          >
            {
              Array.from(Array(60).keys()).map((minute) => (
                <option key={minute} value={minute}>
                  {
                    minute < 10 ? `0${minute}` : minute
                  }
                </option>
              ))
            }
          </select>
          <select
            className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-none'
            onChange={(e) => {
              setDateString({ ...dateString, second: e.target.value });
            }}
            value={dateString.second}
          >
            {
              Array.from(Array(60).keys()).map((second) => (
                <option key={second} value={second}>
                  {
                    second < 10 ? `0${second}` : second
                  }
                </option>
              ))
            }
          </select>
        </div>
      </div>
    </div >
  );
};

export default TimePicker;

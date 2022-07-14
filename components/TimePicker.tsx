
import { useEffect, useState } from 'react';
import type { TimePickerType } from './Navbar';

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) => fetch(input, init).then((res) => res.json());

type timePickerProps = {
  now: Date;
  dateString: any;
  setDateString: (dateString: TimePickerType) => void;
}

/**
 * @description Timezone search component for Navbar
 */
const TimePicker = ({ now, dateString, setDateString }: timePickerProps) => {
  const selectClasses = 'bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-800';
  const divClasses = 'grid grid-cols-3 gap-2 md:gap-10 p-2 mt-5';
  // fetch number of days in a month of the year 
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * @description fetchs the timezone data from the API
   * @param {string} text
   */
  const Label = (text: string) => {
    return (
      <label className="block uppercase tracking-wide text-teal-400 text-sm font-bold">
        {text}
      </label>
    )
  }

  const TimeSelect = (field: string, limit: number) => {
    return (
      <select
        className={selectClasses}
        onChange={(e) => {
          setDateString({ ...dateString, [field]: e.target.value })
        }}
        value={dateString[field]}
      >
        {
          Array.from(Array(limit).keys()).map((val) => (
            <option key={val} value={val}>
              {
                val < 10 ? `0${val}` : val
              }
            </option>
          ))
        }
      </select>
    )
  }

  useEffect(() => {
    const date = new Date();
  }, [dateString]);

  return (
    <div className="mt-2 mb-4 sm:mt-10 w-full">

      {Label('Select a date')}
      <div className={divClasses}>
        <select
          className={selectClasses}
          onChange={(e) => {
            setDateString({ ...dateString, year: e.target.value });
          }}
          value={dateString.year}>
          {
            Array.from(Array(now.getFullYear() - 1800).keys()).map((year) => (
              <option key={year + 1} value={now.getFullYear() - year}>{now.getFullYear() - year}</option>
            ))
          }
        </select>
        <select
          className={selectClasses}
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
          className={selectClasses}
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

      {Label('Select the time')}
      <div className={divClasses}>
        {TimeSelect('hour', 24)}
        <select
          className={selectClasses}
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
          className={selectClasses}
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
    </div >
  );
};

export default TimePicker;

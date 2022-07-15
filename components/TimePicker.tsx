
import { useEffect, useState } from 'react';
import type { TimePickerType } from './Navbar';
import Label from './ui-elements/Label';
import Select from './ui-elements/Select';

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
  const selectClasses = `bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-thin 
  scrollbar-track-gray-700 scrollbar-thumb-gray-800  shadow-[10px_30px_30px_-10px_rgba(0,0,0,0.53)]`;
  const divClasses = 'grid grid-cols-3 gap-2 md:gap-10 p-2 mt-2';
  // fetch number of days in a month of the year 
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  }

  useEffect(() => {
    const date = new Date();
  }, [dateString]);

  return (
    <div className="mt-2 mb-4 sm:mt-2 w-full">

      <Label text='Select a date (Year - Month - Date)' />
      <div className={divClasses}>

        {/* select year */}
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

        {/* select month */}
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

        {/* select day */}
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

      <Label text='Select the time (Hour - Minute - Second)' />
      <div className={divClasses}>
        <Select field="hour" limit={24} dateString={dateString} handler={setDateString} classes={selectClasses} />
        <Select field="minute" limit={60} dateString={dateString} handler={setDateString} classes={selectClasses} />
        <Select field="second" limit={60} dateString={dateString} handler={setDateString} classes={selectClasses} />
      </div>
    </div >
  );
};

export default TimePicker;


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
        <Select field='year' limit={now.getFullYear() - 1800} dateString={dateString} handler={setDateString}
          selectVal={(val: number) => (now.getFullYear() - val).toString()}
          optionDisplay={
            (val: number) => (now.getFullYear() - val).toString()
          } />

        {/* select month */}
        <Select field='month' limit={12} dateString={dateString} handler={setDateString}
          selectVal={(val) => val}
          optionDisplay={
            (val: number) =>
              (new Date(Number.parseInt(dateString.year), val, 1).toLocaleString('default', { month: 'long' })).
                toString()
          } />

        {/* select day */}
        <Select field='day' dateString={dateString} handler={setDateString}
          limit={daysInMonth(Number.parseInt(dateString.month), Number.parseInt(dateString.year))}
          selectVal={(val) => val + 1}
          optionDisplay={
            (val: number) => (val + 1 < 10 ? `0${val + 1}` : val + 1).toString()
          } />

      </div>

      <Label text='Select the time (Hour - Minute - Second)' />
      <div className={divClasses}>
        <Select field="hour" limit={24} dateString={dateString} handler={setDateString}
          selectVal={(val) => val}
          optionDisplay={
            (val) => val < 10 ? `0${val}` : val
          } />
        <Select field="minute" limit={60} dateString={dateString} handler={setDateString}
          selectVal={(val) => val}
          optionDisplay={
            (val) => val < 10 ? `0${val}` : val
          } />
        <Select field="second" limit={60} dateString={dateString} handler={setDateString}
          selectVal={(val) => val}
          optionDisplay={
            (val) => val < 10 ? `0${val}` : val
          } />
      </div>
    </div >
  );
};

export default TimePicker;

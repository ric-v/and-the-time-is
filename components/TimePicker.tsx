
import { useEffect, useState } from 'react';
import { BiReset, BiToggleLeft, BiToggleRight } from 'react-icons/bi';
import { getCurrentTime } from '../pages/api/functions/timeNow';
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
  const [toggle, setToggle] = useState(true);
  const [unixTime, setUnixTime] = useState(getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, '%s'));

  // fetch number of days in a month of the year 
  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  }

  useEffect(() => {
    setDateString({
      year: new Date(Number.parseInt(unixTime) * 1000).getFullYear().toString(),
      month: new Date(Number.parseInt(unixTime) * 1000).getMonth().toString(),
      day: new Date(Number.parseInt(unixTime) * 1000).getDate().toString(),
      hour: new Date(Number.parseInt(unixTime) * 1000).getHours().toString(),
      minute: new Date(Number.parseInt(unixTime) * 1000).getMinutes().toString(),
      second: new Date(Number.parseInt(unixTime) * 1000).getSeconds().toString(),
    });
  }, [setDateString, unixTime]);

  return (
    <div className="mt-2 mb-1 sm:mt-2 w-full pb-3">

      <div className={`flex flex-row justify-center items-center align-center mb-10 cursor-pointer
        transition-all duration-1000 ease-in-out border-b border-dashed  border-gray-500 shadow-[10px_20px_40px_-15px_rgba(0,0,0,0.53)]
        hover:animate-pulse hover:border-teal-500 hover:shadow-[10px_20px_30px_-10px_rgba(0,0,0,0.53)]
        ${toggle ? 'text-teal-400' : 'text-gray-400'}`}
        id='toggle-btn'
        aria-label='toggle-btn'
        onClick={() => setToggle(!toggle)}
      >
        <div>
          {
            toggle
              ? <BiToggleRight size={48} />
              : <BiToggleLeft size={48} />
          }
        </div>
        <label htmlFor='toggle-btn' className='ml-4 cursor-pointer font-medium'>
          {toggle ? `Select date-time from date-picker` : `Select date-time from epoch/unix`}
        </label>
      </div>

      {
        toggle ? (
          <>
            <Label text='Select a date (Year - Month - Date)' />
            <div className='grid grid-cols-3 gap-2 md:gap-10 p-0 md:p-2 mt-2'>
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
            <div className='grid grid-cols-3 gap-2 md:gap-10 p-0 md:p-2 mt-2'>
              {
                [{ field: 'hour', limit: 24, }, { field: 'minute', limit: 60, }, { field: 'second', limit: 60, }].
                  map(timeData => (
                    <Select key={timeData.field} field={timeData.field} limit={timeData.limit}
                      dateString={dateString} handler={setDateString} selectVal={(val) => val}
                      optionDisplay={(val: number) => (val < 10 ? `0${val}` : val).toString()}
                    />
                  ))
              }
            </div>
          </>
        ) : (
          <>
            <Label text='Enter an epoch/unix time to convert' />
            <p className="text-gray-500 text-md italic mb-2">
              Acceptable values are any valid epoch/unix or epoch/unix nano values.
            </p>
            <p className="text-gray-500 text-md italic mb-2">
              eg: 1589788800, 1658279330, -1658280557, -26189012347 etc.
            </p>
            <div className="flex flex-row justify-center items-center">
              <label htmlFor="epoch-input" className='text-teal-500 font-medium'>Epoch/Unix time (seconds/nano seconds): </label>
              <input
                id='epoch-input'
                type={'number'}
                min={-60000000000}
                max={60000000000}
                step={1000}
                defaultValue='0'
                className='appearance-none bg-gray-700 rounded-xl w-48 ml-2 mb-5 mt-5 p-2 
                shadow-[10px_20px_30px_-10px_rgba(0,0,0,0.53)] border-t border-l border-dashed border-gray-500
                focus:outline-none focus:shadow-outline-blue-500'
                placeholder='eg: 1658279330, 1000000000'
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length < 5) {
                    // pad with zeros till 9 digits
                    val.padStart(9, '0');
                  } else if (val === '') {
                    val = getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, '%s');
                  }
                  setUnixTime(val);
                }}
                value={unixTime}
              />
              <BiReset size={24} color='gray' className='cursor-pointer'
                onClick={() => { setUnixTime(getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, '%s')) }}
              />
            </div>
          </>
        )
      }

    </div >
  );
};

export default TimePicker;

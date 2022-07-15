import Link from 'next/link';
import { useEffect, useState } from 'react';
import tz from 'timezone/loaded';
import { Transition } from '@headlessui/react'

import { getCurrentTime, getParsedTime, Timezones } from '../pages/api/functions/timeNow';
import { timezoneList } from '../pages/api/timezones';
import { store } from '../store/store';
import TimePicker from './TimePicker';
import TimestampModal from './TimestampModal';
import TimezoneSearch from './TimezoneSearch';

export type TimePickerType = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

type navbarProps = {
  title: string;
  searchBar?: boolean;
  timePicker?: boolean;
}

/**
 * @description - Navbar component with local time and timezone search
 */
const Navbar = ({ title, searchBar, timePicker }: navbarProps) => {
  // get current time to state
  const [selected, setSelected] = useState<Timezones | null>(null);
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, store.getState().storedata.dateFormat),
  );

  const now = new Date();
  const [dateString, setDateString] = useState({
    year: now.getFullYear().toString(),
    month: (now.getMonth()).toString(),
    day: now.getDate().toString(),
    hour: now.getHours().toString(),
    minute: now.getMinutes().toString(),
    second: now.getSeconds().toString(),
  } as TimePickerType);

  // set interval to update time
  useEffect(() => {
    timePicker
      && store.dispatch(
        {
          type: 'timewas/data',
          payload: `${dateString.day} ${new Date(Number.parseInt(dateString.year),
            Number.parseInt(dateString.month), 1).toLocaleString('default', { month: 'long' })} 
            ${dateString.year}, ${dateString.hour}:${dateString.minute}:${dateString.second}`
        }
      );

    const interval = setInterval(() => {
      setCurrentTime(
        searchBar
          ? getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, store.getState().storedata.dateFormat)
          : getParsedTime(Intl.DateTimeFormat().resolvedOptions().timeZone),
      );
    }, searchBar ? 100 : 1000);
    return () => clearInterval(interval);
  }, [dateString, searchBar, timePicker]);

  return (
    <>
      <div
        className='h-1/2 lg:h-96 text-center curve shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] bg-gradient-to-br 
           from-cyan-800 to-slate-900 text-slate-300
          sm:shadow-[0px_50px_50px_-15px_rgba(0,0,0,0.6)]'>
        <div className="grid lg:grid-cols-2">
          <div className='p-2 lg:p-8 mt-2 lg:mt-10'>
            <Link href={searchBar ? '/TimeWas' : '/'}>
              <a className='text-4xl font-nova-flat md:text-6xl pb-2 animate-pulse hover:text-teal-500'>
                {title}
              </a>
            </Link>
            {
              searchBar && (
                <div className='mt-5 md:mt-20 font-nova-flat text-slate-300'>
                  <p className='text-teal-500 text-lg'>
                    {`Local Time in  ${Intl.DateTimeFormat().resolvedOptions().timeZone} :`}
                  </p>
                  <p className='mt-3 text-xl truncate md:text-3xl list-outside hover:text-teal-300'
                    onClick={() => setSelected(timezoneList.filter(tz => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone)[0] as Timezones)}
                  >
                    {currentTime}
                  </p>
                </div>)
            }

            {
              timePicker && (
                <div className='mt-5 md:mt-20 font-nova-flat text-slate-300'>
                  <p className='text-teal-500 text-lg'>
                    {`Local Time in  ${Intl.DateTimeFormat().resolvedOptions().timeZone} :`}
                  </p>
                  <p className='mt-3 text-xl truncate md:text-3xl list-outside hover:text-teal-300'
                    onClick={() => setSelected(timezoneList.filter(tz => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone)[0] as Timezones)}
                  >
                    {currentTime}
                  </p>
                </div>)
            }

          </div>
          <div className={`p-2 ${searchBar ? 'lg:p-10' : 'lg:p-2'} md:z-10`}>
            {timePicker && <TimePicker now={now} dateString={dateString} setDateString={setDateString} />}
            {<TimezoneSearch />}
          </div>
        </div>
      </div>

      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </>
  );
};

export default Navbar;

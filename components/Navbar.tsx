import Link from 'next/link';
import { useEffect, useState } from 'react';

import getCurrentTime, { Timezones } from '../functions/timeNow';
import { timezoneList } from '../pages/api/timezones';
import { store } from '../store/store';
import TimestampModal from './TimestampModal';
import TimezoneSearch from './TimezoneSearch';

/**
 * @description - Navbar component with local time and timezone search
 * @param {Props} props
 */
const Navbar = () => {
  // get current time to state
  const [selected, setSelected] = useState<Timezones | null>(null);
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, store.getState().storedata.dateFormat),
  );

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, store.getState().storedata.dateFormat),
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div
        className='h-1/2 lg:h-96 text-center lg:text-left curve shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] bg-gradient-to-br 
           from-cyan-800 to-slate-900 text-slate-300
          sm:shadow-[0px_50px_50px_-15px_rgba(0,0,0,0.6)]'>
        <div className="grid lg:grid-cols-2">
          <div className='p-2 lg:p-8 mt-2 lg:mt-10'>
            <Link href={"/"}>
              <a className='text-4xl font-nova-flat md:text-6xl pb-2 animate-pulse hover:text-teal-500'>
                And the time is ...
              </a>
            </Link>
            <div className='mt-5 md:mt-20 font-nova-flat text-slate-300'>
              <p className='text-teal-500 text-lg'>
                {`Local Time in  ${Intl.DateTimeFormat().resolvedOptions().timeZone} :`}
              </p>
              <p className='mt-3 text-xl truncate md:text-3xl list-outside hover:text-teal-300'
                onClick={() => setSelected(timezoneList.filter(tz => tz.name === Intl.DateTimeFormat().resolvedOptions().timeZone)[0] as Timezones)}
              >
                {currentTime}
              </p>
            </div>
          </div>
          <div className='p-2 lg:p-10 mt-0 md:mt-10 md:z-10'>
            <TimezoneSearch />
          </div>
        </div>
      </div>

      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </>
  );
};

export default Navbar;

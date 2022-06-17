import Link from "next/link";
import Image from 'next/image';
import { useEffect, useState } from "react";
import getCurrentTime from "../functions/timeNow";
import TimezoneSearch from "./TimezoneSearch";

type Props = {
  children: React.ReactNode;
};

/**
 * Navbar component
 * @description
 * This component is used to render the navbar
 *
 * @param {Props} props
 */
const Navbar = ({ children }: Props) => {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone),
  );

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone),
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
              <a className='text-5xl truncate font-nova-flat md:text-6xl pb-5 hover:text-teal-500'>
                And the time is ...
              </a>
            </Link>
            <div className='mt-20 font-nova-flat text-slate-300'>
              <p className='text-teal-500 text-lg'>{`Local Time in  ${Intl.DateTimeFormat().resolvedOptions().timeZone} :`}</p>
              <p className='mt-3 text-xl truncate md:text-3xl list-outside hover:text-teal-300'>{currentTime}</p>
            </div>
          </div>
          <div className='p-2 lg:p-10 mt-2 lg:mt-10'>
            {/* search bar for timezones */}
            <TimezoneSearch />
          </div>
        </div>
      </div>

      <div className="p-10">{children}</div>
    </>
  );
};

export default Navbar;

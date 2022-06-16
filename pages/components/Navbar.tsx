import Link from "next/link";
import { useEffect, useState } from "react";
import getCurrentTime from "../functions/timeNow";

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
        className='h-1/2 shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] bg-gradient-to-br 
           from-cyan-900 to-slate-800 text-slate-300
          sm:shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.4)]'>
        <div className="flex">
          <div className='p-10 mt-10'>
            <Link href={"/"}>
              <a className='text-4xl font-nova-flat sm:text-6xl pb-5 hover:text-slate-400'>
                And the time is ...
              </a>
            </Link>
            <div className='mt-20 font-nova-flat text-slate-300'>
              <p className='text-teal-500 text-xl'>{`Local Time in  ${Intl.DateTimeFormat().resolvedOptions().timeZone} :`}</p>
              <p className='mt-3 text-2xl sm:text-3xl'>{currentTime}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-10">{children}</div>
    </>
  );
};

export default Navbar;

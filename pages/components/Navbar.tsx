import Link from "next/link";
import { useEffect, useState } from "react";
import getCurrentTime from "../repository/timeNow";

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
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='bg-slate-200'>
      <div
        className='h-64 shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] bg-gradient-to-br 
          text-center from-cyan-900 to-slate-800 text-slate-300
          sm:shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.4)]'>
        <div className='flex flex-col pt-5'>
          <Link href={"/"}>
            <a className='text-4xl font-nova-flat sm:text-6xl pb-5 border-b-2 border-slate-400 hover:text-slate-400'>
              And the time is ...
            </a>
          </Link>
        </div>
        <div className='mt-14 font-nova-flat text-slate-300'>
          <span className='text-teal-500 text-xl'>{"Local Time: "}</span>
          <span className='text-2xl sm:text-5xl'>{currentTime}</span>
        </div>
      </div>

      <div className='container p-6 sm:p-10'>{children}</div>
    </div>
  );
};

export default Navbar;

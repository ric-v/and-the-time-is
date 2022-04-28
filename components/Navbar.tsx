import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * @description
 * get current time in YYYY-MM-DD HH:mm:ss.SSS format
 *
 * @returns {string}
 */
const getCurrentTime = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // get hours and pad with 0 if less than 10
  const hours = date.getHours();
  const hoursFormatted = hours < 10 ? `0${hours}` : hours;

  // get minutes and pad with 0 if less than 10
  const minutes = date.getMinutes();
  const minutesFormatted = minutes < 10 ? `0${minutes}` : minutes;

  // get seconds and pad with 0 if less than 10
  const seconds = date.getSeconds();
  const secondsFormatted = seconds < 10 ? `0${seconds}` : seconds;

  return `${year}-${month}-${day} ${hoursFormatted}:${minutesFormatted}:${secondsFormatted} `;
};

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
  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='h-full'>
      <div
        className='h-96 shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] bg-gradient-to-br 
          text-center from-cyan-900 to-slate-800 text-slate-300
          sm:shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.4)]'>
        <Link href={"/"}>
          <a className='text-4xl font-nova-flat sm:text-6xl border-b-2 border-slate-400'>
            And the time is ...
          </a>
        </Link>
        <div className='text-5xl mt-14 font-nova-flat text-slate-300'>
          {currentTime}
        </div>
      </div>

      <div className='container p-10'>{children}</div>
    </div>
  );
};

export default Navbar;

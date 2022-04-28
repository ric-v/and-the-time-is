import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { timezoneList } from "../api/timezones";
import getCurrentTime from "../functions/timeNow";

const TimeAtTimezone = () => {
  const router = useRouter();
  const { timezone } = router.query as { timezone: string };

  // get the name of timezone from timezone list
  const location = timezoneList.reduce((acc, item) => {
    if (item.code === timezone) {
      return item.name;
    }
    return acc;
  }, "");

  // get current time to state
  const [currentTime, setCurrentTime] = useState(getCurrentTime(timezone));

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className='container mx-auto'>
      <div className='flex flex-col items-center'>
        <div className='grid grid-flow-col-dense grid-cols-1 sm:grid-cols-1'>
          <div className='mt-14 font-nova-flat text-slate-600'>
            <span>Time at </span>
            <span className='text-teal-500 text-xl'>{`${location} (${timezone}) : `}</span>
            <span className='text-2xl sm:text-5xl'>{currentTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeAtTimezone;

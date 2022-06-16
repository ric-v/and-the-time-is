import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { timezoneList } from "../../api/timezones";
import getCurrentTime from "../../functions/timeNow";

const TimeAtTimezone = () => {
  const router = useRouter();
  const { continent, timezone } = router.query as {
    continent: string;
    timezone: string;
  };

  // get the name of timezone from timezone list
  const location = timezoneList.reduce((acc, item) => {
    if (item.name === `${continent}/${timezone}`) {
      return item.name;
    }
    return acc;
  }, "");

  // get current time to state
  const [currentTime, setCurrentTime] = useState(getCurrentTime(location));

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(location));
    }, 100);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <div className='container mx-auto'>
      <div className='flex flex-col items-center'>
        <div className='grid grid-flow-col-dense grid-cols-1 sm:grid-cols-1'>
          <div className='mt-14 font-nova-flat text-slate-600'>
            <span>Time at </span>
            <span className='text-teal-500 text-xl'>{`${location} : `}</span>
            <span className='text-2xl sm:text-5xl'>{currentTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeAtTimezone;

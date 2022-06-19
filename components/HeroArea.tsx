import React from 'react'
import { useEffect, useState } from 'react';
import { Timezones } from '../functions/timeNow';
import { store } from '../store/store';
import TzCard from './TzCard';

const HeroArea = () => {

  const [timezones, setTimezones] = useState([] as Timezones[]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimezones(
        store.getState().timezones,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className='text-red-600 font-semibold'>
        *Disclaimer: This is a demo app. Timezones and timestamps displayed here are not accurate yet. This is still work in progress.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 p-2 md:p-5 w-full gap-6">
        {
          timezones.map((tz) => (
            <TzCard key={tz.name} tz={tz} />
          ))
        }
      </div>
    </>
  )
};

export default HeroArea;

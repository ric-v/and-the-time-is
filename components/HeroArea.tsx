import React from 'react'
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Timezones } from '../functions/timeNow';
import { store } from '../store/store';
import Card from './Card';

const HeroArea = () => {

  // get timezones from local storage
  const [timezones, setTimezones] = useState<Timezones[]>();

  useEffect(() => {

    // get timezones from local storage
    const tzs = JSON.parse(localStorage.getItem("timezones") || "[]") as Timezones[];
    if (tzs) {
      // add to store
      tzs.forEach((tz) => {
        store.dispatch({ type: "timezone/add", payload: tz });
      });
    }

    const interval = setInterval(() => {
      setTimezones(
        store.getState().timezones,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 p-2 md:p-5 w-full gap-6">
        {
          timezones?.map((tzData) => (
            <Card key={tzData.name} tzData={tzData} />
          ))
        }
      </div>
      <div className='text-center mt-10'>
        <div className='text-red-800 font-semibold text-sm lg:text-md'>
          *Disclaimer: This is a demo app. Timezones and timestamps displayed here are not accurate yet. This is still work in progress.
        </div>
        <div className='text-teal-500 font-bold'>
          source: <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones">Wikipedia tz database</a>
        </div>
      </div>
    </>
  )
};

export default HeroArea;

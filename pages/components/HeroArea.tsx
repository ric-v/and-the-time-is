import React from 'react'
import { useEffect, useState } from 'react';
import { Timezones } from '../functions/timeNow';
import { store } from '../store/store';

type Props = {}

const HeroArea = (props: Props) => {

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 p-2 md:p-5 w-full gap-6">
      {
        timezones.map((tz) => (
          <div key={tz.name} className=" shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] bg-gradient-to-br 
              from-cyan-600 to-slate-800 rounded-lg p-4">
            <div className="flex flex-row justify-between text-sm font-medium">
              <h3 className="text-xl leading-6 font-medium text-teal-100" id="modal-title"> {tz.name}</h3>
              <button onClick={() => store.dispatch({ type: 'timezone/remove', payload: tz })}>
                <svg className="h-6 w-6 text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mt-3 text-gray-200">
              {tz.city}
            </div>
            <div className="mt-3 text-gray-200">
              {tz.currentTime || 'coming soon...'}
            </div>
          </div>
        ))
      }
    </div>
  )
}

export default HeroArea
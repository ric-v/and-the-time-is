import React from 'react'
import { HiViewGrid } from 'react-icons/hi';
import { BsGrid3X2GapFill } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { Timezones } from '../functions/timeNow';
import { store } from '../store/store';
import Card from './Card';
import ListView from './ListView';
import ButtonGroup from './ButtonGroup';

/**
 * Main - Main component for the app
 */
const Main = () => {

  // get timezones from local storage
  const [timezones, setTimezones] = useState<Timezones[]>();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [formatPickerSelected, setFormatPickerSelected] = useState(false);
  const [formatPicker, setFormatPicker] = useState<string>('');

  // use effect to get timezones from local storage and layout from local storage
  // check for update from redux store
  useEffect(() => {
    // get layout from localstorage
    const layoutLocal = localStorage.getItem('layout') as 'grid' | 'list';
    setLayout(layoutLocal ? layoutLocal : 'grid');

    // get timezones from local storage
    const tzs = JSON.parse(localStorage.getItem("timezones") || "[]") as Timezones[];
    if (tzs) {
      // add to store
      tzs.forEach((tz) => {
        store.dispatch({ type: "timezone/add", payload: tz });
      });
    }

    // start interval to get updated timezone list
    const interval = setInterval(() => {
      setTimezones(
        store.getState().timezones,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex flex-row-reverse pr-5">
        <ButtonGroup layout={layout} setLayout={setLayout} toLayout={'list'} position='left' >
          <HiViewGrid size={22} color={layout === 'list' ? 'gray' : 'white'} />
        </ButtonGroup>
        <ButtonGroup layout={layout} setLayout={setLayout} toLayout={'grid'} position='right' >
          <BsGrid3X2GapFill size={22} color={layout === 'grid' ? 'gray' : 'white'} />
        </ButtonGroup>
        {/* <div className='mx-4'>
          <select className='w-auto md:w-96 h-10 rounded-lg px-2 drop-shadow-lg text-lg bg-transparent border border-gray-500 duration-300 
          hover:bg-slate-800 focus:bg-slate-800 focus:ring-2 focus:ring-slate-600 text-gray-300' >
            <option value="">Select a date-time format...</option>
            <option value={'mmm dd yyyy hh:MM:ss Z (z)'}>mmm dd yyyy hh:MM:ss Z (z)</option>
            <option value={'mm/dd/yyyy hh:MM:ss Z'}>mm/dd/yyyy hh:MM:ss Z</option>
          </select>
        </div> */}
      </div>

      {
        layout === 'grid' ?
          (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 p-2 md:p-5 w-full gap-6">
              {
                timezones?.map((tzData) => (
                  <Card key={tzData.name} tzData={tzData} />
                ))
              }
            </div>
          </>) :
          (<>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-3">
              {
                timezones?.map((tzData) => (
                  <ListView key={tzData.name} tzData={tzData} />
                ))
              }
            </div>
          </>)
      };
    </>
  )
};

export default Main;


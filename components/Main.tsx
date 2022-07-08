import React, { useEffect, useState } from 'react';
import { BsGrid3X2GapFill } from 'react-icons/bs';
import { HiViewGrid } from 'react-icons/hi';

import { Timezones } from '../functions/timeNow';
import { store } from '../store/store';
import ButtonGroup from './ButtonGroup';
import Card from './Card';
import DateFormatModal from './DateFormatModal';
import ListView from './ListView';

/**
 * @description - main component for the app
 */
const Main = () => {

  // get timezones from local storage
  const [timezones, setTimezones] = useState<Timezones[]>([]);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [formatPickerSelected, setFormatPickerSelected] = useState(false);

  // use effect to get timezones from local storage and layout from local storage
  // check for update from redux store
  useEffect(() => {
    // get layout from localstorage
    const layoutLocal = localStorage.getItem('layout') as 'grid' | 'list';
    setLayout(layoutLocal ? layoutLocal : 'grid');

    // fetch date format stored in localstorage
    const dateFormatLocal = localStorage.getItem('dateFormat') as string;
    if (dateFormatLocal) {
      store.dispatch({ type: "dateformat/update", payload: dateFormatLocal });
    }

    // get timezones from local storage
    const tzs = JSON.parse(localStorage.getItem("timezones") || "[]") as Timezones[];
    if (tzs) {
      // add to store
      tzs.forEach((tz) => {
        store.dispatch({ type: "timezone/add", payload: { timezone: tz, dateFormat: '' } });
      });
    }

    // start interval to get updated timezone list
    const interval = setInterval(() => {
      setTimezones(
        store.getState().storedata.timezones,
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="flex flex-row-reverse pr-5 mt-5">
        <ButtonGroup layout={layout} setLayout={setLayout} toLayout={'list'} position='right' >
          <HiViewGrid size={22} color={layout === 'list' ? 'gray' : 'white'} />
        </ButtonGroup>
        <ButtonGroup layout={layout} setLayout={setLayout} toLayout={'grid'} position='left' >
          <BsGrid3X2GapFill size={22} color={layout === 'grid' ? 'gray' : 'white'} />
        </ButtonGroup>

        <div className='mx-4'>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent 
                    shadow-sm px-4 py-2 bg-teal-600 font-medium text-clip text-white hover:bg-teal-700 
                    focus:outline-none sm:ml-3"
            onClick={() => {
              setFormatPickerSelected(true);
            }}
          >
            Change date format
          </button>

        </div>
      </div>

      {
        layout === 'grid' ?

          // if layout is grid
          (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 p-2 md:p-5 w-full gap-6">
              {
                timezones && timezones.map((tzData) => (
                  <Card key={tzData.name} tzData={tzData} />
                ))
              }
            </div>
          </>) :

          // if layout is list
          (<>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-3">
              {
                timezones && timezones.map((tzData) => (
                  <ListView key={tzData.name} tzData={tzData} />
                ))
              }
            </div>
          </>)
      };

      {formatPickerSelected && <DateFormatModal setFormatPickerSelected={setFormatPickerSelected} />}
    </>
  )
};

export default Main;


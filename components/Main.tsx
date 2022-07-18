import React, { useEffect, useState } from 'react';
import { BsGrid3X2GapFill } from 'react-icons/bs';
import { HiViewGrid } from 'react-icons/hi';

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Timezones } from '../pages/api/functions/timeNow';
import { store } from '../store/store';
import ButtonGroup from './ui-elements/ButtonGroup';
import Card from './ui-elements/Card';
import DateFormatModal from './DateFormatModal';

type mainProps = {
  page: string;
}

/**
 * @description - main component for the app
 */
const Main = ({ page }: mainProps) => {

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
      <div className='flex flex-col justify-between min-h-full min-w-full bg-gradient-to-br from-slate-700 to-slate-900'>
        <div>
          <Navbar
            title={`And the time ${page === 'timeis' ? 'is' : 'was'}...`}
            searchBar={page === 'timeis'}
            timePicker={page === 'timewas'}
          />
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
                className="w-full inline-flex justify-center rounded-md border-t border-l border-gray-600
                    px-4 py-2 bg-teal-600 font-medium text-clip text-white hover:bg-teal-700 
                    focus:outline-none sm:ml-3 transition ease-in-out duration-1000 
                    shadow-[10px_10px_20px_-5px_rgba(0,0,0,0.53)]"
                data-bs-toggle="timestampmodal"
                data-bs-target="#timestampmodal"
                onClick={() => {
                  setFormatPickerSelected(true);
                }}
              >
                Change date format
              </button>

            </div>
          </div>
          <div className={layout === 'list' ? `grid grid-cols-1 lg:grid-cols-2 gap-2 p-3` : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 p-2 md:p-5 w-full gap-3`}>
            {
              timezones && timezones.map((tzData) => (
                <Card key={tzData.name} tzData={tzData} page={page} />
              ))
            }
          </div>
          {formatPickerSelected && <DateFormatModal setFormatPickerSelected={setFormatPickerSelected} />}
        </div>
        <Footer hidden={page === 'timeis' ? "/" : '/TimeWas'} />
      </div>
    </>
  )
};

export default Main;


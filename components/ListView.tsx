import React, { useEffect, useState } from 'react';
import { RiCloseFill } from 'react-icons/ri';

import { getCurrentTime, getParsedTime, Timezones } from '../pages/api/functions/timeNow';
import { store } from '../store/store';
import TimestampModal from './TimestampModal';

/**
 * @interface Props
 * @property {string} tzData - timezone to display
 */
type Props = {
  tzData: Timezones;
  page: string;
};

/**
 * @description component for showing bigger cards
 * @param {Props} props
 */
const ListView = ({ tzData, page }: Props) => {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(
    page === 'timeis'
      ? getCurrentTime(tzData.name, store.getState().storedata.dateFormat)
      : getParsedTime(tzData.name)
  );
  const [selected, setSelected] = React.useState<Timezones | null>(null);

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        page === 'timewas' ? getParsedTime(tzData.name) : getCurrentTime(tzData.name, store.getState().storedata.dateFormat),
      );
    }, page === 'timewas' ? 1000 : 100);
    return () => clearInterval(interval);
  }, [page, tzData.name]);

  return (
    <div className="flex flex-row justify-between border border-slate-700 shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)]
    bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4"
      key={tzData.name}
    >
      <div>
        <div className="flex flex-row justify-between text-sm font-medium">
          <h3
            className="text-sm leading-0 font-medium truncate text-teal-600 cursor-pointer"
            id="modal-title"
            onClick={() => { setSelected(tzData) }}
          >
            {tzData.city} - {tzData.country}
          </h3>
        </div>

        <div className="mt-3 text-gray-200 text-lg truncate md:text-2xl font-semibold cursor-pointer"
          onClick={() => setSelected(tzData)}
        >
          {currentTime}
        </div>
      </div>
      <div>
        <button
          onClick={() =>
            store.dispatch({ type: "timezone/remove", payload: { timezone: tzData, dateFormat: '' } })
          }
        >
          <RiCloseFill size={24} color='gray' />
        </button>
      </div>
      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default ListView;

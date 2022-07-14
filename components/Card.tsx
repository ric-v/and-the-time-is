import { useEffect, useState } from 'react';
import { RiCloseFill } from 'react-icons/ri';
import tz from 'timezone/loaded';

import getCurrentTime, { Timezones } from '../functions/timeNow';
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
 * @description Card component for the app to display timezone data in small cards
 * @param {Props} props
 * @returns 
 */
const Card = ({ tzData, page }: Props) => {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(page === 'timeis' ? getCurrentTime(tzData.name, store.getState().storedata.dateFormat) : tz(
    new Date(store.getState().storedata.timewasData),
    store.getState().storedata.dateFormat,
    tzData.name,
  ));
  const [selected, setSelected] = useState<Timezones | null>(null);

  // set interval to update time
  // eslint-disable-next-line react-hooks/rules-of-hooks
  page === 'timeis' && useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(tzData.name, store.getState().storedata.dateFormat));
    }, 100);
    return () => clearInterval(interval);
  }, [tzData.name]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  page === 'timewas' && useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(tz(
        new Date(store.getState().storedata.timewasData),
        store.getState().storedata.dateFormat,
        tzData.name,
      ));
    }, 1000);
    return () => clearInterval(interval);
  }, [tzData.name]);

  return (
    <div className="flex flex-row justify-between border border-slate-700 shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)]
    bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4"
      key={tzData.name}
    >
      <div>
        <div className="flex flex-row justify-between text-sm font-medium">
          <h3
            className="text-lg leading-6 font-medium truncate text-teal-600 cursor-pointer"
            id="modal-title"
            onClick={() => { setSelected(tzData) }}
          >
            {" "}
            {tzData.city} - {tzData.country}
          </h3>
        </div>
        <div className="mt-3 text-gray-500 text-xs truncate cursor-pointer"
          onClick={() => setSelected(tzData)}
        >
          {tzData.name}
        </div>
        <div className="mt-3 text-gray-200 text-lg truncate font-semibold cursor-pointer"
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

export default Card;

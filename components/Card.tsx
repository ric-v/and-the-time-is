import { useEffect, useState } from 'react';
import { RiCloseFill } from 'react-icons/ri';

import getCurrentTime, { Timezones } from '../functions/timeNow';
import { store } from '../store/store';
import Modal from './Modal';

/**
 * @interface Props
 * @property {string} tzData - timezone to display
 */
type Props = {
  tzData: Timezones;
};

/**
 * @description Card component for the app to display timezone data in small cards
 * @param {Props} props
 * @returns 
 */
const Card = ({ tzData }: Props) => {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(getCurrentTime(tzData.name));
  const [selected, setSelected] = useState<Timezones | null>(null);

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(tzData.name));
    }, 100);
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
            className="text-lg leading-6 font-medium text-teal-600 cursor-pointer"
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
        <div className="mt-3 text-gray-200 text-lg font-semibold cursor-pointer"
          onClick={() => setSelected(tzData)}
        >
          {currentTime}
        </div>
      </div>
      <div>
        <button
          onClick={() =>
            store.dispatch({ type: "timezone/remove", payload: tzData })
          }
        >
          <RiCloseFill size={24} color='gray' />
        </button>
      </div>
      {selected && <Modal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default Card;

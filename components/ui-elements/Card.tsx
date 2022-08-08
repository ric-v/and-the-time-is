import { ChangeEvent, useEffect, useState } from 'react';
import { RiCloseFill } from 'react-icons/ri';
import { FiEdit } from 'react-icons/fi';
import { VscClose } from 'react-icons/vsc';
import { CgUndo } from 'react-icons/cg';

import { getCurrentTime, getParsedTime, Timezones } from '../../pages/api/functions/timeNow';
import { store } from '../../store/store';
import TimestampModal from '../TimestampModal';

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
 */
const Card = ({ tzData, page }: Props) => {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(
    page === 'timeis'
      ? getCurrentTime(tzData.name, store.getState().storedata.dateFormat)
      : getParsedTime(tzData.name)
  );
  const [selected, setSelected] = useState<Timezones | null>(null);
  const [customName, setCustomName] = useState(tzData.customname ? tzData.customname : tzData.name);
  const [editable, setEditable] = useState(false);

  // handle card title change
  const handleCardTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    const updatedTz = { ...tzData, customname: e.target.value };

    // update store
    // sleep for 0.1s to allow for input to be updated
    setTimeout(() => {
      store.dispatch({ type: "timezone/update", payload: { timezone: updatedTz, dateFormat: '' } });
    }, 500);
  }

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
    <div className='flex flex-row justify-between bg-gradient-to-br from-slate-800 to-slate-900 
        border border-slate-600 border-dashed shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)] rounded-lg p-4'
      key={tzData.name}>
      <div>
        <div className="flex flex-row justify-start text-sm font-medium">
          <h3
            className="text-lg leading-6 font-medium truncate text-teal-600 cursor-pointer"
            id="modal-title"
            onClick={() => {
              if (!editable) {
                setSelected(tzData)
              }
            }}
          >
            <input
              type="text"
              name="card-name"
              id="card-name"
              disabled={!editable}
              className={`appearance-none bg-transparent p-1 rounded-lg ${editable ? 'border-b border-teal-600 border-dashed' : 'cursor-pointer'}
                focus:outline-none transition ease-in-out duration-1000`}
              value={customName}
              onChange={(e) => { handleCardTitleChange(e) }}
              onBlur={() => { setEditable(false) }}
            />
          </h3>
          {
            editable ? (
              <VscClose
                size={22}
                className='text-gray-600 cursor-pointer'
                onClick={() => { setEditable(false) }}
              />
            ) : (
              <FiEdit
                size={18}
                className='text-gray-600 cursor-pointer'
                onClick={() => { setEditable(true) }}
              />
            )
          }
          {
            !editable && tzData.customname && (
              <CgUndo
                size={18}
                className='text-gray-600 cursor-pointer ml-2'
                onClick={() => {
                  setCustomName(tzData.name);
                  const updatedTz = { ...tzData, customname: null };
                  store.dispatch({ type: "timezone/update", payload: { timezone: updatedTz, dateFormat: '' } });
                }}
              />
            )
          }
        </div>

        <div className="mt-3 text-gray-200 text-lg truncate font-semibold leading-tight cursor-pointer"
          onClick={() => setSelected(tzData)}
        >
          {currentTime}
        </div>
      </div>
      <div className='flex flex-col items-center justify-center p-2 border-l border-t border-slate-700 cursor-pointer border-dashed
      rounded-lg text-gray-600 transition duration-500 ease-in-out hover:bg-pink-900 hover:text-white  shadow-[0px_10px_20px_-5px_rgba(0,0,0,0.33)]'
        onClick={() =>
          store.dispatch({ type: "timezone/remove", payload: { timezone: tzData, dateFormat: '' } })
        }
      >
        <RiCloseFill size={24} />
      </div>
      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default Card;

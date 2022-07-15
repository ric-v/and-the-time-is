import React, { useEffect, useState } from 'react';

import ModalButton from './modal/ModalButton';
import { getCurrentTime, Timezones } from '../pages/api/functions/timeNow';
import { store } from '../store/store';
import ModalBase from './modal/ModalBase';
import TableRow from './ui-elements/TableRow';

/**
 * @interface Props
 * @property {Timezones} timezone
 * @property {(timezone: Timezones | null) => void} setSelected
 */
type Props = {
  timezone: Timezones,
  setSelected: (timezone: Timezones | null) => void,
}

/**
 * @description - modal window for selected timezone details
 * @param {Props} props
 */
function TimestampModal({ timezone, setSelected }: Props) {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, store.getState().storedata.dateFormat),
  );

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        getCurrentTime(timezone.name, store.getState().storedata.dateFormat),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [timezone.name]);

  // check if the timezone is added to homescreen via store
  const isAdded = store.getState().storedata.timezones.find(
    (tz) => tz.name === timezone.name,
  );

  return (
    <ModalBase body={
      <>
        <h3 className="text-xl leading-6 font-medium text-teal-500" id="modal-title"> 📌 {timezone.name}</h3>

        {/* table with timezone details */}
        <table className="table-responsive w-full mt-5">
          <tbody>
            <TableRow col1='Timezone' col2=':' col3={timezone.name} />
            <TableRow col1='City' col2=':' col3={timezone.city} />
            <TableRow col1='Country' col2=':' col3={timezone.country} />
            <TableRow col1='Abbreviation' col2=':' col3={getCurrentTime(timezone.name, "%Z")} />
            <TableRow col1='UTC Offset' col2=':' col3={getCurrentTime(timezone.name, "%z")} />
            <TableRow col1='Current Time' col2=':' col3={currentTime} classes='text-teal-500' />
          </tbody>
        </table>
      </>
    }
      actionBar={
        <div className="bg-slate-700 px-4 py-3 sm:px-6 flex flex-row justify-end">
          {/* display add to home button only if its not added already */}
          {!isAdded &&
            <ModalButton text='Add to Home' close={false} handleClick={
              () => {
                store.dispatch({ type: "timezone/add", payload: { timezone: timezone, dateFormat: '' } });
                setSelected(null);
              }
            } />
          }
          <ModalButton text='Close' close={true} handleClick={
            () => {
              setSelected(null);
            }
          } />
        </div>
      }
    />
  )
}

export default TimestampModal

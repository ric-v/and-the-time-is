import React, { useEffect, useState } from 'react';

import getCurrentTime, { Timezones } from '../functions/timeNow';
import { store } from '../store/store';

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
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true"
      id="timestampmodal" tab-index="-1" aria-hidden="true">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>

      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
          <div className="relative bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
            <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-xl leading-6 font-medium text-teal-500" id="modal-title"> 📌 {timezone.name}</h3>
                  <div className="mt-5">

                    {/* table with timezone details */}
                    <div className="table-responsive">
                      <table className="table-auto w-full">
                        <tbody>
                          <tr>
                            <td className="text-left text-sm leading-5 text-gray-300">
                              Country (code)
                            </td>
                            <td className="text-center text-sm font-medium text-gray-300">
                              :
                            </td>
                            <td className="text-left text-sm leading-5 font-bold text-gray-300">
                              {timezone.country} ({timezone.code})
                            </td>
                          </tr>
                          <tr>
                            <td className="text-left text-sm leading-5 text-gray-300">
                              City
                            </td>
                            <td className="text-center text-sm font-medium text-gray-300">
                              :
                            </td>
                            <td className="text-left text-sm leading-5 font-bold text-gray-300">
                              {timezone.city}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-left text-sm leading-5 text-gray-300">
                              Abbreviation
                            </td>
                            <td className="text-center text-sm font-medium text-gray-300">
                              :
                            </td>
                            <td className="text-left text-sm leading-5 font-bold text-gray-300">
                              {getCurrentTime(timezone.name, "%Z")}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-left text-sm leading-5 text-gray-300">
                              Offset
                            </td>
                            <td className="text-center text-sm font-medium text-gray-300">
                              :
                            </td>
                            <td className="text-left text-sm leading-5 font-bold text-gray-300">
                              {getCurrentTime(timezone.name, "%:z")}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-left text-sm leading-5 text-gray-300">
                              Current time
                            </td>
                            <td className="text-center text-sm font-medium text-gray-300">
                              :
                            </td>
                            <td className="text-left text-sm leading-5 font-bold text-teal-500">
                              {currentTime}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 px-4 py-3 sm:px-6 flex flex-row justify-end">

              {/* display add to home button only if its not added already */}
              {!isAdded &&
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent 
                    shadow-sm px-4 py-2 bg-teal-600 font-medium text-clip text-white hover:bg-teal-700 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3"
                  onClick={() => {
                    store.dispatch({ type: "timezone/add", payload: { timezone: timezone, dateFormat: '' } });
                    setSelected(null);
                  }}
                >
                  Pin to dashboard
                </button>
              }

              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 
                  shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 
                  hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 
                  focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm
                  transition duration-1000 ease-in-out"
                data-bs-dismiss="timestampmodal"
                onClick={() => {
                  setSelected(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default TimestampModal

import { useEffect, useState } from 'react';

import getCurrentTime from '../functions/timeNow';
import { BiReset } from 'react-icons/bi';
import { store } from '../store/store';

/**
 * @interface Props
 * @property {Timezones} timezone
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setSelected
 */
type Props = {
  setFormatPickerSelected: React.Dispatch<React.SetStateAction<boolean>>,
}

/**
 * @description - modal window for selected timezone details
 * @param {Props} props
 */
function DateFormatModal({ setFormatPickerSelected }: Props) {
  const defFormatString = "b d Y H:M:S Z (z)";
  const [formattedTime, setFormattedTime] = useState(getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, store.getState().storedata.dateFormat));
  const [expandInstruction, setExpandInstruction] = useState(false);
  const [formatString, setFormatString] = useState(
    store.getState().storedata.dateFormat.
      replaceAll(/%:/g, "").
      replaceAll(/%/g, "")
  );

  // date formaters for instruction table
  const dateformaters = [
    { display: 'B', format: '%B', description: 'full month name', example: 'January, March' },
    { display: 'b', format: '%b', description: 'short month name', example: 'Jan, Mar' },
    { display: 'd', format: '%d', description: 'day of month', example: '01, 31' },
    { display: 'j', format: '%j', description: 'day of year', example: '001, 365' },
    { display: 'm', format: '%m', description: 'month', example: '01, 12' },
    { display: 'y', format: '%y', description: 'year', example: '00, 99' },
    { display: 'Y', format: '%Y', description: 'full year', example: '2000, 2020' },
    { display: 'H', format: '%H', description: 'hour', example: '00, 23' },
    { display: 'I', format: '%I', description: 'hour (12-hour clock)', example: '01, 12' },
    { display: 'M', format: '%M', description: 'minute', example: '00, 59' },
    { display: 'S', format: '%S', description: 'second', example: '00, 59' },
    { display: 'p', format: '%p', description: 'AM/PM', example: 'AM, PM' },
    { display: 'Z', format: '%Z', description: 'timezone', example: 'UTC, EST' },
    { display: 'z', format: '%:z', description: 'timezone', example: '+00:00, -05:00' },
    { display: 'A', format: '%A', description: 'full weekday name', example: 'Monday, Sunday' },
    { display: 'a', format: '%a', description: 'short weekday name', example: 'Mon, Sun' },
    { display: 'W', format: '%W', description: 'week of year', example: '00, 53' },
  ]

  /**
   * @description - table row generator for date format instructions
   * @param heading - heading of table row
   */
  const generateTH = (heading: string) => (
    <th>
      <td className="text-left text-sm text-gray-300">
        <p className='text-gray-500 text-sm'><b>{heading}</b></p>
      </td>
    </th>
  )

  /**
   * @description - table row generator for date format instructions
   * @param format - format of the date
   * @param desc - description of the format
   * @param example - example of the format
   */
  const generateTR = (format: string, desc: string, example: string) => (
    <tr>
      <td className="text-left text-sm text-gray-300 px-2">
        <b>{format}</b>
      </td>
      <td className="text-left text-sm text-gray-400 px-2">
        {desc}
      </td>
      <td className="text-left text-sm text-gray-400 px-2">
        <i>{example}</i>
      </td>
    </tr>
  )

  // generate date format basedon the timeformatters
  const generateDateFormat = (formatString: string) => {

    let formatInput = formatString;
    // replace each character with % character
    formatInput.split('').forEach((char) => {
      if (![' ', '-', ':', '.', '/', '\\', '\'', '"', '(', ')', '[', ']', '{', '}', ';', '?', '>',
        '<', '*', '&', '^', '%', '$', '#', '@', '!', '~', '`'].includes(char)) {

        // find the format for this display from dateformaters
        const format = dateformaters.find((formatter) => formatter.display === char)?.format as string;
        formatInput = formatInput.replace(char, format);
      }
    });
    return formatInput;
  }

  useEffect(() => {
    // set the date time in given format
    setFormattedTime(getCurrentTime(Intl.DateTimeFormat().resolvedOptions().timeZone, generateDateFormat(formatString)));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatString])

  return (
    <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-80"></div>

      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full">
          <div className="relative bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
            <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-2xl leading-6 font-medium text-teal-500 mb-2" id="modal-title">Date format modifier</h3>
              <p className='text-gray-500 text-sm'>update the date time format to suit your choice!</p>
              <button
                className='text-teal-600 text-sm'
                onClick={() => setExpandInstruction(!expandInstruction)}
              >
                click here for instructions
              </button>
              {expandInstruction && (
                <>
                  {/* table with timezone details */}
                  <div className="table-responsive border rounded-lg border-gray-600 m-2 p-2">
                    <table className="table-auto w-full">
                      <tbody>
                        {generateTH('Format')}
                        {generateTH('Description')}
                        {generateTH('Example')}
                        {dateformaters.map((formatter) => generateTR(formatter.display, formatter.description, formatter.example))}
                      </tbody>
                    </table>
                  </div>
                </>)}
            </div>

            <div className="flex flex-col bg-slate-800 px-4 pb-4 sm:pb-4">
              {/* add reset button inside input */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    className="block w-full bg-slate-600 opacity-50 focus:opacity-100 p-4 rounded-full text-white text-sm 
                  leading-tight focus:outline-none focus:bg-slate-700 focus:text-white"
                    placeholder="Enter date format"
                    defaultValue={defFormatString}
                    value={formatString}
                    onChange={(e) => {
                      let formatInput = e.target.value;
                      setFormatString(formatInput);
                    }}
                  />
                </div>
                <BiReset size={24} color='gray' onClick={() => { setFormatString(defFormatString) }} className='cursor-pointer' />
              </div>
              <p className='text-teal-400 text-center py-2'>
                {formattedTime}
              </p>
            </div>

            <div className="bg-slate-700 px-4 py-3 sm:px-6 flex flex-row justify-end">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent 
                    shadow-sm px-4 py-2 bg-teal-600 font-medium text-white hover:bg-teal-700 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:ml-3"
                onClick={() => {
                  store.dispatch({ type: "dateformat/update", payload: generateDateFormat(formatString) });
                  setFormatPickerSelected(false);
                }}
              >
                Set as default format
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => {
                  setFormatPickerSelected(false);
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

export default DateFormatModal;

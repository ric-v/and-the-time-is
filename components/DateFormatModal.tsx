import { useEffect, useState } from 'react';
import ModalButton from './modal/ModalButton';
import { getCurrentTime } from '../pages/api/functions/timeNow';
import { BiReset } from 'react-icons/bi';
import { store } from '../store/store';
import ModalBase from './modal/ModalBase';
import TableRow from './ui-elements/TableRow';
import TableHeader from './ui-elements/TableHeader';

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
  const [dateFormat, setDateFormat] = useState('');
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

  // generate date format basedon the timeformatters
  const generateDateFormat = (formatString: string) => {

    let formatInput = formatString;
    // replace each character with % character
    formatInput.split('').forEach((char) => {
      if (![' ', '-', ':', '.', '/', '\\', '\'', '"', '(', ')', '[', ']', '{', '}', ';', '?', '>',
        '<', '*', '&', '^', '%', '$', '#', '@', '!', '~', '`', ',', 'T'].includes(char)) {

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
    <ModalBase body={
      <>

        <h3 className="text-2xl leading-6 font-medium text-teal-500 mb-2" id="modal-title">Date format modifier</h3>
        <p className='text-gray-500 pl-5 text-sm'>update the date time format to suit your choice!</p>

        {/* add drop down icon */}
        <select
          className='appearance-none p-2 px-2 m-2 bg-slate-600 focus:bg-slate-700 animate-pulse 
                    focus:animate-none transition duration-1000 ease-in-out
                    rounded-full w-full text-gray-300 focus:outline-none focus:shadow-outline'
          autoFocus
          onChange={(e) => {
            const val = e.target.value;
            setDateFormat(val);
            if (val !== 'custom' && val !== '') {
              setFormatString(val);
            }
          }}
          value={dateFormat}
        >
          <option value="">Choose a date-time format...</option>
          <option value="b d Y H:M:S Z (z)">b d Y H:M:S Z (z)</option>
          <option value="Y-m-d H:M:S Z">Y-m-d H:M:S Z</option>
          <option value="Y-m-d I:M:S p Z">Y-m-d I:M:S p Z</option>
          <option value="m/d/Y H:M:S Z">m/d/Y H:M:S Z</option>
          <option value="m/d/Y I:M:S p Z">m/d/Y I:M:S p Z</option>
          <option value="A, d B Y I:M:S Z">A, d B Y I:M:S Z</option>
          <option value="Y B d, A j">Y B d, A j</option>
          <option value="Y B d Z">Y B d Z</option>
          <option value="H:M:S Z">H:M:S Z</option>
          <option value="I:M:S p z">I:M:S p z</option>
          <option value="a, d b 'y I:M:S z">a, d b &apos;y I:M:S z</option>
          <option value="Y-m-dTH:M:Sz">Y-m-dTH:M:Sz</option>
          <option value="YmdHMSz">YmdHMSz</option>
          <option value="custom">Custom format...</option>
        </select>

        {
          dateFormat === 'custom' && (
            <>
              <button
                className='text-teal-600 pl-5 text-sm'
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
                        <TableHeader heading='Format' />
                        <TableHeader heading='Description' />
                        <TableHeader heading='Example' />

                        {dateformaters.map(
                          (format) =>
                            <TableRow key={format.display}
                              col1={format.display}
                              col2={format.description}
                              col3={format.example}
                            />
                        )}

                      </tbody>
                    </table>
                  </div>
                </>)}

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

              </div>
            </>
          )
        }
        <p className='text-teal-400 text-center py-2'>
          {formattedTime}
        </p>
      </>
    }
      actionBar={
        <div className="bg-slate-700 px-4 py-3 sm:px-6 flex flex-row justify-end">
          <ModalButton text='Apply default' close={false} handleClick={
            () => {
              store.dispatch({ type: "dateformat/update", payload: generateDateFormat(formatString) });
              setFormatPickerSelected(false);
            }
          } />
          <ModalButton text='Close' close={true} handleClick={
            () => {
              setFormatPickerSelected(false);
            }
          } />
        </div>
      }
    />
  )
}

export default DateFormatModal;

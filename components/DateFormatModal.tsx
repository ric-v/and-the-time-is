import { useEffect, useState } from 'react';
import ModalButton from './modal/ModalButton';
import { getCurrentTime, trimTimeFormat } from '../pages/api/functions/timeNow';
import { BiReset } from 'react-icons/bi';
import { store } from '../store/store';
import ModalBase from './modal/ModalBase';
import TableRow from './ui-elements/TableRow';
import TableHeader from './ui-elements/TableHeader';
import ModalTitle from './modal/ModalTitle';

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
  const [dateFormat, setDateFormat] = useState(trimTimeFormat(store.getState().storedata.dateFormat));
  const [formatString, setFormatString] = useState(trimTimeFormat(store.getState().storedata.dateFormat));

  const isModified = trimTimeFormat(store.getState().storedata.dateFormat) !== formatString;

  // date formaters for instruction table
  const dateformaters = [
    { display: 'B', format: '%B', description: 'full month name', example: 'January, March' },
    { display: 'b', format: '%b', description: 'short month name', example: 'Jan, Mar' },
    { display: 'd', format: '%d', description: 'day of month', example: '01, 31' },
    { display: 'j', format: '%j', description: 'day of year', example: '001, 365' },
    { display: 'm', format: '%m', description: 'month', example: '01, 12' },
    { display: 'y', format: '%y', description: 'year', example: '00, 99' },
    { display: 'Y', format: '%Y', description: 'full year', example: '2000, 2020' },
    { display: 'H', format: '%H', description: 'hour (24-hour clock)', example: '00, 23' },
    { display: 'I', format: '%I', description: 'hour (12-hour clock)', example: '01, 12' },
    { display: 'M', format: '%M', description: 'minute', example: '00, 59' },
    { display: 'S', format: '%S', description: 'second', example: '00, 59' },
    { display: 'p', format: '%p', description: 'AM/PM', example: 'AM, PM' },
    { display: 'P', format: '%P', description: 'am/pm', example: 'am, pm' },
    { display: 'Z', format: '%Z', description: 'timezone', example: 'UTC, EST' },
    { display: 'z', format: '%:z', description: 'timezone', example: '+00:00, -05:00' },
    { display: 'A', format: '%A', description: 'full weekday name', example: 'Monday, Sunday' },
    { display: 'a', format: '%a', description: 'short weekday name', example: 'Mon, Sun' },
    { display: 'W', format: '%W', description: 'week of year', example: '00, 53' },
    { display: 's', format: '%s', description: 'epoch/unix time', example: '0, 1658230652' },
    { display: 'n', format: ' ', description: 'epoch/unix nano', example: '1, 1658255852000' },
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

  const presetFormats = [
    { display: 'b d Y H:M:S Z (z)', value: 'b d Y H:M:S Z (z)' },
    { display: 'Y-m-d H:M:S Z', value: 'Y-m-d H:M:S Z' },
    { display: 'Y-m-d I:M:S p Z', value: 'Y-m-d I:M:S p Z' },
    { display: 'm/d/Y H:M:S Z', value: 'm/d/Y H:M:S Z' },
    { display: 'm/d/Y I:M:S p Z', value: 'm/d/Y I:M:S p Z' },
    { display: 'A, d B Y I:M:S Z', value: 'A, d B Y I:M:S Z' },
    { display: 'Y B d, A j', value: 'Y B d, A j' },
    { display: 'Y B d Z', value: 'Y B d Z' },
    { display: 'H:M:S Z', value: 'H:M:S Z' },
    { display: 'I:M:S p z', value: 'I:M:S p z' },
    { display: 'a, d b \'y I:M:S z', value: 'a, d b \'y I:M:S z' },
    { display: 'Y-m-dTH:M:Sz', value: 'Y-m-dTH:M:Sz' },
    { display: 'YmdHMSz', value: 'YmdHMSz' },
    { display: 'Epoch/Unix', value: 's' },
    { display: 'Epoch/Unix nano', value: ' ' },
  ]

  return (
    <ModalBase body={
      <>
        <ModalTitle title='Date format modifier' />
        <p className='text-gray-500 pl-5 text-sm'>update the date time format to suit your choice!</p>

        {/* add drop down icon */}
        <select
          className='appearance-none p-2 px-2 m-2 bg-slate-600 focus:bg-slate-700 animate-pulse 
                    focus:animate-none transition duration-1000 ease-in-out
                    rounded-full w-full text-gray-300 focus:outline-none focus:shadow-outline
                    border border-gray-500 border-dashed scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-700'
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
          {
            presetFormats.map((preset) => {
              return <option key={preset.value} value={preset.value}>{preset.display}
              </option>
            })
          }
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

              {expandInstruction && (<>
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

              <div className="flex flex-col px-4 pb-4 sm:pb-4">
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
        <p className='text-gray-500 pl-5 text-sm mt-5 border-t border-gray-600 border-dashed'>DATE FORMAT PREVIEW</p>
        <p className='text-teal-400 text-center text-xl text-ellipsis font-semibold py-2'>
          {formattedTime}
        </p>
      </>
    }
      actionBar={
        <>
          <ModalButton text={isModified ? 'Apply as default' : 'Already applied!'} close={false} disabled={!isModified} handleClick={
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
        </>
      }
    />
  )
}

export default DateFormatModal;

import { useEffect, useState } from 'react';
import ModalButton from './modal/ModalButton';
import { getCurrentTime, trimTimeFormat } from '../utils/timeNow';
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
  setFormatPickerSelected: React.Dispatch<React.SetStateAction<boolean>>;
  onFormatApply?: (format: string) => void;
};

/**
 * @description - modal window for selected timezone details
 * @param {Props} props
 */
function DateFormatModal({ setFormatPickerSelected, onFormatApply }: Props) {
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
        <p className='text-(--text-muted) pl-5 text-sm mb-4'>Update the date time format to suit your choice!</p>

        {/* add drop down icon */}
        <select
          className='appearance-none p-3 px-4 mb-4 bg-(--bg-secondary) focus:bg-(--bg-elevated) 
                    transition duration-200 ease-in-out
                    rounded-lg w-full text-(--text-primary) font-medium focus:outline-none focus:ring-1 focus:ring-(--accent-primary)
                    border border-(--border-default) cursor-pointer'
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
            <div className="mt-2 text-left">
              <button
                className='text-(--accent-primary) text-sm font-medium hover:underline mb-2 px-2 transition-all'
                onClick={() => setExpandInstruction(!expandInstruction)}
              >
                {expandInstruction ? 'Hide instructions' : 'View documentation variables'}
              </button>

              {expandInstruction && (
                <div className="border rounded-lg border-(--border-subtle) bg-(--bg-elevated) m-2 overflow-hidden mb-4">
                  <div className="overflow-y-auto max-h-[300px] p-2 custom-scrollbar">
                    <table className="w-full">
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
                </div>
              )}

              <div className="flex flex-col mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="block w-full bg-(--bg-secondary) p-3 px-4 rounded-lg text-(--text-primary) font-mono text-sm 
                              border border-(--border-default) focus:outline-none focus:border-(--accent-primary) focus:ring-1 focus:ring-(--accent-primary) transition-all"
                      placeholder="Enter custom date format"
                      defaultValue={defFormatString}
                      value={formatString}
                      onChange={(e) => {
                        let formatInput = e.target.value;
                        setFormatString(formatInput);
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => { setFormatString(defFormatString) }} 
                    className='p-3 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated) transition-colors border border-transparent'
                    title="Reset to default"
                  >
                    <BiReset size={20} />
                  </button>
                </div>
              </div>
            </div>
          )
        }
        <div className="mt-6 pt-4 border-t border-(--border-subtle)">
          <p className='text-(--text-muted) text-xs tracking-widest font-semibold uppercase mb-2'>Preview Output</p>
          <p className='text-(--accent-primary) text-center text-xl md:text-2xl font-mono tracking-tight font-medium bg-(--bg-secondary) p-4 rounded-xl border border-(--border-default) shadow-inner overflow-hidden text-ellipsis'>
            {formattedTime}
          </p>
        </div>
      </>
    }
      actionBar={
        <>
          <ModalButton text={isModified ? 'Apply as default' : 'Already applied!'} close={false} disabled={!isModified} handleClick={
            () => {
              const newFormat = generateDateFormat(formatString);
              store.dispatch({ type: "dateformat/update", payload: newFormat });
              if (onFormatApply) onFormatApply(newFormat);
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

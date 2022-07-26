import React from 'react'

type Props = {
  _classes?: string,
  field: string,
  limit: number,
  dateString: any,
  optionDisplay: (val: any) => string,
  selectVal: (val: any) => string,
  handler: (dateString: any) => void
}

const Select = ({ field, limit, dateString, optionDisplay, selectVal, handler, _classes }: Props) => {
  return (
    <select
      className='bg-gray-700 overflow-y-auto text-center rounded-lg p-2 scrollbar-thin 
        scrollbar-track-gray-700 scrollbar-thumb-gray-800 boder border border-dashed border-gray-500  
        shadow-[10px_30px_30px_-10px_rgba(0,0,0,0.53)]'
      onChange={(e) => {
        handler({ ...dateString, [field]: e.target.value })
      }}
      value={dateString[field]}
    >
      {
        Array.from(Array(limit).keys()).map((val) => (
          <option key={val} value={selectVal(val)}>
            {
              optionDisplay(val)
            }
          </option>
        ))
      }
    </select>
  )
}

export default Select;

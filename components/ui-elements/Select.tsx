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
      className={`h-11 sm:h-12 w-full overflow-y-auto rounded-xl border border-[var(--border-subtle)]
        bg-[var(--bg-card)] px-3 text-center text-[var(--text-primary)] shadow-sm
        transition-colors focus:outline-none focus:border-[var(--accent-primary)]/50
        focus:ring-2 focus:ring-[var(--accent-primary)]/20 ${_classes || ''}`}
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

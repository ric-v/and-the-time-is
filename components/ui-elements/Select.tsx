import React from 'react'

type Props = {
  classes?: string,
  field: string,
  limit: number,
  dateString: any,
  handler: (dateString: any) => void
}

const Select = ({ classes, field, limit, dateString, handler }: Props) => {
  return (
    <select
      className={classes}
      onChange={(e) => {
        handler({ ...dateString, [field]: e.target.value })
      }}
      value={dateString[field]}
    >
      {
        Array.from(Array(limit).keys()).map((val) => (
          <option key={val} value={val}>
            {
              val < 10 ? `0${val}` : val
            }
          </option>
        ))
      }
    </select>
  )
}

export default Select
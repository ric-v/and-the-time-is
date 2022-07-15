import React from 'react'

type Props = {
  col1: string, col2: string, col3: string, classes?: string
}

const TableRow = ({ col1, col2, col3, classes }: Props) => {
  return (
    <tr>
      <td className="text-left text-sm leading-5 text-gray-300">
        {col1}
      </td>
      <td className="text-left text-sm font-medium text-gray-300">
        {col2}
      </td>
      <td className={`text-left text-sm leading-5 font-bold text-gray-300 ${classes}`}>
        {col3}
      </td>
    </tr>
  )
}

export default TableRow;

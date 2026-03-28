import React from 'react'

type Props = {
  col1: string, col2: string, col3: string, classes?: string
}

const TableRow = ({ col1, col2, col3, classes }: Props) => {
  return (
    <tr>
      <td className="text-left text-sm leading-5 text-(--text-secondary) py-1 pr-4">
        {col1}
      </td>
      <td className="text-left py-1 pr-4 text-sm font-medium text-(--text-primary)">
        {col2}
      </td>
      <td className={`text-left text-sm py-1 leading-5 font-bold text-(--text-primary) ${classes}`}>
        {col3}
      </td>
    </tr>
  )
}

export default TableRow;

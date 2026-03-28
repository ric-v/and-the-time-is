import React from 'react'

type Props = {
  heading: string
}

const TableHeader = ({ heading }: Props) => {
  return (
    <th>
      <td className="text-left py-2 pr-4 text-sm text-(--text-muted)">
        <p className='font-bold'>{heading}</p>
      </td>
    </th>
  )
}

export default TableHeader
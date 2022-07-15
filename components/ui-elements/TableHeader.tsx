import React from 'react'

type Props = {
  heading: string
}

const TableHeader = ({ heading }: Props) => {
  return (
    <th>
      <td className="text-left text-sm text-gray-300">
        <p className='text-gray-500 text-sm'><b>{heading}</b></p>
      </td>
    </th>
  )
}

export default TableHeader
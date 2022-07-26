import React from 'react'

type Props = {
  title: string
  _editable?: boolean
  _classes?: string
}

const ModalTitle = ({ title, _editable, _classes }: Props) => {
  return (
    <input
      type="text"
      value={`📌 ${title}`}
      className={`text-2xl font-nova-flat leading-6 font-semibold text-teal-500 mb-2 
        appearance-none bg-transparent focus:border-0 text-center ${_classes}`}
    />
  )
}

export default ModalTitle;

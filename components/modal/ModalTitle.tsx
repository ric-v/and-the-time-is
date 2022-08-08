import React from 'react'

type Props = {
  title: string
  _classes?: string
}

const ModalTitle = ({ title, _classes }: Props) => {
  return (
    <p
      className={`text-2xl font-nova-flat leading-6 font-semibold text-teal-500 mb-2 
        appearance-none bg-transparent focus:border-0 text-center ${_classes}`}
    >📌 {title}</p>
  )
}

export default ModalTitle;

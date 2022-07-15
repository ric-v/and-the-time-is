import React from 'react'

type Props = {
  title: string
  _classes?: string
}

const ModalTitle = ({ title, _classes }: Props) => {
  return (
    <h2 className={`text-2xl font-nova-flat leading-6 font-semibold text-teal-500 mb-2 ${_classes}`} id="modal-title">
      {title}
    </h2>
  )
}

export default ModalTitle;

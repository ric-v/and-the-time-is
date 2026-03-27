import React from 'react'

type Props = {
  title: string
  _classes?: string
}

const ModalTitle = ({ title, _classes }: Props) => {
  return (
    <p
      className={`text-2xl md:text-3xl font-semibold leading-tight text-[var(--accent-primary)] text-center ${_classes}`}
    >
      {title}
    </p>
  )
}

export default ModalTitle;

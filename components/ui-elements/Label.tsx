import React from 'react'

type Props = {
  text: string
  classes?: string
}

const Label = ({ text, classes }: Props) => {
  return (
    <label className={`block uppercase tracking-wide text-teal-400 mt-4 text-sm font-bold ${classes}`}>
      {text}
    </label>
  )
}

export default Label
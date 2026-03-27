import React from 'react'

type Props = {
  text: string
  classes?: string
}

const Label = ({ text, classes }: Props) => {
  return (
    <label className={`block text-xs sm:text-sm font-semibold uppercase tracking-[0.08em] text-[var(--accent-primary)] mt-4 ${classes}`}>
      {text}
    </label>
  )
}

export default Label
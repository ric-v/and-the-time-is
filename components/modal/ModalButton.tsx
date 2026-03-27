import React from 'react'

type Props = {
  text: string,
  close: boolean,
  handleClick: () => void
  classes?: string
  disabled?: boolean
}

const ModalButton = ({ text, close, handleClick, classes, disabled }: Props) => {
  return (
    <button
      disabled={disabled}
      type="button"
      className={`mt-3 mx-1 inline-flex justify-center rounded-lg border 
                  px-4 py-2 text-sm font-medium focus:outline-none
                  focus:ring-2 focus:ring-[var(--accent-primary)]/40 sm:mt-0 
                  sm:ml-3 sm:w-auto transition-all duration-200
                  shadow-sm active:scale-95
                  ${close || disabled
                    ? 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    : 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--bg-primary)] hover:brightness-95'}
                  ${disabled ? 'cursor-not-allowed opacity-70' : ''} ${classes}`}
      onClick={handleClick}
    >
      {text}
    </button>
  )
}

export default ModalButton;

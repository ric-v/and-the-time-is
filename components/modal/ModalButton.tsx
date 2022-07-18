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
      className={`mt-3 mx-1 inline-flex justify-center rounded-md border-t border-l border-gray-500 
                  px-4 py-2 text-base font-medium text-gray-300 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 
                  sm:ml-3 sm:w-auto sm:text-sm transition duration-1000 ease-in-out
                  shadow-[10px_10px_20px_-5px_rgba(0,0,0,0.53)]
                  bg-gray-800 hover:bg-gray-900 ${disabled ? 'cursor-not-allowed' : ''}  ${classes}`}
      onClick={handleClick}
    >
      {text}
    </button>
  )
}

export default ModalButton;

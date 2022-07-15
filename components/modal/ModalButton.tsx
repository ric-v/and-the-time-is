import React from 'react'

type Props = {
  text: string,
  close: boolean,
  handleClick: () => void
}

const ModalButton = ({ text, close, handleClick }: Props) => {
  return (
    <button
      type="button"
      className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 
                  shadow-sm px-4 py-2 text-base font-medium text-gray-300 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 
                  sm:ml-3 sm:w-auto sm:text-sm transition duration-1000 ease-in-out
                  bg-${close ? 'gray-800' : 'teal-700'} hover:bg-${close ? 'gray' : 'teal'}-900`}
      onClick={handleClick}
    >
      {text}
    </button>
  )
}

export default ModalButton
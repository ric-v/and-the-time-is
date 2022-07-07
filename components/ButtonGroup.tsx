import React, { Children } from 'react'

type Props = {
  children: React.ReactNode;              // icon or text
  layout: 'grid' | 'list';                // current layout
  toLayout: 'grid' | 'list';              // layout to change to
  position: 'left' | 'middle' | 'right';  // position of button
  setLayout: React.Dispatch<React.SetStateAction<"grid" | "list">>;
}

/**
 * ButtonGroup component - used to change layout
 * 
 * @param props {children, layout, toLayout, position, setLayout}
 * @returns 
 */
const ButtonGroup = ({ children, layout, toLayout, position, setLayout }: Props) => {

  // css classes for button group
  let cssClass = "bg-transparent border p-1.5 border-gray-300 hover:bg-slate-700 disabled:border-gray-500";
  if (position === 'left') {
    cssClass += " rounded-r-lg";
  } else if (position === 'right') {
    cssClass += " rounded-l-lg";
  }

  return (
    <button
      disabled={layout === toLayout}
      className={cssClass}
      onClick={() => {
        localStorage.setItem('layout', toLayout);
        setLayout(toLayout);
      }}
    >
      {children}
    </button>
  )
}

export default ButtonGroup;

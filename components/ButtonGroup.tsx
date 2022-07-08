
/**
 * @description Props for ButtonGroup component
 * @interface Props
 * @property {React.ReactNode} children - children to render
 * @property {string} layout - current layout
 * @property {string} toLayout - layout to change to
 * @property {string} position - position of button group
 * @property {Function} setLayout - function to set layout
 */
type Props = {
  children: React.ReactNode;
  layout: 'grid' | 'list';
  toLayout: 'grid' | 'list';
  position: 'left' | 'middle' | 'right';
  setLayout: React.Dispatch<React.SetStateAction<"grid" | "list">>;
}

/**
 * @description - Component for button group
 * @param {Props} props - props for component
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

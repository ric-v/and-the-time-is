
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
  return (
    <button
      disabled={layout === toLayout}
      className={`bg-transparent border p-1.5 border-gray-300 border-dashed hover:bg-slate-700 disabled:border-gray-500 
      shadow-[15px_20px_20px_-5px_rgba(0,0,0,0.53)] transition duration-1000 ease-in-out ${position === 'left' ? 'rounded-l-lg' : position === 'middle' ? '' : 'rounded-r-lg'}`}
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

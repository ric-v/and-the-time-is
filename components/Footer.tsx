import Link from "next/link";
import ButtonGroup from "./ui-elements/ButtonGroup";

type Props = {
  hidden: string,
}

/**
 * 
 * @returns 
 */
const Footer = ({ hidden }: Props) => {

  /**
   * @description - navigation component
   * @param {string} text
   * @param {string} link
   */
  const footerNav = (text: string, link: string, position: 'right' | 'middle' | 'left') => {
    if (link === hidden) {
      return null;
    }

    return (
      <ButtonGroup position={position} toLayout='grid' layout={"grid"} setLayout={() => { }} >
        <Link passHref={true} href={link} as={link}>
          <a target={link.startsWith('http') ? '_blank' : '_self'}>
            <button className="text-white p-2">
              {text}
            </button>
          </a>
        </Link>
      </ButtonGroup >
    );
  }

  return (
    <div className='flex flex-col justify-center text-center mt-10 pb-5 bg-slate-900 border-t border-dashed border-gray-600'>
      <div className="flex flex-row justify-center">
        <div className='grid grid-cols-2 md:grid-cols-2 text-center p-5'>
          {footerNav('the time is 🕟', '/', 'left')}
          {footerNav('the time was? ⌚', '/TimeWas', 'left')}
          {footerNav('make it better 🚀', 'https://github.com/dev-asterix/and-the-time-is', 'right')}
        </div>
      </div>
      <div className='text-red-800 font-semibold text-sm lg:text-md'>
        *Disclaimer: This is a demo app. Timezones and timestamps displayed here are not accurate yet. This is still work in progress.
      </div>
      <div className='text-teal-500 font-bold'>
        source: <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones">Wikipedia tz database</a>
      </div>
    </div>
  )
}

export default Footer;

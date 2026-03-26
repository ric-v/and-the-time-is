import Link from "next/link";
import ButtonGroup from "./ui-elements/ButtonGroup";
import Label from "./ui-elements/Label";

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
  const footerNav = (text: string, link: string, position: 'right' | 'middle' | 'left', _action?: () => void) => {
    if (link === hidden) {
      return null;
    }

    return (
      <Link
        href={link}
        target={link.startsWith('http') ? '_blank' : '_self'}
        className={`bg-transparent border p-1.5 border-gray-300 border-dashed hover:bg-slate-700 
          shadow-[15px_20px_20px_-5px_rgba(0,0,0,0.53)] transition duration-1000 ease-in-out text-white flex justify-center items-center
          ${position === 'left' ? 'rounded-l-lg' : position === 'middle' ? '' : 'rounded-r-lg'}`}
        onClick={_action}
      >
        {text}
      </Link>
    );
  }

  return (
    <div className='flex flex-col justify-center text-center mt-10 pb-5 bg-slate-900 border-t border-dashed border-gray-600'>
      <div className="flex flex-row justify-center">
        <div className='grid grid-cols-2 md:grid-cols-4 text-center p-5'>
          {footerNav('the time is 🕟', '/', 'left')}
          {footerNav('the time was? ⌚', '/TimeWas', 'left')}
          {footerNav('Suggestions 🤔', '', 'middle', () => window.open('mailto:support@astrx.dev?subject=Issue Report on and-the-time-is.web&body=Please describe the issue you are facing. Add the page on which the issue occured and screenshots if available.'))}
          {footerNav('Report bug 🪲', 'https://github.com/dev-asterix/and-the-time-is.web/issues/new?assignees=&labels=&template=bug_report.md&title=', 'middle')}
          {footerNav('make it better 🚀', 'https://github.com/dev-asterix/and-the-time-is', 'right')}
        </div>
      </div>
      <div className='text-red-700 font-semibold text-sm lg:text-md mt-5'>
        *Disclaimer: Data inaccuracies are expected.
      </div>
      <div className='text-teal-500 font-bold'>
        source: <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones">Wikipedia tz database</a>
      </div>
      {/* <>
        <Label text='About' key={'about'} classes={'pb-2'} />
        <div className='text-center md:text-left text-gray-400 
                md:border-l md:shadow-[-40px_0px_40px_-20px_rgba(0,0,0,0.33)] border-dashed border-slate-500 pl-2'>
          <p className='font-nova-flat'>
            <span className='text-teal-300'>&apos;And the time is&apos; </span>app is for those who wants to track current timestamps across the globe.
            Search for the timezones to keep track of and pin them to the dashboard for easy access.
          </p>
          <br />
          <p className='font-nova-flat'>
            <span className='text-teal-300'>&apos;And the time was&apos;</span> helps you to track what the time was at a specific timezone compared to your location.
            It comes with a time picker to set the time you want to track across all selected timezones.
          </p>
          <br />
          <p className='font-nova-flat'>
            This is a free and open source project under GPL-3 copyleft license. You can find the source code on <a className='text-teal-300' href='https://github.com/dev-asterix/and-the-time-is.web' target={'_blank'} rel="noreferrer" >Github</a>.
          </p>
          <div className='text-teal-500 font-bold'>
            source: <a href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones">Wikipedia tz database</a>
          </div>
          <br />
          <p className='font-nova-flat'>Code. Share. Prosper.</p>
        </div>
      </> */}
    </div>
  )
}

export default Footer;

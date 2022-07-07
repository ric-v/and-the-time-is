import React from 'react'

/**
 * Footer - Footer component for the app
 */
const Footer = () => {
  return (
    <div className='text-center mt-10 mb-5'>
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

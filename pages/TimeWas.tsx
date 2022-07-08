import React from 'react'
import Footer from '../components/Footer';

type Props = {}

const TimeWas = (props: Props) => {
  return (
    <div className='flex flex-col justify-between min-h-full min-w-full bg-gradient-to-br from-slate-700 to-slate-900'>
      <div className="flex flex-row justify-center">
        <p className='block text-white'>And the time was???</p>
        <p className='block text-white'>coming soon</p>
      </div>
      <Footer hidden="/TimeWas" />
    </div>
  )
}

export default TimeWas;

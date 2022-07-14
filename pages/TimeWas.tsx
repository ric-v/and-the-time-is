import React from 'react'
import Footer from '../components/Footer';
import Main from '../components/Main';
import Navbar from '../components/Navbar';

type Props = {}

const TimeWas = (props: Props) => {
  return (
    <div className='flex flex-col justify-between min-h-full min-w-full bg-gradient-to-br from-slate-700 to-slate-900'>
      <div>
        <Navbar title='And the time was ...' timePicker />
        <Main page='timewas' />
      </div>
      <Footer hidden="/TimeWas" />
    </div >
  )
}

export default TimeWas;

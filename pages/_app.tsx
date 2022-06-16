import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Navbar from './components/Navbar'

function AndTheTimeIs({ Component, pageProps }: AppProps) {
  return (
    <div className='bg-slate-200 h-full'>
      <Navbar>
        <Component {...pageProps} />
      </Navbar>
    </div>
  )
}

export default AndTheTimeIs

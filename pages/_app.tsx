import '../styles/globals.css';

import { Provider } from 'react-redux';

import Footer from '../components/Footer';
import Main from '../components/Main';
import Navbar from '../components/Navbar';
import { store } from '../store/store';

import type { AppProps } from 'next/app';
function AndTheTimeIs({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <div className='flex flex-col justify-between min-h-full min-w-full  bg-gradient-to-br from-slate-700 to-slate-900'>
        <div>
          <Navbar>
            <Component {...pageProps} />
          </Navbar>
          <Main />
        </div>
        <Footer />
      </div>
    </Provider >
  )
}

export default AndTheTimeIs

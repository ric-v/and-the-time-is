import '../styles/globals.css';
import { Provider } from 'react-redux';
import type { AppProps } from 'next/app';
import Navbar from '../components/Navbar';
import { store } from '../store/store';
import Main from '../components/Main';
import Footer from '../components/Footer';
import { useState } from 'react';

function AndTheTimeIs({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <div className='flex flex-col justify-between min-h-full min-w-full' style={{ backgroundColor: '#1e2122' }}>
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

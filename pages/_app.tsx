import '../styles/globals.css';
import { Provider } from 'react-redux';
import { store } from '../store/store';

import type { AppProps } from 'next/app';
import Head from 'next/head';
function AndTheTimeIs({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head >
        <title>And the time is...</title>
      </Head>
      <Provider store={store}>
        <Component {...pageProps} />
      </Provider >
    </>
  )
}

export default AndTheTimeIs

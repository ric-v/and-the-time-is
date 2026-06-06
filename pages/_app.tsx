import '../public/styles/globals.css';
import '../public/styles/pass.css';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { nunito, jetbrainsMono } from '../utils/fonts';

import type { AppProps } from 'next/dist/pages/_app';
import Head from 'next/head';

function AndTheTimeIs({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="And the time is — live and scrubbed times across pinned timezones." />
        <meta name="theme-color" content="#0b1033" />
        <title>And the time is</title>
      </Head>
      <Provider store={store}>
        <div
          className={`${jetbrainsMono.variable} ${nunito.variable}`}
        >
          <Component {...pageProps} />
        </div>
      </Provider>
    </>
  );
}

export default AndTheTimeIs;

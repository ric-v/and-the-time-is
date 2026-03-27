import '../public/styles/globals.css';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { ThemeProvider } from '../context/ThemeContext';

import type { AppProps } from 'next/dist/pages/_app';
import Head from 'next/head';

function AndTheTimeIs({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Track time across different timezones around the world" />
        <meta name="theme-color" content="#0a0f1a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)" />
        <title>And the time is...</title>
      </Head>
      <ThemeProvider>
        <Provider store={store}>
          <Component {...pageProps} />
        </Provider>
      </ThemeProvider>
    </>
  );
}

export default AndTheTimeIs;

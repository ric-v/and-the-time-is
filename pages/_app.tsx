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
      <Component {...pageProps} />
    </Provider >
  )
}

export default AndTheTimeIs

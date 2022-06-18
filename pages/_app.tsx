import '../styles/globals.css';
import { Provider } from 'react-redux';
import type { AppProps } from 'next/app';
import Navbar from './components/Navbar';
import store from './store/store';
import HeroArea from './components/HeroArea';

function AndTheTimeIs({ Component, pageProps }: AppProps) {


  return (
    <Provider store={store}>
      <div className='h-full min-w-full' style={{ backgroundColor: '#1e2122' }}>
        <Navbar>
          <Component {...pageProps} />
        </Navbar>
        <HeroArea />
      </div>
    </Provider >
  )
}

export default AndTheTimeIs

import type { NextPage } from "next";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  return (
    <>
      <div className='container mx-auto'>
        {/* search bar for timezones */}
        <div className='p-1 mt-5 sm:mt-10'>
          <div className='relative'>
            <input
              type='text'
              className='h-14 w-full pr-8 pl-5 bg-slate-50 rounded-3xl shadow focus:outline-none'
              placeholder='Search for a timezone code / timezone location / city...'
            />
            {/* search image svg */}
            <div className='absolute top-4 right-3'>
              <svg
                className='h-6 w-6 fill-current text-gray-500'
                viewBox='0 0 20 20'>
                <path d='M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z' />
              </svg>
            </div>
          </div>
        </div>

        {/* container */}
        <div className='flex flex-col items-center'>
          <div className='grid grid-flow-col-dense grid-cols-2 gap-10 sm:grid-cols-4'></div>
        </div>
      </div>
    </>
  );
};

export default Home;

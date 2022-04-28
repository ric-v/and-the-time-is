import type { NextPage } from "next";
import Link from "next/link";
import TimezoneSearch from "./components/TimezoneSearch";

const Home: NextPage = () => {
  return (
    <>
      <div className='container mx-auto'>
        {/* search bar for timezones */}
        <TimezoneSearch />

        {/* container */}
        <div className='flex flex-col items-center'>
          <div className='grid grid-flow-col-dense grid-cols-2 gap-10 sm:grid-cols-4'></div>
        </div>
      </div>
    </>
  );
};

export default Home;

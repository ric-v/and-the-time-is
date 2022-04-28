import React, { useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) =>
  fetch(input, init).then((res) => res.json());

type Props = {};

const TimezoneSearch = (_props: Props) => {
  const [search, setSearch] = React.useState("");

  const { data, error } = useSWR(`/api/timezones?search=${search}`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      alert(error);
    }
    if (data) {
      console.log("-->", data);
    }
  }, [data, error]);

  return (
    <div className='mt-5 sm:mt-10'>
      <div className='relative'>
        <label className='block uppercase tracking-wide text-gray-700 text-sm font-bold mb-2'>
          Search for timezone
        </label>
        <input
          type='text'
          className='h-14 w-full bg-slate-50 rounded-3xl px-5 pr-14 shadow focus:outline-none sm:px-5'
          placeholder='Search for a timezone code / timezone location / city...'
          onChange={(e) => setSearch(e.target.value)}
        />
        {/* search image svg */}
        <Link href={"/"}>
          <a className='absolute top-10 right-7'>
            <svg
              className='h-6 w-6 fill-current text-gray-500'
              viewBox='0 0 20 20'>
              <path d='M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z' />
            </svg>
          </a>
        </Link>

        {/* drop down list with data as content */}
        {data && (
          <div className='w-full px-5 bg-white rounded-lg shadow-lg'>
            {data &&
              data.map((item: { code: string; name: string }) => (
                <Link href={`/timezone/${item.code}`} key={item.code}>
                  <a className='block px-4 py-2 text-sm m-3 text-gray-700 hover:bg-gray-100'>
                    {item.code} - {item.name}
                  </a>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimezoneSearch;

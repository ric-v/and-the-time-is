import React, { useEffect } from 'react';
import useSWR from 'swr';

import { Timezones } from '../functions/timeNow';
import TimestampModal from './TimestampModal';

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) => fetch(input, init).then((res) => res.json());

/**
 * @description Timezone search component for Navbar
 */
const TimezoneSearch = () => {
  // set initial state for search and selection
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Timezones | null>(null);

  // fetch timezon data from API and get data
  const { data, error } = useSWR(
    `/api/timezones?search=${search}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  if (error) return <div>failed to load</div>;

  return (
    <div className="mt-2 mb-4 sm:mt-10">
      <div className="w-full">

        <label className="block uppercase tracking-wide text-teal-400 text-sm font-bold">
          Search for timezone
        </label>

        <p className="text-gray-500 text-md italic mb-2">
          eg: &quot;Europe&quot;, &quot;Kolkata&quot;, &quot;new york&quot;,
          &quot;sydney&quot;, &quot;UTC&quot;, &quot;-04:00&quot;, &quot;IST&quot;, &quot;EDT&quot;,
          &quot;PST&quot;, &quot;02:00&quot;, etc
        </p>
        <input
          type="text"
          className="h-14 w-full bg-slate-700 transition-colors duration-1000 rounded-3xl px-5 pr-14 
            shadow-[0px_50px_50px_-15px_rgba(0,0,0,0.6)] focus:outline-none focus:bg-slate-800 sm:px-5"
          placeholder="Search for a timezone code / timezone location / city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />

        {/* search entry drop down */}
        {data && (
          <div
            className="w-full px-2 bg-slate-800 rounded-xl 
            shadow-[0px_50px_50px_-15px_rgba(0,0,0,0.6)] max-h-72 scrollbar-thin
            scrollbar-thumb-gray-800 scrollbar-track-gray-700"
          >
            {data &&
              data.map(
                (item: Timezones) => (
                  <div
                    className="block px-2 py-2 text-sm text-gray-400 hover:text-teal-500 
                      hover:bg-slate-500 hover:bg-opacity-50 cursor-pointer"
                    key={item.name}
                    onClick={() => {
                      // reset input field
                      setSearch("");
                      // set selected timezone
                      setSelected(item);
                    }}
                  >
                    {item.code} - {item.name} ({item.country}/{item.city}{" "}
                    {item.timezone} {item.offset})
                  </div>
                )
              )}
          </div>
        )}
      </div>

      {/* load modal on selected timezone data */}
      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default TimezoneSearch;

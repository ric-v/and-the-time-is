import React, { useEffect } from "react";
import useSWR from "swr";
import Modal from "./Modal";
import { Timezones } from "../functions/timeNow";

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) =>
  fetch(input, init).then((res) => res.json());

type Props = {};

const TimezoneSearch = (_props: Props) => {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Timezones | null>(null);

  const { data, error } = useSWR(`/api/timezones?search=${search}`, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      alert(error);
    }
  }, [data, error]);

  return (
    <div className="mt-5 sm:mt-10">
      <div className="w-full">
        <label className="block uppercase tracking-wide text-teal-400 text-sm font-bold mb-2">
          Search for timezone
        </label>
        <input
          type="text"
          className="h-14 w-full bg-slate-700 rounded-3xl px-5 pr-14 shadow-[0px_50px_50px_-15px_rgba(0,0,0,0.6)] focus:outline-none sm:px-5"
          placeholder="Search for a timezone code / timezone location / city..."
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* drop down list with data as content */}
        {data && (
          <div className="w-full px-2 bg-slate-700 rounded-xl shadow-[0px_50px_50px_-15px_rgba(0,0,0,0.6)] max-h-72 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-gray-700">
            {data &&
              data.map(
                (item: Timezones) => (
                  <>
                    {/* <Link href={`/timezone/${item.name}`} key={item.name}> */}
                    {/* on click set search bar to none */}
                    <div
                      className="block px-2 py-2 text-sm text-gray-400 hover:text-teal-500 hover:bg-slate-500 hover:bg-opacity-50 cursor-pointer"
                      key={item.name}
                      onClick={() => { setSearch(""); setSelected(item); }}
                    >
                      {item.code} - {item.name} ({item.country}/{item.city}{" "}
                      {item.timezone} {item.offset})
                    </div>
                    {/* </Link> */}
                  </>
                )
              )}
          </div>
        )}
      </div>
      {selected && <Modal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default TimezoneSearch;

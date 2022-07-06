import React, { useEffect, useState } from "react";
import getCurrentTime, { Timezones } from "../functions/timeNow";
import { store } from "../store/store";
import Modal from "./Modal";

type Props = {
  tzData: Timezones;
};

const Card = ({ tzData }: Props) => {
  // get current time to state
  const [currentTime, setCurrentTime] = useState(getCurrentTime(tzData.name));
  const [selected, setSelected] = React.useState<Timezones | null>(null);

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(tzData.name));
    }, 100);
    return () => clearInterval(interval);
  }, [tzData.name]);

  return (
    <div
      key={tzData.name}
      className=" shadow-[0px_50px_30px_-15px_rgba(0,0,0,0.33)]
        bg-gradient-to-br from-cyan-600 to-slate-800 rounded-lg p-4"
    >
      <div className="flex flex-row justify-between text-sm font-medium">
        <h3
          className="text-xl leading-6 font-medium text-teal-300 cursor-pointer"
          id="modal-title"
          onClick={() => { setSelected(tzData) }}
        >
          {" "}
          {tzData.name}
        </h3>
        <button
          onClick={() =>
            store.dispatch({ type: "timezone/remove", payload: tzData })
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-rose-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <div className="mt-3 text-gray-300 truncate cursor-pointer"
        onClick={() => setSelected(tzData)}
      >
        {tzData.city} - {tzData.country}
      </div>
      <div className="mt-3 text-gray-200 font-semibold cursor-pointer"
        onClick={() => setSelected(tzData)}
      >
        {currentTime}
      </div>
      {selected && <Modal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default Card;

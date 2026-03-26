import { ChangeEvent, useEffect, useState } from 'react';
import { getCurrentTime, getParsedTime, Timezones } from '../../utils/timeNow';
import { store } from '../../store/store';
import TimestampModal from '../TimestampModal';

type Props = {
  tzData: Timezones;
  page: string;
};

/**
 * @description Compact card component for timezone display
 */
const Card = ({ tzData, page }: Props) => {
  const [currentTime, setCurrentTime] = useState(
    page === 'timeis'
      ? getCurrentTime(tzData.name, store.getState().storedata.dateFormat)
      : getParsedTime(tzData.name)
  );
  const [selected, setSelected] = useState<Timezones | null>(null);
  const [customName, setCustomName] = useState(tzData.customname ? tzData.customname : tzData.name);
  const [isHovered, setIsHovered] = useState(false);

  const handleCardTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    const updatedTz = { ...tzData, customname: e.target.value };
    setTimeout(() => {
      store.dispatch({ type: "timezone/update", payload: { timezone: updatedTz, dateFormat: '' } });
    }, 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        page === 'timewas' ? getParsedTime(tzData.name) : getCurrentTime(tzData.name, store.getState().storedata.dateFormat),
      );
    }, page === 'timewas' ? 1000 : 100);
    return () => clearInterval(interval);
  }, [page, tzData.name]);

  // Get region icon based on timezone
  const getRegionIcon = () => {
    const name = tzData.name.toLowerCase();
    if (name.includes('america') || name.includes('new york') || name.includes('los angeles') || name.includes('chicago')) {
      return '🌎';
    } else if (name.includes('europe') || name.includes('london') || name.includes('paris') || name.includes('berlin')) {
      return '🌍';
    } else if (name.includes('asia') || name.includes('kolkata') || name.includes('tokyo') || name.includes('singapore')) {
      return '🌏';
    } else if (name.includes('australia') || name.includes('sydney') || name.includes('pacific') || name.includes('auckland')) {
      return '🌊';
    }
    return '🌐';
  };

  return (
    <>
      <div
        className="timezone-card group relative rounded-xl p-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header: Icon + Timezone Name + Code + Remove */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-sm">{getRegionIcon()}</span>
            <input
              type="text"
              value={customName}
              onChange={handleCardTitleChange}
              className="flex-1 bg-transparent text-xs font-medium text-[var(--text-primary)] border-none outline-none focus:ring-0 placeholder-[var(--text-muted)] truncate min-w-0"
              placeholder="City name"
            />
            <span className="text-[9px] font-medium tracking-wider uppercase text-[var(--text-muted)] flex-shrink-0">
              {tzData.code || 'UTC'}
            </span>
          </div>

          {/* Remove button */}
          <button
            onClick={() =>
              store.dispatch({ type: "timezone/remove", payload: { timezone: tzData, dateFormat: '' } })
            }
            className={`p-1 rounded-md transition-all duration-200 flex-shrink-0 ${isHovered
                ? 'opacity-100 text-red-400 hover:bg-red-400/10'
                : 'opacity-0 text-[var(--text-muted)]'
              }`}
            aria-label="Remove timezone"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Time + Date + UTC Offset */}
        <button
          onClick={() => setSelected(tzData)}
          className="w-full text-left"
        >
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl md:text-3xl font-light text-[var(--text-primary)] tracking-tight">
                {currentTime}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              UTC {tzData.offset || '+00:00'}
            </span>
          </div>
        </button>
      </div>

      {/* Modal */}
      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </>
  );
};

export default Card;

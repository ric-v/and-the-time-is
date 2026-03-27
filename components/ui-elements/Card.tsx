import { ChangeEvent, useEffect, useState } from 'react';
import { getCurrentTime, getParsedTime, getParsedTimeWithFormat, getRelativeOffsetToLocal, getUtcOffsetIntl, Timezones } from '../../utils/timeNow';
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
  const activeDateFormat = store.getState().storedata.dateFormat;
  const snapshotIso = store.getState().storedata.timewasData;
  const [currentTime, setCurrentTime] = useState(
    page === 'timeis'
      ? getCurrentTime(tzData.name, activeDateFormat)
      : getParsedTime(tzData.name)
  );
  const [selected, setSelected] = useState<Timezones | null>(null);
  const [customName, setCustomName] = useState(tzData.customname ? tzData.customname : tzData.name);
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayDate =
    page === 'timewas'
      ? getParsedTimeWithFormat(tzData.name, '%a, %b %d')
      : getCurrentTime(tzData.name, '%a, %b %d');
  const activeDate = page === 'timewas' ? new Date(store.getState().storedata.timewasData) : new Date();
  const displayOffset = getUtcOffsetIntl(tzData.name, activeDate);
  const relativeOffset = getRelativeOffsetToLocal(tzData.name, activeDate);

  const handleCardTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    const updatedTz = { ...tzData, customname: e.target.value };
    setTimeout(() => {
      store.dispatch({ type: "timezone/update", payload: { timezone: updatedTz, dateFormat: '' } });
    }, 500);
  };

  useEffect(() => {
    if (page === 'timewas') {
      setCurrentTime(getParsedTime(tzData.name));
      return undefined;
    }

    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(tzData.name, store.getState().storedata.dateFormat));
    }, 1000);

    return () => clearInterval(interval);
  }, [page, tzData.name, snapshotIso, activeDateFormat]);

  const copyTime = async () => {
    const cityName = customName || tzData.city || tzData.name;
    const payload = `${cityName}: ${currentTime} (${tzData.name}, UTC ${displayOffset})`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const renderPrimaryTime = () => {
    const match = currentTime.match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!match) {
      return (
        <span className="font-mono text-2xl md:text-3xl font-light text-[var(--text-primary)] tracking-tight">
          {currentTime}
        </span>
      );
    }

    return (
      <span className="font-mono text-2xl md:text-3xl font-light tracking-tight">
        <span className="text-[var(--text-secondary)]">{match[1]}</span>
        <span className="text-[var(--text-muted)]">:</span>
        <span className="text-[var(--text-primary)]">{match[2]}</span>
        <span className="text-[var(--text-muted)]">:</span>
        <span className="text-[var(--accent-primary)]">{match[3]}</span>
      </span>
    );
  };

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
        {/* Header: Icon + Timezone Name + Relative Offset + Actions */}
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
            <span className="text-[10px] font-medium text-[var(--text-muted)] flex-shrink-0">
              {relativeOffset}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={copyTime}
              className={`p-1 rounded-md transition-all duration-200 active:scale-95 ${copied ? 'text-[var(--accent-primary)] bg-[var(--accent-muted)]' : 'text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-muted)]'}`}
              aria-label="Copy time"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M10 18h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() =>
                store.dispatch({ type: "timezone/remove", payload: { timezone: tzData, dateFormat: '' } })
              }
              className="p-1 rounded-md transition-all duration-200 active:scale-95 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10"
              aria-label="Remove timezone"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Time + Date + UTC Offset */}
        <button
          onClick={() => setSelected(tzData)}
          className="w-full text-left transition-transform duration-150 active:scale-[0.99]"
        >
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              {renderPrimaryTime()}
              <span className="text-[10px] text-[var(--text-muted)]">
                {displayDate}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">
              UTC {displayOffset}
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

import { ChangeEvent, useEffect, useState } from 'react';
import { getCurrentTime, getParsedTime, getParsedTimeWithFormat, getRelativeOffsetToLocal, getUtcOffsetIntl, Timezones } from '../../utils/timeNow';
import { store } from '../../store/store';
import TimestampModal from '../TimestampModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = {
  tzData: Timezones;
  page: string;
};

/**
 * @description Compact card component for timezone display
 */
const Card = ({ tzData, page }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tzData.name, data: tzData });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

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
  const [hour, setHour] = useState(() => {
    // initial hour calculation
    const date = new Date();
    return parseInt(new Intl.DateTimeFormat('en-US', {
      timeZone: tzData.name,
      hour: 'numeric',
      hour12: false,
    }).format(date), 10);
  });
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
      const date = new Date();
      setHour(parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: tzData.name,
        hour: 'numeric',
        hour12: false,
      }).format(date), 10));
    }, 1000);

    return () => clearInterval(interval);
  }, [page, tzData.name, snapshotIso, activeDateFormat]);

  const copyTime = async (e?: React.MouseEvent, onlyTimeDate = false) => {
    if (e) e.stopPropagation();
    const cityName = customName || tzData.city || tzData.name;
    const payload = onlyTimeDate 
      ? `${currentTime} ${displayDate}`
      : `${cityName}: ${currentTime} (${tzData.name}, UTC ${displayOffset})`;
    
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const renderPrimaryTime = () => {
    // Improved regex to find the FIRST occurrence of  HH:MM:SS or HH:MM 
    // Captures: 1=leading text, 2=hours, 3=minutes, 4=optional seconds, 5=trailing text
    const match = currentTime.match(/^(.*?)\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b(.*)$/);
    if (!match) {
      return (
        <span className="font-mono text-2xl md:text-3xl font-light tracking-tight text-(--text-primary)">
          {currentTime}
        </span>
      );
    }

    const [_, pre, h, m, s, post] = match;

    return (
      <span className="font-mono text-2xl md:text-3xl font-light tracking-tight flex items-baseline">
        {pre && <span className="text-(--text-secondary) mr-[0.5ch]">{pre}</span>}
        <span className="text-(--text-secondary)">{h}</span>
        <span className="text-(--text-muted)">:</span>
        <span className="text-(--text-primary)">{m}</span>
        {s && (
          <>
            <span className="text-(--text-muted)">:</span>
            <span className="text-(--accent-primary)">{s}</span>
          </>
        )}
        {post && <span className="text-(--text-secondary) ml-[0.5ch]">{post}</span>}
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
        ref={setNodeRef}
        style={style}
        className={`timezone-card group relative rounded-xl p-4 ${hour >= 6 && hour < 18 ? 'border-l-4 border-l-amber-400/20' : 'border-l-4 border-l-indigo-400/20'} ${isDragging ? 'opacity-60 shadow-2xl scale-105 pointer-events-none border-(--accent-primary)' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header: Icon + Timezone Name + Relative Offset + Actions */}
        <div className="flex items-center justify-between mb-3 pointer-events-auto">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Drag Handle */}
            <div 
              {...attributes}
              {...listeners}
              className={`cursor-grab active:cursor-grabbing text-(--text-muted) hover:text-(--text-primary) transition-opacity duration-200 p-1 -ml-1 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3C6.32843 3 7 2.32843 7 1.5C7 0.671573 6.32843 0 5.5 0C4.67157 0 4 0.671573 4 1.5C4 2.32843 4.67157 3 5.5 3ZM9.5 3C10.3284 3 11 2.32843 11 1.5C11 0.671573 10.3284 0 9.5 0C8.67157 0 8 0.671573 8 1.5C8 2.32843 8.67157 3 9.5 3ZM11 7.5C11 8.32843 10.3284 9 9.5 9C8.67157 9 8 8.32843 8 7.5C8 6.67157 8.67157 6 9.5 6C10.3284 6 11 6.67157 11 7.5ZM9.5 15C10.3284 15 11 14.3284 11 13.5C11 12.6716 10.3284 12 9.5 12C8.67157 12 8 12.6716 8 13.5C8 14.3284 8.67157 15 9.5 15ZM7 13.5C7 14.3284 6.32843 15 5.5 15C4.67157 15 4 14.3284 4 13.5C4 12.6716 4.67157 12 5.5 12C6.32843 12 7 12.6716 7 13.5ZM5.5 9C6.32843 9 7 8.32843 7 7.5C7 6.67157 6.32843 6 5.5 6C4.67157 6 4 6.67157 4 7.5C4 8.32843 4.67157 9 5.5 9Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </div>
            <span className="text-sm">{getRegionIcon()}</span>
            <input
              type="text"
              value={customName}
              onChange={handleCardTitleChange}
              className="flex-1 bg-transparent text-xs font-medium text-(--text-primary) border-none outline-none focus:ring-0 placeholder-(--text-muted) truncate min-w-0"
              placeholder="City name"
            />
            <span className="text-[10px] font-medium text-(--text-muted) shrink-0">
              {relativeOffset}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-50'}`}>
            <button
              onClick={(e) => copyTime(e)}
              className={`p-1 rounded-md transition-all duration-200 active:scale-95 ${copied ? 'text-(--accent-primary) bg-(--accent-muted)' : 'text-(--text-muted) hover:text-(--accent-primary) hover:bg-(--accent-muted)'}`}
              aria-label="Copy full info"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-(--accent-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M10 18h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={() =>
                store.dispatch({ type: "timezone/remove", payload: { timezone: tzData, dateFormat: '' } })
              }
              className="p-1 rounded-md transition-all duration-200 active:scale-95 text-(--text-muted) hover:text-red-400 hover:bg-red-400/10"
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
            <div className="flex items-center gap-2 group/time">
              <div className="flex items-baseline gap-2">
                {renderPrimaryTime()}
                <span className="text-[10px] text-(--text-muted)">
                  {displayDate}
                </span>
              </div>
              <button
                onClick={(e) => copyTime(e, true)}
                className={`p-1 rounded-md transition-all duration-200 opacity-0 group-hover/time:opacity-100 active:scale-90 ${copied ? 'text-(--accent-primary)' : 'text-(--text-muted) hover:text-(--accent-primary)'}`}
                title="Copy formatted time"
              >
                {copied ? (
                  <svg className="w-3 h-3 text-(--accent-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M10 18h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <span className="text-[10px] text-(--text-muted)">
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

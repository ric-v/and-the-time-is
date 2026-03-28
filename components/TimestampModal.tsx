import { useEffect, useState } from 'react';

import ModalButton from './modal/ModalButton';
import { getCurrentTime, getRelativeOffsetToLocal, getUtcOffsetIntl, Timezones } from '../utils/timeNow';
import { store } from '../store/store';
import ModalBase from './modal/ModalBase';
import ModalTitle from './modal/ModalTitle';

/**
 * @interface Props
 * @property {Timezones} timezone
 * @property {(timezone: Timezones | null) => void} setSelected
 */
type Props = {
  timezone: Timezones,
  setSelected: (timezone: Timezones | null) => void,
}

/**
 * @description - modal window for selected timezone details
 * @param {Props} props
 */
function TimestampModal({ timezone, setSelected }: Props) {
  const timezoneName = timezone.name;

  // get current time to state
  const [currentTime, setCurrentTime] = useState(
    getCurrentTime(timezoneName, store.getState().storedata.dateFormat),
  );

  // set interval to update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        getCurrentTime(timezoneName, store.getState().storedata.dateFormat),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timezoneName]);

  // check if the timezone is added to homescreen via store
  const isAdded = store.getState().storedata.timezones.find(
    (tz) => tz.name === timezoneName,
  );

  const displayName = timezone.customname || timezone.city || timezoneName;
  const abbreviation = getCurrentTime(timezoneName, '%Z');
  const utcOffset = getUtcOffsetIntl(timezoneName);
  const relativeOffset = getRelativeOffsetToLocal(timezoneName);
  const todayLabel = getCurrentTime(timezoneName, '%A, %b %d');

  const handleUnpin = () => {
    store.dispatch({ type: 'timezone/remove', payload: { timezone, dateFormat: '' } });
    setSelected(null);
  };

  const handleCopyTime = async () => {
    const payload = `${displayName}: ${currentTime} (${timezoneName}, UTC ${utcOffset})`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // ignore
    }
  };

  return (
    <ModalBase body={
      <>
        <ModalTitle title={displayName} />
        <p className="text-center text-xs uppercase tracking-[0.12em] text-[var(--text-muted)] mt-2">
          {todayLabel} • {timezone.country}
        </p>

        <div className="mt-5">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Current Time</p>
            <p className="font-mono text-3xl md:text-4xl tracking-tight text-[var(--text-primary)] mt-1">
              {currentTime}
            </p>
          </div>

          {/* 3-column meta row */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Abbrev</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{abbreviation}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">UTC Offset</p>
              <p className="text-sm font-semibold text-[var(--accent-primary)] mt-0.5">{utcOffset}</p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Relative</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{relativeOffset}</p>
            </div>
          </div>

          {/* IANA timezone as subtle code string */}
          <div className="mt-3 text-center">
            <p className="text-xs text-[var(--text-muted)]">IANA Timezone</p>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">{timezoneName}</p>
          </div>
        </div>
      </>
    }
      actionBar={
        <>
          {isAdded && (
            <ModalButton 
              text='Unpin' 
              close={false} 
              handleClick={handleUnpin}
              classes='bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
            />
          )}
          <ModalButton 
            text='Copy time' 
            close={false} 
            handleClick={handleCopyTime}
          />
          <ModalButton text='Close' close={true} handleClick={
            () => {
              setSelected(null);
            }
          } />
        </>
      }
    />
  )
}

export default TimestampModal

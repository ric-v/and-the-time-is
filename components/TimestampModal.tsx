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

  return (
    <ModalBase body={
      <>
        <ModalTitle title={displayName} />
        <p className="text-center text-xs uppercase tracking-[0.12em] text-[var(--text-muted)] mt-2">
          {todayLabel} • {timezone.country}
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 p-4">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Current Time</p>
            <p className="font-mono text-3xl md:text-4xl tracking-tight text-[var(--text-primary)] mt-1">
              {currentTime}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Abbreviation</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{abbreviation}</p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">UTC Offset</p>
              <p className="text-sm font-semibold text-[var(--accent-primary)] mt-1">{utcOffset}</p>
            </div>
            <div className="col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Relative To You</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{relativeOffset}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)]">IANA Timezone</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)] break-all">{timezoneName}</p>
        </div>
      </>
    }
      actionBar={
        <>
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

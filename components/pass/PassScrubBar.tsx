'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setScrubOffset, setScrubbingInProgress } from '../../store/scrubSlice';
import { formatTime, getLocalHour, getLocalMinute } from '../../utils/timeEngine';
import {
  SCRUB_MIN,
  SCRUB_MAX,
  SCRUB_STEP,
  GOLDEN_START,
  GOLDEN_END,
  formatScrubOffset,
} from '../../utils/passLayoutEngine';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';

export interface PassScrubBarProps {
  localIana: string;
  localLabel: string;
}

const PassScrubBar: React.FC<PassScrubBarProps> = ({ localIana, localLabel }) => {
  const dispatch = useAppDispatch();
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const displayedTime = useDisplayedTime();
  const trackWrapRef = useRef<HTMLDivElement>(null);
  const goldenRef = useRef<HTMLDivElement>(null);

  const timeLabel = useMemo(() => {
    const t = formatTime(localIana, displayedTime, displayFormat);
    return `${t} ${localLabel}`;
  }, [localIana, displayedTime, displayFormat, localLabel]);

  const updateGoldenMarker = useCallback(() => {
    const wrap = trackWrapRef.current;
    const golden = goldenRef.current;
    if (!wrap || !golden) return;
    const trackW = wrap.clientWidth;
    const total = SCRUB_MAX - SCRUB_MIN;
    const now = new Date();
    const nowMinutes = getLocalHour(localIana, now) * 60 + getLocalMinute(localIana, now);
    const goldenStartMin = GOLDEN_START * 60 - nowMinutes;
    const goldenEndMin = GOLDEN_END * 60 - nowMinutes;
    const gStartPx = ((goldenStartMin - SCRUB_MIN) / total) * trackW;
    const gEndPx = ((goldenEndMin - SCRUB_MIN) / total) * trackW;
    golden.style.left = `${Math.max(0, gStartPx)}px`;
    golden.style.width = `${Math.max(0, gEndPx - gStartPx)}px`;
  }, [localIana]);

  useEffect(() => {
    updateGoldenMarker();
    window.addEventListener('resize', updateGoldenMarker);
    return () => window.removeEventListener('resize', updateGoldenMarker);
  }, [updateGoldenMarker]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setScrubOffset(Number.parseInt(e.target.value, 10)));
    },
    [dispatch],
  );

  const handlePointerDown = useCallback(() => {
    dispatch(setScrubbingInProgress(true));
  }, [dispatch]);

  const handlePointerUp = useCallback(() => {
    dispatch(setScrubbingInProgress(false));
  }, [dispatch]);

  return (
    <div className="pass-scrub-bar">
      <div className="pass-scrub-meta">
        <span className="pass-scrub-time">{timeLabel}</span>
        <span className="pass-scrub-offset">{formatScrubOffset(scrubOffset)}</span>
      </div>
      <div className="pass-scrub-track-wrap" ref={trackWrapRef}>
        <div className="pass-scrub-golden" ref={goldenRef} aria-hidden />
        <input
          type="range"
          className="pass-scrub-track"
          min={SCRUB_MIN}
          max={SCRUB_MAX}
          step={SCRUB_STEP}
          value={scrubOffset}
          onChange={handleChange}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Scrub displayed time ±12 hours"
        />
      </div>
    </div>
  );
};

export default React.memo(PassScrubBar);

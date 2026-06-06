'use client';

import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setExpandedOrb } from '../../store/sessionSlice';
import type { OrbLabelData } from '../../hooks/useSceneOrchestrator';
import type { Orb } from '../../store/orbSlice';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';
import {
  formatLocalDate,
  formatTime,
  getLocalHour,
  getLocalMinute,
  getUtcOffsetAtTime,
} from '../../utils/timeEngine';
import { getSkyState } from '../../utils/skyPaletteEngine';
import { SIX_STATE_PALETTE } from '../../utils/skyPaletteEngine';
import type { DisplayFormat } from '../../store/settingsSlice';

function tzAbbrev(ianaName: string, time: Date): string {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaName,
      timeZoneName: 'short',
    });
    return dtf.formatToParts(time).find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

function formatUtcOffsetLabel(ianaName: string, time: Date): string {
  const raw = getUtcOffsetAtTime(ianaName, time);
  const m = raw.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return raw;
  const sign = m[1];
  const h = parseInt(m[2], 10);
  const min = parseInt(m[3], 10);
  if (min === 0) return `UTC${sign}${h}`;
  return `UTC${sign}${h}:${String(min).padStart(2, '0')}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Clock time with date shown on a separate line in the list. */
function isClockWithDateFormat(fmt: DisplayFormat): boolean {
  return fmt === 'local' || fmt === '24h' || fmt === '12h';
}

interface SimpleObservationListProps {
  /** Per-orb label data from the scene orchestrator (same source as ring labels). */
  labelByOrb: Map<string, OrbLabelData>;
}

const SimpleObservationList: React.FC<SimpleObservationListProps> = ({
  labelByOrb,
}) => {
  const dispatch = useAppDispatch();
  const orbs = useAppSelector((s) => s.orbs.list);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const displayedTime = useDisplayedTime();

  const rows = useMemo(() => {
    const enriched = orbs.map((orb) => {
      const d = labelByOrb.get(orb.id);
      if (!d) return null;
      const h = getLocalHour(orb.ianaName, displayedTime);
      const m = getLocalMinute(orb.ianaName, displayedTime);
      const sortKey = h * 60 + m;
      return { orb, d, sortKey };
    });
    const list = enriched.filter((x): x is NonNullable<typeof x> => x !== null);
    list.sort((a, b) => a.sortKey - b.sortKey);
    return list;
  }, [orbs, labelByOrb, displayedTime]);

  return (
    <div className="observatory-simple-list-wrap">
      <div className="observatory-simple-list-hdr">
        <div className="observatory-simple-hdr-cell">Local Time</div>
        <div className="observatory-simple-hdr-cell">Location · Zone</div>
      </div>
      <div className="observatory-simple-list">
        {rows.map(({ orb, d }) => (
          <SimpleRow
            key={orb.id}
            orb={orb}
            data={d}
            displayedTime={displayedTime}
            displayFormat={displayFormat}
            onOpen={() => dispatch(setExpandedOrb(orb.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleObservationList;

interface SimpleRowProps {
  orb: Orb;
  data: OrbLabelData;
  displayedTime: Date;
  displayFormat: DisplayFormat;
  onOpen: () => void;
}

const SimpleRow: React.FC<SimpleRowProps> = ({
  orb,
  data,
  displayedTime,
  displayFormat,
  onOpen,
}) => {
  const h = getLocalHour(orb.ianaName, displayedTime);
  const m = getLocalMinute(orb.ianaName, displayedTime);
  const s = (() => {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: orb.ianaName,
        second: '2-digit',
        hourCycle: 'h23',
      });
      const p = dtf.formatToParts(displayedTime);
      return parseInt(p.find((x) => x.type === 'second')?.value ?? '0', 10);
    } catch {
      return 0;
    }
  })();

  const state = getSkyState(h);
  const pal = SIX_STATE_PALETTE[state];
  const swatch = `radial-gradient(ellipse at 35% 28%, ${pal.horizon} 0%, ${pal.zenith} 80%)`;

  const abbr = tzAbbrev(orb.ianaName, displayedTime);
  const utcPart = formatUtcOffsetLabel(orb.ianaName, displayedTime);

  let timeMain: React.ReactNode;
  let timeSec: React.ReactNode;
  let timeAmpm: React.ReactNode;

  const showDateLine = isClockWithDateFormat(displayFormat);
  const dateLine = showDateLine
    ? formatLocalDate(orb.ianaName, displayedTime)
    : null;

  if (displayFormat === 'local') {
    timeMain = formatTime(orb.ianaName, displayedTime, 'local');
    timeSec = null;
    timeAmpm = null;
  } else if (displayFormat === '12h') {
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    timeMain = (
      <>
        {hh}
        <span className="obs-simple-colon">:</span>
        {pad(m)}
      </>
    );
    timeSec = <span className="obs-simple-sec">{pad(s)}</span>;
    timeAmpm = <span className="obs-simple-ampm">{ap}</span>;
  } else if (
    displayFormat === 'iso' ||
    displayFormat === 'unix' ||
    displayFormat === 'ymd24' ||
    displayFormat === 'ymd12' ||
    displayFormat === 'mdy24' ||
    displayFormat === 'mdy12' ||
    displayFormat === 'readable'
  ) {
    timeMain = data.formattedTime;
    timeSec = null;
    timeAmpm = null;
  } else {
    timeMain = (
      <>
        {pad(h)}
        <span className="obs-simple-colon">:</span>
        {pad(m)}
      </>
    );
    timeSec = <span className="obs-simple-sec">{pad(s)}</span>;
    timeAmpm = null;
  }

  const clockWithDate = isClockWithDateFormat(displayFormat);

  return (
    <button
      type="button"
      className={`observatory-simple-row${orb.isLocal ? ' is-local' : ''}${clockWithDate ? ' is-clock-with-date' : ' is-full-datetime'}`}
      onClick={onOpen}
    >
      <div className="observatory-simple-row-time">
        <div className="obs-simple-time-primary">
          <span className="obs-simple-t-main">{timeMain}</span>
          {timeSec}
          {timeAmpm}
        </div>
        {dateLine ? (
          <span className="obs-simple-t-date">{dateLine}</span>
        ) : null}
      </div>
      <div className="observatory-simple-row-details">
        <div className="observatory-simple-row-city">
          <span className="obs-simple-swatch" style={{ background: swatch }} aria-hidden />
          <span className="observatory-simple-row-city-block">
            <span className="obs-simple-row-name">
              {data.cityLabel}
              {orb.isLocal ? <span className="obs-simple-you">YOU</span> : null}
            </span>
          </span>
        </div>
        <div className="observatory-simple-row-meta">
          <span className="obs-simple-meta-line">
            {abbr ? `${abbr} · ` : ''}
            {utcPart}
            {orb.isLocal
              ? ' · Local'
              : data.relativeOffset
                ? ` · ${data.relativeOffset}`
                : ''}
          </span>
          <span className="obs-simple-state">
            {state} · {orb.ianaName}
          </span>
        </div>
      </div>
    </button>
  );
};

'use client';

import React, { useMemo } from 'react';
import { useAppSelector } from '../../store/store';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';
import { getLocalHour, getLocalMinute } from '../../utils/timeEngine';
import { getSkyState } from '../../utils/skyPaletteEngine';
import { getObservatorySkyPair } from '../../utils/observatorySky';

const STATE_LABELS: Record<string, string> = {
  midnight: 'Deep night',
  dawn: 'Dawn approaching',
  day: 'Daylight',
  noon: 'Solar noon',
  dusk: 'Sunset hour',
  night: 'Evening',
};

/**
 * Lower horizon strip from horizon-observatory.html — local solar arc + celestial marker.
 */
const ObservationDome: React.FC = () => {
  const displayedTime = useDisplayedTime();
  const orbs = useAppSelector((s) => s.orbs.list);
  const localOrb = useMemo(() => orbs.find((o) => o.isLocal), [orbs]);

  const localIana = localOrb?.ianaName ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  const city = localOrb?.label ?? 'Local';

  const h = getLocalHour(localIana, displayedTime) + getLocalMinute(localIana, displayedTime) / 60;
  const state = getSkyState(Math.floor(h));
  const markCenter = `${STATE_LABELS[state] ?? 'Surface'} · ${city}`;

  const { zenith, horizon } = getObservatorySkyPair(h);
  const domeWash = `linear-gradient(180deg, ${zenith} 0%, ${horizon} 80%, transparent 100%)`;

  let progress: number;
  let color: string;
  let glow: number;
  const isDayBand = h >= 5.5 && h < 18.5;
  if (isDayBand) {
    progress = (h - 5.5) / 13;
    color = '#d4502c';
    glow = 0.35;
  } else {
    const hh = h >= 18.5 ? h - 18.5 : h + (24 - 18.5);
    progress = hh / 11;
    color = '#5a7a9a';
    glow = 0.22;
  }
  const cx = 50 + progress * 1100;
  const cy = 90 - Math.sin(progress * Math.PI) * 70 + 15;
  const r = isDayBand ? 8 : 6;

  return (
    <div className="observatory-dome-wrap">
      <div className="observatory-dome-sky-wash" style={{ background: domeWash }} aria-hidden />
      <div className="observatory-dome-marker observatory-dome-marker-l">West · sunset</div>
      <div className="observatory-dome-marker observatory-dome-marker-c">{markCenter}</div>
      <div className="observatory-dome-marker observatory-dome-marker-r">East · sunrise</div>
      <svg className="observatory-dome-svg" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden>
        <g fill="none" stroke="var(--brass-line)" strokeWidth={0.5}>
          <line x1={0} y1={90} x2={1200} y2={90} opacity={0.25} />
          <path d="M 0 90 Q 600 0 1200 90" opacity={0.7} strokeWidth={0.6} />
          <path d="M 0 90 Q 600 25 1200 90" opacity={0.2} strokeDasharray="2 4" />
          <path d="M 0 90 Q 600 55 1200 90" opacity={0.15} strokeDasharray="2 4" />
          <path d="M 150 90 Q 150 55 175 22" opacity={0.14} />
          <path d="M 300 90 Q 300 40 370 10" opacity={0.14} />
          <path d="M 450 90 Q 450 25 550 2" opacity={0.14} />
          <path d="M 600 90 L 600 0" opacity={0.18} />
          <path d="M 750 90 Q 750 25 650 2" opacity={0.14} />
          <path d="M 900 90 Q 900 40 830 10" opacity={0.14} />
          <path d="M 1050 90 Q 1050 55 1025 22" opacity={0.14} />
          <path d="M 0 90 L 1200 90 L 1200 140 L 0 140 Z" fill="#141414" opacity={0.03} />
          <g opacity={0.4}>
            <line x1={50} y1={88} x2={50} y2={96} strokeWidth={0.4} />
            <line x1={200} y1={88} x2={200} y2={96} strokeWidth={0.4} />
            <line x1={400} y1={88} x2={400} y2={96} strokeWidth={0.4} />
            <line x1={600} y1={86} x2={600} y2={98} strokeWidth={0.7} />
            <line x1={800} y1={88} x2={800} y2={96} strokeWidth={0.4} />
            <line x1={1000} y1={88} x2={1000} y2={96} strokeWidth={0.4} />
            <line x1={1150} y1={88} x2={1150} y2={96} strokeWidth={0.4} />
          </g>
        </g>
        <g>
          <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.85} />
          <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} opacity={glow} strokeWidth={0.4} />
        </g>
      </svg>
    </div>
  );
};

export default ObservationDome;

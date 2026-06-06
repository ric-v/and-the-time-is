'use client';

import React, { useMemo } from 'react';
import { formatTime, getLocalHour } from '../../utils/timeEngine';
import { getLanternState } from '../../utils/passLayoutEngine';
import { getLandmarkSvg } from '../../utils/passLandmarkArt';
import type { Orb } from '../../store/orbSlice';
import type { DisplayFormat } from '../../store/settingsSlice';
import type { LanternState } from '../../utils/passLayoutEngine';

export interface PassLandmarkProps {
  orb: Orb;
  scrollX: number;
  displayedTime: Date;
  displayFormat: DisplayFormat;
  onSelect: (orb: Orb) => void;
}

const PassLandmark: React.FC<PassLandmarkProps> = ({
  orb,
  scrollX,
  displayedTime,
  displayFormat,
  onSelect,
}) => {
  const art = useMemo(() => getLandmarkSvg(orb.ianaName), [orb.ianaName]);
  const localHour = getLocalHour(orb.ianaName, displayedTime);
  const lantern: LanternState = getLanternState(localHour);
  const timeLabel = formatTime(orb.ianaName, displayedTime, displayFormat);

  return (
    <button
      type="button"
      className={`pass-landmark${orb.isLocal ? ' is-local' : ''}`}
      style={{ left: scrollX }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(orb);
      }}
      aria-label={`${orb.label}, ${timeLabel}`}
    >
      <div className="pass-landmark-pedestal" aria-hidden />
      <div className="pass-landmark-body">
        <svg
          width={art.width}
          height={art.height}
          viewBox={art.viewBox}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: art.innerHtml }}
        />
      </div>
      <div className="pass-landmark-chip">
        <span className="pass-landmark-city">{orb.label}</span>
        <span className="pass-landmark-time">{timeLabel}</span>
      </div>
      <div className={`pass-lantern ${lantern}`} aria-hidden />
    </button>
  );
};

export default React.memo(PassLandmark);

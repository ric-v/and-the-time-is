'use client';

import React from 'react';

interface PassParallaxTrackProps {
  className: string;
  stripClassName: string;
  stripWidth: number;
  tileCount?: number;
  children: React.ReactNode;
}

/** Repeating parallax strip tiles for seamless scroll density. */
const PassParallaxTrack: React.FC<PassParallaxTrackProps> = ({
  className,
  stripClassName,
  stripWidth,
  tileCount = 4,
  children,
}) => (
  <div className={className}>
    {Array.from({ length: tileCount }).map((_, i) => (
      <div
        key={i}
        className={stripClassName}
        style={{ left: i * stripWidth, width: stripWidth }}
      >
        {children}
      </div>
    ))}
  </div>
);

export default PassParallaxTrack;

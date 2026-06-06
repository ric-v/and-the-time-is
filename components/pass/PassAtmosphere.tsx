'use client';

import React from 'react';

interface PassAtmosphereProps {
  sunOpacity: number;
  moonOpacity: number;
  cloudOpacity: number;
  scrollOffset: number;
  reducedMotion: boolean;
}

function CloudShape() {
  return (
    <svg viewBox="0 0 200 60" aria-hidden className="pass-cloud-svg">
      <ellipse cx="60" cy="38" rx="48" ry="22" fill="rgba(255,255,255,0.85)" />
      <ellipse cx="100" cy="32" rx="56" ry="26" fill="rgba(255,255,255,0.92)" />
      <ellipse cx="145" cy="40" rx="42" ry="20" fill="rgba(255,255,255,0.78)" />
    </svg>
  );
}

const PassAtmosphere: React.FC<PassAtmosphereProps> = ({
  sunOpacity,
  moonOpacity,
  cloudOpacity,
  scrollOffset,
  reducedMotion,
}) => (
  <div className="pass-atmosphere" aria-hidden>
    <div
      className="pass-celestial pass-sun"
      style={{
        opacity: sunOpacity,
        transform: `translate3d(${scrollOffset * 0.05}px, 0, -120px)`,
      }}
    >
      <div className="pass-celestial-glow pass-sun-glow" />
      <div className="pass-celestial-disc pass-sun-disc" />
    </div>

    <div
      className="pass-celestial pass-moon"
      style={{
        opacity: moonOpacity,
        transform: `translate3d(${-scrollOffset * 0.03 + 40}px, 0, -100px)`,
      }}
    >
      <div className="pass-celestial-glow pass-moon-glow" />
      <div className="pass-celestial-disc pass-moon-disc" />
    </div>

    {(['far', 'mid', 'near'] as const).map((layer, i) => (
      <div
        key={layer}
        className={`pass-cloud-layer pass-cloud-${layer}`}
        style={{
          opacity: cloudOpacity * (0.5 + i * 0.15),
          transform: `translate3d(${-scrollOffset * (0.06 + i * 0.06)}px, 0, ${-80 + i * 40}px)`,
        }}
      >
        <div className={reducedMotion ? '' : 'pass-cloud-drift'} style={{ animationDelay: `${i * -12}s` }}>
          {Array.from({ length: 8 }).map((_, j) => (
            <div key={j} className="pass-cloud-unit" style={{ left: j * 220 }}>
              <CloudShape />
            </div>
          ))}
        </div>
      </div>
    ))}

    <div className="pass-sky-vignette" />
    <div className="pass-ground-fog" />
  </div>
);

export default PassAtmosphere;

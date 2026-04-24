/**
 * OrbLabel — HTML label for each zone on the ring.
 *
 * `layout="observatory"` matches horizon-observatory.html (connector, disc, card).
 * `layout="radial"` keeps the older radial offset layout for dark themes.
 */

import React from 'react';
import type { SkyStateName } from '../../utils/skyPaletteEngine';
import { SIX_STATE_PALETTE } from '../../utils/skyPaletteEngine';
import type { DisplayFormat } from '../../store/settingsSlice';
import TimeDisplay from './TimeDisplay';

const SKY_ROMAN: Record<SkyStateName, string> = {
  midnight: 'I',
  dawn: 'II',
  day: 'III',
  noon: 'IV',
  dusk: 'V',
  night: 'VI',
};

const DAY_STATES = new Set<SkyStateName>(['day', 'noon']);

export interface OrbLabelProps {
  orbId: string;
  screenX: number;
  screenY: number;
  cityLabel: string;
  formattedTime: string;
  displayFormat: DisplayFormat;
  relativeOffset: string;
  skyState: SkyStateName;
  isLocal: boolean;
  isAnchor: boolean;
  ringAngleDeg: number;
  visible: boolean;
  totalOrbs: number;
  /** `observatory` = parchment instrument (default). */
  layout?: 'observatory' | 'radial';
}

function computeLabelPosition(ringAngleDeg: number): {
  offsetX: number;
  offsetY: number;
  textAlign: 'left' | 'center' | 'right';
  transformOrigin: string;
} {
  const angle = ((ringAngleDeg % 360) + 360) % 360;
  const rad = (angle * Math.PI) / 180;
  const LABEL_OFFSET_PX = 40;
  const dirX = Math.sin(rad);
  const dirY = -Math.cos(rad);
  const offsetX = dirX * LABEL_OFFSET_PX;
  const offsetY = dirY * LABEL_OFFSET_PX;
  let textAlign: 'left' | 'center' | 'right';
  let transformOrigin: string;
  if (Math.abs(dirX) < 0.3) {
    textAlign = 'center';
    transformOrigin = dirY < 0 ? 'bottom center' : 'top center';
  } else if (dirX > 0) {
    textAlign = 'left';
    transformOrigin = 'left center';
  } else {
    textAlign = 'right';
    transformOrigin = 'right center';
  }
  return { offsetX, offsetY, textAlign, transformOrigin };
}

function getTextColor(skyState: SkyStateName): string {
  return SIX_STATE_PALETTE[skyState].textOnFill;
}

const OrbLabel: React.FC<OrbLabelProps> = ({
  orbId,
  screenX,
  screenY,
  cityLabel,
  formattedTime,
  displayFormat,
  relativeOffset,
  skyState,
  isLocal,
  isAnchor: _isAnchor,
  ringAngleDeg,
  visible,
  totalOrbs,
  layout = 'observatory',
}) => {
  if (!visible) return null;

  if (layout === 'observatory') {
    const pal = SIX_STATE_PALETTE[skyState];
    const isDay = DAY_STATES.has(skyState);
    const hideOffset = totalOrbs >= 30;
    const offShort =
      !isLocal && relativeOffset && !hideOffset
        ? relativeOffset.replace(/\s+/g, ' ').toUpperCase()
        : '';

    return (
      <div
        data-orb-label={orbId}
        className={`obs-orb ${isDay ? 'is-day' : ''} ${isLocal ? 'is-local' : ''}`}
        style={{
          position: 'absolute',
          left: screenX,
          top: screenY,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <div className="obs-orb-connector" aria-hidden />
        <div className="obs-orb-body">
          <div
            className="obs-orb-inner"
            style={{
              background: `radial-gradient(ellipse at 35% 28%, ${pal.horizon} 0%, ${pal.zenith} 80%)`,
            }}
          />
          <div className={`obs-orb-state-mark ${isDay ? 'is-day' : ''}`}>
            {SKY_ROMAN[skyState]}
          </div>
        </div>
        {/* Mobile full view: arrow + badge under orb (cards hidden). Desktop: hidden. */}
        <div className="obs-orb-time-callout" aria-label={formattedTime}>
          <div className="obs-orb-time-callout-arrow" aria-hidden />
          <div className="obs-orb-time-callout-badge">
            <TimeDisplay
              formattedTime={formattedTime}
              displayFormat={displayFormat}
              fontSize={displayFormat === 'unix' ? 6 : displayFormat === 'iso' ? 6 : 9}
              fontWeight={500}
              color="var(--ink, #141414)"
              style={
                displayFormat === 'iso' || displayFormat === 'unix'
                  ? {
                      maxWidth: '72px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }
                  : undefined
              }
            />
          </div>
        </div>
        <div className="obs-orb-card">
          <div className="obs-orb-city">{cityLabel}</div>
          <div className="obs-orb-time">
            <TimeDisplay
              formattedTime={formattedTime}
              displayFormat={displayFormat}
              fontSize={10}
              fontWeight={400}
              color="var(--ink-soft, #3a3733)"
            />
          </div>
          {isLocal ? (
            <span className="obs-you-badge">You · Local</span>
          ) : offShort ? (
            <div className="obs-orb-offset">{offShort}</div>
          ) : null}
        </div>
      </div>
    );
  }

  const { offsetX, offsetY, textAlign, transformOrigin } = computeLabelPosition(ringAngleDeg);
  const textColor = getTextColor(skyState);
  const useSmallFont = totalOrbs >= 20;
  const hideOffset = totalOrbs >= 30;
  const timeFontSize = useSmallFont ? 13 : 18;
  const cityFontSize = 13;
  const offsetFontSize = 11;

  return (
    <div
      data-orb-label={orbId}
      style={{
        position: 'absolute',
        left: screenX + offsetX,
        top: screenY + offsetY,
        transform: 'translate(-50%, -50%)',
        transformOrigin,
        textAlign,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        transition: 'opacity 100ms ease-out',
        zIndex: 1,
      }}
    >
      <div
        style={{
          fontSize: cityFontSize,
          fontWeight: 500,
          lineHeight: 1.45,
          color: textColor,
          letterSpacing: '0.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: textAlign === 'center'
            ? 'center'
            : textAlign === 'right'
              ? 'flex-end'
              : 'flex-start',
        }}
      >
        <span>{cityLabel}</span>
        {isLocal && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--accent, #f4c572)',
              backgroundColor: 'var(--accent-soft, rgba(244,197,114,0.18))',
              borderRadius: 12,
              padding: '1px 6px',
              lineHeight: 1.4,
              letterSpacing: '0.04em',
            }}
          >
            YOU
          </span>
        )}
      </div>
      <div
        style={{
          lineHeight: 1.4,
          display: 'flex',
          justifyContent: textAlign === 'center'
            ? 'center'
            : textAlign === 'right'
              ? 'flex-end'
              : 'flex-start',
        }}
      >
        <TimeDisplay
          formattedTime={formattedTime}
          displayFormat={displayFormat}
          fontSize={timeFontSize}
          fontWeight={500}
          color={textColor}
        />
      </div>
      {!isLocal && relativeOffset && !hideOffset && (
        <div
          style={{
            fontSize: offsetFontSize,
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'rgba(255, 255, 255, 0.38)',
            letterSpacing: '0.01em',
          }}
        >
          {relativeOffset}
        </div>
      )}
    </div>
  );
};

export default React.memo(OrbLabel);

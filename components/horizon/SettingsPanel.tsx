'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setSettingsOpen } from '../../store/sessionSlice';
import {
  setOrbDrift,
  setGlobeAutoRotation,
  setReducedMotion,
  setRememberScrub,
  setAnchorOrb,
  setThemeMode,
  setScreenZoom,
  SCREEN_ZOOM_MIN,
  SCREEN_ZOOM_MAX,
  SCREEN_ZOOM_DEFAULT,
} from '../../store/settingsSlice';
import type { ReducedMotionOverride, ThemeMode } from '../../store/settingsSlice';
import { clearAllHorizonData } from '../../utils/persistenceManager';
import { showToast } from './Toast';
import FormatControl from './FormatControl';
import OverlayBackdrop from './OverlayBackdrop';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * SettingsPanel — slide-in panel from the right on desktop, full-screen on mobile.
 *
 * Sections:
 *   - Display: format segmented control (24h / 12h / ISO / Unix)
 *   - Motion: Orb Drift toggle, Reduced motion selector, Globe auto-rotation toggle
 *   - Persistence: Remember scrub position toggle, Reset anchor, Reset all data
 *   - About: version, GitHub link, credits
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4, 10.3, 11.5
 * UI-UX-Spec: Section 9.3 — Settings Panel
 */

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Toggle switch styled for the glass-chrome design system */
const Toggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}> = ({ checked, onChange, disabled = false, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    style={{
      position: 'relative',
      width: 40,
      height: 22,
      borderRadius: 11,
      border: 'none',
      background: checked
        ? 'var(--accent, #f4c572)'
        : 'rgba(255, 255, 255, 0.12)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background 150ms ease-out',
      flexShrink: 0,
      opacity: disabled ? 0.4 : 1,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 20 : 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: checked ? 'rgba(20, 18, 14, 0.9)' : 'rgba(255, 255, 255, 0.7)',
        transition: 'left 150ms ease-out, background 150ms ease-out',
      }}
    />
  </button>
);

/** Segmented selector for reduced motion (Auto / Always / Never) */
const SegmentedSelector: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
}> = ({ value, options, onChange, disabled = false, ariaLabel }) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    style={{
      display: 'inline-flex',
      gap: 0,
      padding: 2,
      borderRadius: 10,
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
      opacity: disabled ? 0.4 : 1,
    }}
  >
    {options.map((opt) => {
      const isSelected = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={isSelected}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 12px',
            fontSize: 13,
            fontWeight: isSelected ? 500 : 400,
            lineHeight: 1.4,
            color: isSelected
              ? 'rgba(20, 18, 14, 0.9)'
              : 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
            background: isSelected ? 'var(--accent, #f4c572)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 150ms ease-out',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

/** A setting row with label on left and control on right */
const SettingRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      minHeight: 36,
    }}
  >
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 400,
          color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
        }}
      >
        {label}
      </div>
      {description && (
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.4,
            fontWeight: 400,
            color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
            marginTop: 2,
          }}
        >
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

/** Section card with heading */
const Section: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 12,
      border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}
  >
    <h3
      style={{
        fontSize: 22,
        lineHeight: 1.35,
        fontWeight: 400,
        color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
        margin: 0,
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const REDUCED_MOTION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'on', label: 'Always' },
  { value: 'off', label: 'Never' },
];

const THEME_MODE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const SettingsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const settingsOpen = useAppSelector((s) => s.session.settingsOpen);
  const settings = useAppSelector((s) => s.settings);
  const reducedMotion = useReducedMotion();

  const [resetConfirmStep, setResetConfirmStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, settingsOpen);

  const handleClose = useCallback(() => {
    dispatch(setSettingsOpen(false));
    setResetConfirmStep(0);
  }, [dispatch]);

  const handleOrbDriftChange = useCallback(
    (checked: boolean) => dispatch(setOrbDrift(checked)),
    [dispatch],
  );

  const handleGlobeAutoRotationChange = useCallback(
    (checked: boolean) => dispatch(setGlobeAutoRotation(checked)),
    [dispatch],
  );

  const handleReducedMotionChange = useCallback(
    (value: string) => dispatch(setReducedMotion(value as ReducedMotionOverride)),
    [dispatch],
  );

  const handleRememberScrubChange = useCallback(
    (checked: boolean) => dispatch(setRememberScrub(checked)),
    [dispatch],
  );
  const handleThemeModeChange = useCallback(
    (value: string) => dispatch(setThemeMode(value as ThemeMode)),
    [dispatch],
  );

  const handleScreenZoomChange = useCallback(
    (value: number) => dispatch(setScreenZoom(value)),
    [dispatch],
  );

  const handleResetAnchor = useCallback(() => {
    dispatch(setAnchorOrb(null));
    showToast('Anchor reset to local timezone');
  }, [dispatch]);

  const handleResetHorizon = useCallback(() => {
    if (resetConfirmStep === 0) {
      setResetConfirmStep(1);
      return;
    }
    // Step 2: actually reset
    clearAllHorizonData();
    showToast('All saved data cleared. Reloading…', 'warning');
    setResetConfirmStep(0);
    dispatch(setSettingsOpen(false));
    // Reload to re-run first-load seeding
    setTimeout(() => window.location.reload(), 600);
  }, [resetConfirmStep, dispatch]);

  const handleResetCancel = useCallback(() => {
    setResetConfirmStep(0);
  }, []);

  if (!settingsOpen) return null;

  return (
    <OverlayBackdrop
      isOpen={settingsOpen}
      onClose={handleClose}
      ariaLabel="Settings panel"
    >
      {/* Panel — slide-in from right on desktop, full-screen on mobile */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="settings-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 360,
          height: '100vh',
          maxHeight: '100vh',
          background: 'var(--chrome-glass, rgba(12, 14, 28, 0.35))',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          borderLeft: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'settings-slide-in 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              lineHeight: 1.35,
              fontWeight: 400,
              color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
              margin: 0,
            }}
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
              fontSize: 18,
              lineHeight: 1,
              transition: 'background 100ms ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Display section */}
          <Section title="Display">
            <SettingRow
              label="Theme"
              description="Dark mode adapts chrome accent by local hour"
            >
              <SegmentedSelector
                value={settings.themeMode}
                options={THEME_MODE_OPTIONS}
                onChange={handleThemeModeChange}
                ariaLabel="Theme mode"
              />
            </SettingRow>
            <SettingRow label="Time format">
              <FormatControl compact />
            </SettingRow>
            <SettingRow
              label="Screen zoom"
              description={`${settings.screenZoom}% — scales text and scene`}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 140,
                }}
              >
                <input
                  type="range"
                  min={SCREEN_ZOOM_MIN}
                  max={SCREEN_ZOOM_MAX}
                  step={5}
                  value={settings.screenZoom}
                  onChange={(e) => handleScreenZoomChange(Number(e.target.value))}
                  aria-label="Screen zoom"
                  aria-valuemin={SCREEN_ZOOM_MIN}
                  aria-valuemax={SCREEN_ZOOM_MAX}
                  aria-valuenow={settings.screenZoom}
                  style={{
                    flex: 1,
                    accentColor: 'var(--accent, #f4c572)',
                    cursor: 'pointer',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleScreenZoomChange(SCREEN_ZOOM_DEFAULT)}
                  aria-label="Reset screen zoom to default"
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    lineHeight: 1.4,
                    borderRadius: 8,
                    border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
                    background: 'transparent',
                    color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Reset
                </button>
              </div>
            </SettingRow>
          </Section>

          {/* Motion section */}
          <Section title="Motion">
            <SettingRow
              label="Orb drift"
              description="Orbs slowly rotate around the ring in real time"
            >
              <Toggle
                checked={settings.orbDrift}
                onChange={handleOrbDriftChange}
                ariaLabel="Toggle orb drift"
              />
            </SettingRow>

            <SettingRow
              label="Reduced motion"
              description="Auto follows your system preference"
            >
              <SegmentedSelector
                value={settings.reducedMotionOverride}
                options={REDUCED_MOTION_OPTIONS}
                onChange={handleReducedMotionChange}
                ariaLabel="Reduced motion preference"
              />
            </SettingRow>

            <SettingRow
              label="Globe auto-rotation"
              description={reducedMotion ? 'Disabled by reduced motion' : 'Globe spins slowly when live'}
            >
              <Toggle
                checked={settings.globeAutoRotation}
                onChange={handleGlobeAutoRotationChange}
                disabled={reducedMotion}
                ariaLabel="Toggle globe auto-rotation"
              />
            </SettingRow>
          </Section>

          {/* Persistence section */}
          <Section title="Persistence">
            <SettingRow
              label="Remember scrub position"
              description="Restore your last scrub offset on reload"
            >
              <Toggle
                checked={settings.rememberScrubPosition}
                onChange={handleRememberScrubChange}
                ariaLabel="Toggle remember scrub position"
              />
            </SettingRow>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleResetAnchor}
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 18,
                  border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
                  background: 'transparent',
                  color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 100ms ease-out',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                Reset anchor to local
              </button>

              {/* Reset all saved data — two-step confirm */}
              {resetConfirmStep === 0 ? (
                <button
                  type="button"
                  onClick={handleResetHorizon}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    borderRadius: 18,
                    border: '1px solid var(--danger-soft, rgba(230, 120, 120, 0.18))',
                    background: 'var(--danger-soft, rgba(230, 120, 120, 0.18))',
                    color: 'var(--danger-text, #f2a8a8)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 100ms ease-out',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(230, 120, 120, 0.28)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      'var(--danger-soft, rgba(230, 120, 120, 0.18))';
                  }}
                >
                  Reset all data
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: 12,
                    borderRadius: 12,
                    background: 'var(--danger-soft, rgba(230, 120, 120, 0.18))',
                    border: '1px solid rgba(230, 120, 120, 0.25)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: 'var(--danger-text, #f2a8a8)',
                      fontWeight: 500,
                    }}
                  >
                    This will clear all zones, settings, and cached data. Are you sure?
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleResetCancel}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 16,
                        border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
                        background: 'transparent',
                        color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetHorizon}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 16,
                        border: 'none',
                        background: 'var(--danger-text, #f2a8a8)',
                        color: 'rgba(20, 18, 14, 0.9)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Yes, reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>

        </div>

        {/* Footer: version + source link */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            }}
          >
            v0.1.0
          </span>
          <a
            href="https://github.com/dev-asterix/and-the-time-is"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                'var(--accent, #f4c572)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                'var(--chrome-text-muted, rgba(255,255,255,0.38))';
            }}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </OverlayBackdrop>
  );
};

export default React.memo(SettingsPanel);

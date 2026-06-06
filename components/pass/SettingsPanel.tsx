'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setSettingsOpen } from '../../store/sessionSlice';
import {
  setReducedMotion,
  setRememberScrub,
} from '../../store/settingsSlice';
import type { ReducedMotionOverride } from '../../store/settingsSlice';
import { clearAllHorizonData } from '../../utils/persistenceManager';
import { showToast } from './Toast';
import FormatControl from './FormatControl';
import OverlayBackdrop from './OverlayBackdrop';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/** Toggle switch */
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
    className="obs-toggle"
    style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    <span className="obs-toggle-knob" />
  </button>
);

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
    className="obs-segmented"
    style={{ opacity: disabled ? 0.4 : 1 }}
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
          className="obs-segmented-btn"
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

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
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 400,
          color: 'var(--ink)',
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
            color: 'var(--ink-muted)',
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

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="obs-panel-section">
    <h3 className="obs-panel-section-title">{title}</h3>
    {children}
  </div>
);

const REDUCED_MOTION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'on', label: 'Always' },
  { value: 'off', label: 'Never' },
];

const SettingsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const settingsOpen = useAppSelector((s) => s.session.settingsOpen);
  const settings = useAppSelector((s) => s.settings);

  const [resetConfirmStep, setResetConfirmStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, settingsOpen);

  const handleClose = useCallback(() => {
    dispatch(setSettingsOpen(false));
    setResetConfirmStep(0);
  }, [dispatch]);

  const handleReducedMotionChange = useCallback(
    (value: string) => dispatch(setReducedMotion(value as ReducedMotionOverride)),
    [dispatch],
  );

  const handleRememberScrubChange = useCallback(
    (checked: boolean) => dispatch(setRememberScrub(checked)),
    [dispatch],
  );

  const handleResetData = useCallback(() => {
    if (resetConfirmStep === 0) {
      setResetConfirmStep(1);
      return;
    }
    clearAllHorizonData();
    showToast('All saved data cleared. Reloading…', 'warning');
    setResetConfirmStep(0);
    dispatch(setSettingsOpen(false));
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
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="obs-panel settings-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 360,
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          animation: 'settings-slide-in 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '0.5px solid var(--rule-soft)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              lineHeight: 1.35,
              fontWeight: 400,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close settings"
            className="obs-panel-close"
          >
            ×
          </button>
        </div>

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
          <Section title="Display">
            <SettingRow label="Time format">
              <FormatControl compact />
            </SettingRow>
          </Section>

          <Section title="Motion">
            <SettingRow
              label="Reduced motion"
              description="Disables parallax, snow, and bird animations"
            >
              <SegmentedSelector
                value={settings.reducedMotionOverride}
                options={REDUCED_MOTION_OPTIONS}
                onChange={handleReducedMotionChange}
                ariaLabel="Reduced motion preference"
              />
            </SettingRow>
          </Section>

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
              {resetConfirmStep === 0 ? (
                <button
                  type="button"
                  onClick={handleResetData}
                  className="obs-btn-danger"
                  style={{ width: '100%', height: 36, fontSize: 13, letterSpacing: '0.02em', textTransform: 'none' }}
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
                    borderRadius: 4,
                    background: 'var(--danger-soft)',
                    border: '0.5px solid var(--danger-text)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: 'var(--danger-text)',
                      fontWeight: 500,
                    }}
                  >
                    This will clear all zones, settings, and cached data. Are you sure?
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleResetCancel}
                      className="obs-btn-ghost"
                      style={{ flex: 1, height: 32, fontSize: 13, letterSpacing: '0.02em', textTransform: 'none' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="obs-btn-danger"
                      style={{ flex: 1, height: 32, fontSize: 13, letterSpacing: '0.02em', textTransform: 'none' }}
                    >
                      Yes, reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div
          style={{
            padding: '10px 16px',
            borderTop: '0.5px solid var(--rule-soft)',
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
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-meta)',
            }}
          >
            v0.1.0 · The Pass
          </span>
          <a
            href="https://github.com/dev-asterix/and-the-time-is"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              color: 'var(--ink-muted)',
              textDecoration: 'none',
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

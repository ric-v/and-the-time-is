'use client';

import React from 'react';
import { useAppDispatch } from '../../store/store';
import { setCommandPaletteOpen, setSettingsOpen } from '../../store/sessionSlice';

const PassTopBar: React.FC = () => {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className="pass-chrome pass-brand">And the time is</div>
      <div className="pass-chrome pass-top-actions">
        <button
          type="button"
          className="pass-add-btn"
          onClick={() => dispatch(setCommandPaletteOpen(true))}
          aria-label="Add timezone (Ctrl+K)"
        >
          Add zone
        </button>
        <button
          type="button"
          className="pass-icon-btn pass-settings-dot"
          onClick={() => dispatch(setSettingsOpen(true))}
          aria-label="Settings"
        />
      </div>
    </>
  );
};

export default React.memo(PassTopBar);

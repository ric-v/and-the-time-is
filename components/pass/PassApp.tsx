'use client';

import React, { useCallback, useEffect } from 'react';
import PassScene from './PassScene';
import CommandPalette from './CommandPalette';
import DateJumpDialog from './DateJumpDialog';
import SettingsPanel from './SettingsPanel';
import ToastContainer from './Toast';
import AriaLiveRegion from './AriaLiveRegion';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setCommandPaletteOpen, setDateJumpOpen } from '../../store/sessionSlice';
import { useFirstRunSeeding } from '../../hooks/useFirstRunSeeding';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { nunito, jetbrainsMono } from '../../utils/fonts';

const PassApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const commandPaletteOpen = useAppSelector((s) => s.session.commandPaletteOpen);
  const dateJumpOpen = useAppSelector((s) => s.session.dateJumpOpen);
  const reducedMotion = useReducedMotion();

  useFirstRunSeeding();

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(setCommandPaletteOpen(!commandPaletteOpen));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        dispatch(setDateJumpOpen(!dateJumpOpen));
      }
    },
    [dispatch, commandPaletteOpen, dateJumpOpen],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    document.documentElement.style.background = '#0b1033';
    document.body.style.background = '#0b1033';
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  return (
    <div
      className={`pass-root ${nunito.variable} ${jetbrainsMono.variable}${reducedMotion ? ' pass-reduced-motion' : ''}`}
    >
      <PassScene />
      <CommandPalette />
      <DateJumpDialog />
      <SettingsPanel />
      <ToastContainer />
      <AriaLiveRegion />
    </div>
  );
};

export default PassApp;

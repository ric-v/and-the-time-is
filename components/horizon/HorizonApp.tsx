'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import TopBar from './TopBar';
import SceneContainer from './SceneContainer';
import ScrubControl from './ScrubControl';
import BottomBar from './BottomBar';
import ToastContainer from './Toast';
import CommandPalette from './CommandPalette';
import DateJumpDialog from './DateJumpDialog';
import OrbDetailView from './OrbDetailView';
import AriaLiveRegion from './AriaLiveRegion';
import SettingsPanel from './SettingsPanel';
import CoachMark from './CoachMark';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setCommandPaletteOpen, setDateJumpOpen } from '../../store/sessionSlice';
import { useFirstRunSeeding } from '../../hooks/useFirstRunSeeding';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';
import { useObservatorySkyWash } from '../../hooks/useObservatorySkyWash';
import { inter, jetbrainsMono, fraunces, ibmPlexMono } from '../../utils/fonts';

const HorizonApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const commandPaletteOpen = useAppSelector((s) => s.session.commandPaletteOpen);
  const dateJumpOpen = useAppSelector((s) => s.session.dateJumpOpen);
  const horizonViewMode = useAppSelector((s) => s.session.horizonViewMode);
  const themeMode = useAppSelector((s) => s.settings.themeMode);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayedTime = useDisplayedTime();
  const localIana = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    [],
  );

  useFirstRunSeeding();
  useObservatorySkyWash(rootRef, displayedTime, localIana, themeMode);

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
    document.documentElement.classList.add('horizon-obs-root');
    document.body.classList.add('horizon-obs-root');
    return () => {
      document.documentElement.classList.remove('horizon-obs-root');
      document.body.classList.remove('horizon-obs-root');
      document.documentElement.classList.remove('horizon-obs-dark');
      document.body.classList.remove('horizon-obs-dark');
    };
  }, []);

  useEffect(() => {
    const isDark = themeMode === 'dark';
    document.documentElement.classList.toggle('horizon-obs-dark', isDark);
    document.body.classList.toggle('horizon-obs-dark', isDark);
  }, [themeMode]);

  return (
    <div
      ref={rootRef}
      className={`horizon-observatory ${horizonViewMode === 'simple' ? 'observatory-simple-mode' : ''} ${themeMode === 'dark' ? 'observatory-theme-dark' : 'observatory-theme-light'} ${inter.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div className="horizon-sky-wash" aria-hidden />
      <div className="horizon-paper-grain" aria-hidden />
      <div className="horizon-app-stack">
        <TopBar />
        <SceneContainer />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <CoachMark />
          <ScrubControl />
        </div>
        <BottomBar />
        <CommandPalette />
        <DateJumpDialog />
        <OrbDetailView />
        <SettingsPanel />
        <ToastContainer />
        <AriaLiveRegion />
      </div>
    </div>
  );
};

export default HorizonApp;

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { observatorySkyWashGradient } from '../utils/observatorySky';
import { getLocalHour } from '../utils/timeEngine';
import { getDarkObservatoryThemeVars, OBSERVATORY_THEME_VAR_KEYS } from '../utils/observatoryTheme';
import type { ThemeMode } from '../store/settingsSlice';

/**
 * Updates `--obs-sky-wash-gradient` on the Horizon root for the fixed sky wash layer.
 */
export function useObservatorySkyWash(
  rootRef: RefObject<HTMLElement | null>,
  displayedTime: Date,
  localIana: string,
  themeMode: ThemeMode,
): void {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const hour = getLocalHour(localIana, displayedTime);
    el.style.setProperty(
      '--obs-sky-wash-gradient',
      observatorySkyWashGradient(hour),
    );

    if (themeMode === 'dark') {
      const vars = getDarkObservatoryThemeVars(hour);
      for (const [key, value] of Object.entries(vars)) {
        el.style.setProperty(key, value);
      }
      return;
    }

    for (const key of OBSERVATORY_THEME_VAR_KEYS) {
      el.style.removeProperty(key);
    }
  }, [displayedTime, localIana, rootRef, themeMode]);
}

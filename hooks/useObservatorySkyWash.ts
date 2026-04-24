import { useEffect } from 'react';
import type { RefObject } from 'react';
import { observatorySkyWashGradient } from '../utils/observatorySky';
import { getLocalHour } from '../utils/timeEngine';

/**
 * Updates `--obs-sky-wash-gradient` on the Horizon root for the fixed sky wash layer.
 */
export function useObservatorySkyWash(
  rootRef: RefObject<HTMLElement | null>,
  displayedTime: Date,
  localIana: string,
): void {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const hour = getLocalHour(localIana, displayedTime);
    el.style.setProperty(
      '--obs-sky-wash-gradient',
      observatorySkyWashGradient(hour),
    );
  }, [displayedTime, localIana, rootRef]);
}

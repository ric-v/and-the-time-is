import { useEffect, useState } from 'react';
import { getCurrentTime } from '../utils/timeNow';

type HeroSectionProps = {
  title: string;
  page: 'timeis' | 'timewas';
  compact?: boolean;
};

/**
 * @description Hero section - compact toolbar or full expanded view
 */
const HeroSection = ({ title, page, compact = false }: HeroSectionProps) => {
  const [currentTime, setCurrentTime] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    setCurrentTime(getCurrentTime(timezone, '%H:%M:%S'));

    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime(timezone, '%H:%M:%S'));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeParts = currentTime.split(':');
  const hours = timeParts[0] || '00';
  const minutes = timeParts[1] || '00';
  const seconds = timeParts[2] || '00';

  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const shortDateFormatted = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timezone = isClient ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const timezoneShort = timezone ? timezone.split('/').pop()?.replace('_', ' ') : '';

  // Compact Mode - Toolbar with readable text
  if (compact) {
    return (
      <div className="border-b border-(--border-subtle) bg-(--bg-secondary) h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center gap-6">
          {/* Date + Time */}
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-(--text-secondary)">{shortDateFormatted}</span>
            <div className="flex items-center font-mono">
              <span className="text-4xl md:text-5xl font-light text-(--text-primary) tracking-tight">{hours}</span>
              <span className="text-3xl md:text-4xl text-(--text-muted) mx-1">:</span>
              <span className="text-4xl md:text-5xl font-light text-(--text-primary) tracking-tight">{minutes}</span>
              <span className="text-3xl md:text-4xl text-(--text-muted) mx-1">:</span>
              <span className="text-4xl md:text-5xl font-light text-(--accent-primary) tracking-tight">{isClient ? seconds : '--'}</span>
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--accent-muted) border border-(--accent-primary)/20">
            <svg className="w-4 h-4 text-(--accent-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-(--accent-primary)">{timezoneShort || '...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded Mode - Full hero
  return (
    <div className="flex flex-col items-center justify-center bg-(--bg-primary) py-16 md:py-24">
      {/* Title */}
      <h1 className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-(--text-muted) mb-8">
        {title}
      </h1>

      {/* Large Time Display */}
      <div className="flex items-center font-mono">
        <span className="text-6xl md:text-8xl lg:text-9xl font-light text-(--text-primary) tracking-tight">{hours}</span>
        <span className="text-5xl md:text-7xl lg:text-8xl text-(--text-muted) font-light mx-2 md:mx-3">:</span>
        <span className="text-6xl md:text-8xl lg:text-9xl font-light text-(--text-primary) tracking-tight">{minutes}</span>
        <span className="text-5xl md:text-7xl lg:text-8xl text-(--text-muted) font-light mx-2 md:mx-3">:</span>
        <span className="text-6xl md:text-8xl lg:text-9xl font-light text-(--accent-primary) tracking-tight">{isClient ? seconds : '--'}</span>
      </div>

      {/* Date & Timezone */}
      <div className="flex flex-col items-center gap-3 mt-8">
        <p className="text-base md:text-lg text-(--text-secondary)">{dateFormatted}</p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-(--accent-muted) border border-(--accent-primary)/20">
          <svg className="w-4 h-4 text-(--accent-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-(--accent-primary)">{isClient ? timezone : 'Loading...'}</span>
        </div>
      </div>

      {/* "Local Time" label */}
      <div className="flex items-center gap-4 mt-8 w-full max-w-xs">
        <div className="flex-1 h-px bg-linear-to-r from-transparent to-(--border-default)" />
        <span className="text-xs tracking-widest uppercase text-(--text-muted)">Local Time</span>
        <div className="flex-1 h-px bg-linear-to-l from-transparent to-(--border-default)" />
      </div>
    </div>
  );
};

export default HeroSection;

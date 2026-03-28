import { useEffect, useState } from 'react';
import { getCurrentTime, canonicalizeTimezoneId } from '../utils/timeNow';
import { motion, AnimatePresence } from 'framer-motion';

type HeroSectionProps = {
  title: string;
  page: 'timeis' | 'timewas';
  compact?: boolean;
  searchComponent?: React.ReactNode;
};

/**
 * @description Hero section - morphs between expanded hero and compact toolbar
 */
const HeroSection = ({ title, page, compact = false, searchComponent }: HeroSectionProps) => {
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

  const rawTimezone = isClient ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const timezone = rawTimezone ? canonicalizeTimezoneId(rawTimezone) : '';
  const timezoneShort = timezone ? timezone.split('/').pop()?.replace('_', ' ') : '';

  return (
    <motion.div
      layout
      className={`relative w-full transition-colors duration-500 overflow-visible ${
        compact 
          ? 'border-b border-(--border-subtle) bg-(--bg-secondary) py-4 sm:h-24 z-20' 
          : 'bg-(--bg-primary) py-16 md:py-24 z-10'
      }`}
    >
      <div className={`mx-auto ${compact ? 'max-w-7xl px-4 sm:px-6 lg:px-8 h-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6' : 'flex flex-col items-center justify-center'}`}>
        
        <AnimatePresence>
          {!compact && (
            <motion.h1
              layoutId="hero-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-sm md:text-base font-medium tracking-[0.2em] text-(--text-muted) mb-8"
            >
              {title}
            </motion.h1>
          )}
        </AnimatePresence>

        <motion.div 
          layoutId="time-container"
          className={`flex items-center gap-4 ${compact ? 'flex-row' : 'flex-col justify-center'}`}
        >
          {compact && (
             <motion.span layoutId="hero-date-short" className="text-base font-medium text-(--text-secondary) hidden md:block">
               {shortDateFormatted}
             </motion.span>
          )}

          <motion.div layoutId="clock-display" className="flex items-center font-mono relative overflow-visible">
            <motion.span layout className={`${compact ? 'text-4xl md:text-5xl' : 'text-6xl md:text-8xl lg:text-9xl'} font-light text-(--text-primary) tracking-tight transition-all duration-700`}>{hours}</motion.span>
            <motion.span layout className={`${compact ? 'text-3xl md:text-4xl mx-1' : 'text-5xl md:text-7xl lg:text-8xl mx-2 md:mx-3'} text-(--text-muted) font-light transition-all duration-700`}>:</motion.span>
            <motion.span layout className={`${compact ? 'text-4xl md:text-5xl' : 'text-6xl md:text-8xl lg:text-9xl'} font-light text-(--text-secondary) tracking-tight transition-all duration-700`}>{minutes}</motion.span>
            <motion.span layout className={`${compact ? 'text-3xl md:text-4xl mx-1' : 'text-5xl md:text-7xl lg:text-8xl mx-2 md:mx-3'} text-(--text-muted) font-light transition-all duration-700`}>:</motion.span>
            <motion.span layout className={`${compact ? 'text-4xl md:text-5xl' : 'text-6xl md:text-8xl lg:text-9xl'} font-light text-(--accent-primary) tracking-tight transition-all duration-700 w-[1.5em] text-left`}>{isClient ? seconds : '--'}</motion.span>
          </motion.div>

          {compact && (
            <motion.div layoutId="timezone-pill" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--accent-muted) border border-(--accent-primary)/20 hidden md:flex">
              <svg className="w-4 h-4 text-(--accent-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-(--accent-primary)">{timezoneShort || '...'}</span>
            </motion.div>
          )}
        </motion.div>

        {!compact && (
          <motion.div layoutId="expanded-date-tz" className="flex flex-col items-center gap-3 mt-8">
            <motion.span layoutId="hero-date-full" className="text-base md:text-lg text-(--text-secondary)">{dateFormatted}</motion.span>
            <motion.div layoutId="timezone-pill" className="flex items-center gap-2 px-4 py-2 rounded-full bg-(--accent-muted) border border-(--accent-primary)/20">
              <svg className="w-4 h-4 text-(--accent-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-(--accent-primary)">{isClient ? timezone : 'Loading...'}</span>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {!compact && (
            <motion.div 
              layoutId="local-time-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4 mt-8 w-full max-w-xs"
            >
              <div className="flex-1 h-px bg-linear-to-r from-transparent to-(--border-default)" />
              <span className="text-xs tracking-widest text-(--text-muted)">Local Time</span>
              <div className="flex-1 h-px bg-linear-to-l from-transparent to-(--border-default)" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout
          className={`${compact ? 'w-full sm:w-[450px] md:w-[500px] flex-none z-50' : 'w-full max-w-xl mx-auto mt-12 px-4 z-50 relative'}`}
        >
          {searchComponent}
        </motion.div>

      </div>
    </motion.div>
  );
};

export default HeroSection;

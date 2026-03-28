import React, { useEffect, useRef } from 'react';
import useSWR from 'swr';

import { Timezones, getCurrentTime } from '../utils/timeNow';
import TimestampModal from './TimestampModal';

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) =>
  fetch(input, init).then((res) => res.json());

type TimezoneSearchProps = {
  onTimezoneSelect?: (timezone: Timezones) => void;
};

const RECENT_TIMEZONE_KEY = 'recent-timezone-searches';
const POPULAR_TIMEZONES = [
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Europe/Paris',
  'Australia/Sydney',
];
const QUICK_CHIPS = ['IST', 'UTC', 'EST', 'PST', 'JST'];

/**
 * @description Modern timezone search component
 */
const TimezoneSearch = ({ onTimezoneSelect }: TimezoneSearchProps) => {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Timezones | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [recentTimezones, setRecentTimezones] = React.useState<Timezones[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, error } = useSWR(
    `/api/timezones?search=${search}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem(RECENT_TIMEZONE_KEY) || '[]') as Timezones[];
    setRecentTimezones(recent.slice(0, 4));
  }, []);

  const persistRecent = (item: Timezones) => {
    const existing = JSON.parse(localStorage.getItem(RECENT_TIMEZONE_KEY) || '[]') as Timezones[];
    const deduped = existing.filter((tz) => tz.name !== item.name);
    const next = [item, ...deduped].slice(0, 6);
    localStorage.setItem(RECENT_TIMEZONE_KEY, JSON.stringify(next));
    setRecentTimezones(next.slice(0, 4));
  };

  const getDisplayName = (item: Timezones) => item.city || item.name.split('/').pop()?.replace(/_/g, ' ') || item.name;

  const getDisplayOffset = (item: Timezones) => item.offset || '+00:00';

  const popularMatches = React.useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const byName = new Map<string, Timezones>();
    data.forEach((item: Timezones) => byName.set(item.name, item));
    return POPULAR_TIMEZONES.map((name) => byName.get(name)).filter(Boolean) as Timezones[];
  }, [data]);

  const handleSelect = (item: Timezones) => {
    setSearch('');
    setIsOpen(false);
    persistRecent(item);
    if (onTimezoneSelect) {
      onTimezoneSelect(item);
    } else {
      setSelected(item);
    }
  };

  if (error) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="text-center text-red-400 py-4">
          Failed to load timezones. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto relative">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search timezone, city, abbreviation, or UTC offset..."
          className="w-full h-12 pl-12 pr-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setSearch(chip);
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[11px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && search && data && data.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden animate-fade-in"
        >
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border-default)] scrollbar-track-transparent">
            {data.map((item: Timezones) => (
              <button
                key={item.name}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 text-left hover:bg-[var(--bg-elevated)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--text-primary)]">
                    {item.name}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 truncate">
                  {getDisplayName(item)} {item.country ? `• ${item.country}` : ''} • UTC {getDisplayOffset(item)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {isOpen && !search && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl p-4 space-y-4 animate-fade-in">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Popular timezones</p>
            <div className="flex flex-wrap gap-2">
              {popularMatches.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleSelect(item)}
                  className="px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)] text-xs text-[var(--text-secondary)] transition-colors"
                >
                  {getDisplayName(item)}
                </button>
              ))}
            </div>
          </div>

          {recentTimezones.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">Recent</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentTimezones.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handleSelect(item)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/40 transition-colors"
                  >
                    <span className="text-sm text-[var(--text-primary)]">{getDisplayName(item)}</span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">UTC {getDisplayOffset(item)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            Tip: Try queries like <span className="text-[var(--text-secondary)]">Tokyo</span>, <span className="text-[var(--text-secondary)]">EST</span>, or <span className="text-[var(--text-secondary)]">+05:30</span>.
          </p>
        </div>
      )}

      {/* Empty State */}
      {isOpen && search && data && data.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl p-4">
          <p className="text-center text-[var(--text-muted)]">
            No timezones found for &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Modal */}
      {selected && <TimestampModal timezone={selected} setSelected={setSelected} />}
    </div>
  );
};

export default TimezoneSearch;

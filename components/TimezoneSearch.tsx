import React, { useEffect, useRef } from 'react';
import useSWR from 'swr';

import { Timezones } from '../utils/timeNow';
import TimestampModal from './TimestampModal';

const fetcher = (input: RequestInfo, init: RequestInit, ...args: any[]) =>
  fetch(input, init).then((res) => res.json());

type TimezoneSearchProps = {
  onTimezoneSelect?: (timezone: Timezones) => void;
};

/**
 * @description Modern timezone search component
 */
const TimezoneSearch = ({ onTimezoneSelect }: TimezoneSearchProps) => {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Timezones | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
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

  const handleSelect = (item: Timezones) => {
    setSearch('');
    setIsOpen(false);
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
          placeholder="Search for a timezone or city..."
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
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {item.city}
                    </span>
                    <span className="text-[var(--text-muted)] mx-2">•</span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {item.country}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-[var(--accent-primary)]">
                    {item.offset}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 truncate">
                  {item.name}
                </div>
              </button>
            ))}
          </div>
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

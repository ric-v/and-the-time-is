
import { useEffect, useMemo, useState } from 'react';
import { BiCalendar, BiChevronLeft, BiChevronRight, BiReset, BiTime } from 'react-icons/bi';

export type TimePickerType = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

type timePickerProps = {
  now: Date;
  setDateString: (dateString: TimePickerType) => void;
}

/**
 * @description Timezone search component for Navbar
 */
const TimePicker = ({ now, setDateString }: timePickerProps) => {
  const [selectedDate, setSelectedDate] = useState(() => (now instanceof Date ? new Date(now) : new Date()));
  const [viewMonth, setViewMonth] = useState(() => {
    const baseDate = now instanceof Date ? now : new Date();
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [unixTime, setUnixTime] = useState('');
  const [unixError, setUnixError] = useState('');
  const [showUnixPicker, setShowUnixPicker] = useState(false);

  const pad = (value: number): string => value.toString().padStart(2, '0');

  const formatDisplayDateTime = (date: Date): string => {
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const dateToTimePickerType = (date: Date): TimePickerType => {
    return {
      year: date.getFullYear().toString(),
      month: date.getMonth().toString(),
      day: date.getDate().toString(),
      hour: date.getHours().toString(),
      minute: date.getMinutes().toString(),
      second: date.getSeconds().toString(),
    };
  };

  const parseUnixInputToDate = (value: string): Date => {
    if (!value.trim()) return new Date(Number.NaN);

    if (!/^-?\d+$/.test(value.trim())) return new Date(Number.NaN);

    const normalized = value.trim();
    const absDigits = normalized.replace('-', '').length;

    if (absDigits > 13) {
      return new Date(Number(normalized) / 1_000_000);
    }

    if (absDigits > 10) {
      return new Date(Number(normalized));
    }

    return new Date(Number(normalized) * 1000);
  };

  const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

  const applyUnixValue = () => {
    const parsedDate = parseUnixInputToDate(unixTime);
    if (!isValidDate(parsedDate)) {
      setUnixError('Enter a valid integer unix value (seconds, milliseconds, or nanoseconds).');
      return;
    }

    setUnixError('');
    setSelectedDate(parsedDate);
    setViewMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
    setIsPickerOpen(false);
  };

  const resetToNow = () => {
    const currentDate = new Date();
    setSelectedDate(currentDate);
    setViewMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    setUnixError('');
  };

  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 251 }, (_, idx) => currentYear - 200 + idx);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const days: Array<{ date: Date; inCurrentMonth: boolean }> = [];

    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      days.push({
        date: new Date(year, month - 1, daysInPreviousMonth - i),
        inCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInCurrentMonth; day += 1) {
      days.push({
        date: new Date(year, month, day),
        inCurrentMonth: true,
      });
    }

    const remainder = days.length % 7;
    const trailingSlots = remainder === 0 ? 0 : 7 - remainder;

    for (let day = 1; day <= trailingSlots; day += 1) {
      days.push({
        date: new Date(year, month + 1, day),
        inCurrentMonth: false,
      });
    }

    return days;
  }, [viewMonth]);

  const selectDay = (date: Date) => {
    setSelectedDate((prev) => {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        prev.getHours(),
        prev.getMinutes(),
        prev.getSeconds(),
      );
    });
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const updateTimePart = (part: 'hour' | 'minute' | 'second', value: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (part === 'hour') next.setHours(value);
      if (part === 'minute') next.setMinutes(value);
      if (part === 'second') next.setSeconds(value);
      return next;
    });
  };

  const isSameDay = (first: Date, second: Date): boolean => {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  };

  const jumpToMonthYear = (month: number, year: number) => {
    setViewMonth(new Date(year, month, 1));
    setSelectedDate((prev) => {
      const daysInTargetMonth = new Date(year, month + 1, 0).getDate();
      const nextDay = Math.min(prev.getDate(), daysInTargetMonth);

      return new Date(
        year,
        month,
        nextDay,
        prev.getHours(),
        prev.getMinutes(),
        prev.getSeconds(),
      );
    });
  };

  useEffect(() => {
    setUnixTime(Math.floor(selectedDate.getTime() / 1000).toString());
  }, [selectedDate]);

  useEffect(() => {
    if (!isValidDate(selectedDate)) return;

    setDateString(dateToTimePickerType(selectedDate));
  }, [selectedDate, setDateString]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 p-3 md:p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-primary)]">
            Date And Time
          </p>
          <button
            type="button"
            aria-label="Reset to now"
            onClick={resetToNow}
            className="h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center"
          >
            <BiReset size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsPickerOpen((prev) => !prev)}
          className="mt-2 w-full h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-left text-sm text-[var(--text-primary)] hover:border-[var(--accent-primary)]/40 transition-colors flex items-center justify-between"
          aria-expanded={isPickerOpen}
          aria-controls="custom-datetime-picker"
        >
          <span className="flex items-center gap-2 min-w-0">
            <BiCalendar className="text-[var(--accent-primary)] shrink-0" size={16} />
            <span className="truncate">{formatDisplayDateTime(selectedDate)}</span>
          </span>
          <BiTime className="text-[var(--text-muted)] shrink-0" size={16} />
        </button>

        {isPickerOpen && (
          <div id="custom-datetime-picker" className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="h-8 w-8 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center"
                aria-label="Previous month"
              >
                <BiChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={viewMonth.getMonth()}
                  onChange={(e) => jumpToMonthYear(Number.parseInt(e.target.value, 10), viewMonth.getFullYear())}
                  className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                  aria-label="Select month"
                >
                  {monthNames.map((monthName, idx) => (
                    <option key={monthName} value={idx}>{monthName}</option>
                  ))}
                </select>
                <select
                  value={viewMonth.getFullYear()}
                  onChange={(e) => jumpToMonthYear(viewMonth.getMonth(), Number.parseInt(e.target.value, 10))}
                  className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                  aria-label="Select year"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="h-8 w-8 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center"
                aria-label="Next month"
              >
                <BiChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdayLabels.map((label) => (
                <div key={label} className="text-[10px] text-center text-[var(--text-muted)] uppercase tracking-wide py-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, inCurrentMonth }) => {
                const selected = isSameDay(date, selectedDate);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => selectDay(date)}
                    className={`h-8 rounded-lg text-xs transition-colors ${selected
                      ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] font-semibold'
                      : inCurrentMonth
                        ? 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]/70'}`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Hour</span>
                <select
                  value={selectedDate.getHours()}
                  onChange={(e) => updateTimePart('hour', Number.parseInt(e.target.value, 10))}
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                >
                  {Array.from({ length: 24 }, (_, idx) => idx).map((hour) => (
                    <option key={hour} value={hour}>{pad(hour)}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Minute</span>
                <select
                  value={selectedDate.getMinutes()}
                  onChange={(e) => updateTimePart('minute', Number.parseInt(e.target.value, 10))}
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                >
                  {Array.from({ length: 60 }, (_, idx) => idx).map((minute) => (
                    <option key={minute} value={minute}>{pad(minute)}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Second</span>
                <select
                  value={selectedDate.getSeconds()}
                  onChange={(e) => updateTimePart('second', Number.parseInt(e.target.value, 10))}
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                >
                  {Array.from({ length: 60 }, (_, idx) => idx).map((second) => (
                    <option key={second} value={second}>{pad(second)}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/20 p-3">
        <button
          type="button"
          onClick={() => setShowUnixPicker((prev) => !prev)}
          className="w-full flex items-center justify-between text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-expanded={showUnixPicker}
          aria-controls="unix-picker-panel"
        >
          <span>Paste unix timestamp (optional)</span>
          <span className="text-xs text-[var(--text-muted)]">{showUnixPicker ? 'Hide' : 'Show'}</span>
        </button>

        {showUnixPicker && (
          <div id="unix-picker-panel" className="mt-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                id="epoch-input"
                type="text"
                inputMode="numeric"
                className="h-11 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-colors"
                placeholder="1658279330 / 1658279330000 / 1658279330000000000"
                onChange={(e) => {
                  setUnixTime(e.target.value);
                  if (unixError) setUnixError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyUnixValue();
                  }
                }}
                value={unixTime}
              />
              <button
                type="button"
                onClick={applyUnixValue}
                className="h-11 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                Convert
              </button>
            </div>
            {unixError && (
              <p className="text-sm text-red-500">{unixError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker;

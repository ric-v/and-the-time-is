import React, { useEffect, useState } from 'react';
import Footer from './Footer';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TimezoneSearch from './TimezoneSearch';
import FormatToggle from './FormatToggle';
import { Timezones } from '../utils/timeNow';
import { store } from '../store/store';
import Card from './ui-elements/Card';
import TimePicker, { TimePickerType } from './TimePicker';

type MainProps = {
  page: 'timeis' | 'timewas';
};

/**
 * @description Main component with modern UI layout
 */
const Main = ({ page }: MainProps) => {
  const [timezones, setTimezones] = useState<Timezones[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('%H:%M:%S');
  const [timePickerNow] = useState<Date>(() => new Date());

  const [dateString, setDateString] = useState<TimePickerType>({
    year: new Date().getFullYear().toString(),
    month: new Date().getMonth().toString(),
    day: new Date().getDate().toString(),
    hour: new Date().getHours().toString(),
    minute: new Date().getMinutes().toString(),
    second: new Date().getSeconds().toString(),
  });

  useEffect(() => {
    if (page === 'timewas') {
      store.dispatch({
        type: 'timewas/data',
        payload: new Date(
          Number.parseInt(dateString.year),
          Number.parseInt(dateString.month),
          Number.parseInt(dateString.day),
          Number.parseInt(dateString.hour),
          Number.parseInt(dateString.minute),
          Number.parseInt(dateString.second)
        ).toISOString()
      });
    }
  }, [dateString, page]);

  useEffect(() => {
    // Get date format from localStorage
    const dateFormatLocal = localStorage.getItem('dateFormat') as string;
    if (dateFormatLocal) {
      setSelectedFormat(dateFormatLocal);
      store.dispatch({ type: 'dateformat/update', payload: dateFormatLocal });
    }

    // Get timezones from localStorage
    const isCuratedByUser = localStorage.getItem('timezones-user-curated') === 'true';
    const tzs = JSON.parse(localStorage.getItem('timezones') || '[]') as Timezones[];
    if (tzs && tzs.length > 0 && isCuratedByUser) {
      tzs.forEach((tz) => {
        store.dispatch({ type: 'timezone/add', payload: { timezone: tz, dateFormat: '' } });
      });
    } else if (tzs && tzs.length > 0 && !isCuratedByUser) {
      // Clear legacy seeded cards from earlier versions so first-run UX starts empty.
      localStorage.setItem('timezones', '[]');
    }

    // Update timezones every second
    const interval = setInterval(() => {
      setTimezones(store.getState().storedata.timezones);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTimezoneSelect = (timezone: Timezones) => {
    localStorage.setItem('timezones-user-curated', 'true');
    store.dispatch({ type: 'timezone/add', payload: { timezone, dateFormat: '' } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-(--bg-primary)">
      {/* Navbar */}
      <Navbar page={page} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          title={`And the time ${page === 'timeis' ? 'is' : 'was'}...`}
          page={page}
          compact={page === 'timewas' && timezones.length > 0}
        />

        {/* Search and Controls Section */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {page === 'timewas' && (
            <div className="mb-6 rounded-xl border border-(--border-subtle) bg-(--bg-card) p-4 md:p-6">
              <TimePicker now={timePickerNow} setDateString={setDateString} />
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <TimezoneSearch onTimezoneSelect={handleTimezoneSelect} />
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            {/* Format Toggle */}
            <FormatToggle
              selectedFormat={selectedFormat}
              onFormatChange={setSelectedFormat}
            />
          </div>

          {/* Timezone Cards Grid */}
          {timezones && timezones.length > 0 ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {timezones.map((tzData) => (
                <Card key={tzData.name} tzData={tzData} page={page} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-(--bg-card) border border-(--border-subtle) flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-(--text-muted)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-(--text-primary) mb-2">
                No timezones added yet
              </h3>
              <p className="text-sm text-(--text-muted) max-w-md mx-auto">
                Search for a timezone above to add it to your dashboard. You can add multiple timezones to track time across different regions.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer page={page} />
    </div>
  );
};

export default Main;

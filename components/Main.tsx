import React, { useEffect, useState } from 'react';
import Footer from './Footer';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TimezoneSearch from './TimezoneSearch';
import FormatToggle from './FormatToggle';
import { Timezones } from '../utils/timeNow';
import { store } from '../store/store';
import Card from './ui-elements/Card';

type MainProps = {
  page: 'timeis' | 'timewas';
};

/**
 * @description Main component with modern UI layout
 */
const Main = ({ page }: MainProps) => {
  const [timezones, setTimezones] = useState<Timezones[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('%H:%M:%S');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Get layout from localStorage
    const layoutLocal = localStorage.getItem('layout') as 'grid' | 'list';
    setLayout(layoutLocal || 'grid');

    // Get date format from localStorage
    const dateFormatLocal = localStorage.getItem('dateFormat') as string;
    if (dateFormatLocal) {
      setSelectedFormat(dateFormatLocal);
      store.dispatch({ type: 'dateformat/update', payload: dateFormatLocal });
    }

    // Get timezones from localStorage
    const tzs = JSON.parse(localStorage.getItem('timezones') || '[]') as Timezones[];
    if (tzs && tzs.length > 0) {
      tzs.forEach((tz) => {
        store.dispatch({ type: 'timezone/add', payload: { timezone: tz, dateFormat: '' } });
      });
    }

    // Update timezones every second
    const interval = setInterval(() => {
      setTimezones(store.getState().storedata.timezones);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTimezoneSelect = (timezone: Timezones) => {
    store.dispatch({ type: 'timezone/add', payload: { timezone, dateFormat: '' } });
  };

  const handleLayoutToggle = () => {
    const newLayout = layout === 'grid' ? 'list' : 'grid';
    setLayout(newLayout);
    localStorage.setItem('layout', newLayout);
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
          compact={timezones.length > 0}
        />

        {/* Search and Controls Section */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

            {/* Layout Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLayoutToggle}
                className={`p-2 rounded-lg transition-colors ${
                  layout === 'grid'
                    ? 'bg-(--accent-primary)/10 text-(--accent-primary)'
                    : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={handleLayoutToggle}
                className={`p-2 rounded-lg transition-colors ${
                  layout === 'list'
                    ? 'bg-(--accent-primary)/10 text-(--accent-primary)'
                    : 'text-(--text-muted) hover:text-(--text-primary)'
                }`}
                aria-label="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Timezone Cards Grid */}
          {timezones && timezones.length > 0 ? (
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'flex flex-col gap-3'
              }
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

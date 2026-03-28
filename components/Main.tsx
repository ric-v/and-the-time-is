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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';

type MainProps = {
  page: 'timeis' | 'timewas';
};

/**
 * @description Main component with modern UI layout
 */
const Main = ({ page }: MainProps) => {
  const [timezones, setTimezones] = useState<Timezones[]>([]);
  const [selectedFormat, setSelectedFormat] = useState('%H:%M:%S');
  const [gridCols, setGridCols] = useState(4);
  const [timePickerNow] = useState<Date>(() => new Date());

  const gridColClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

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

    const savedGridCols = localStorage.getItem('gridCols');
    if (savedGridCols) {
      setGridCols(parseInt(savedGridCols, 10));
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

  const handleReorder = (newOrder: Timezones[]) => {
    store.dispatch({ type: 'timezone/reorder', payload: { timezones: newOrder, dateFormat: '' } });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = timezones.findIndex((t) => t.name === active.id);
      const newIndex = timezones.findIndex((t) => t.name === over.id);
      const newOrder = arrayMove(timezones, oldIndex, newIndex);
      handleReorder(newOrder);
    }
  };

  const handleGridColChange = (cols: number) => {
    setGridCols(cols);
    localStorage.setItem('gridCols', cols.toString());
  };

  return (
    <div className="min-h-screen flex flex-col bg-(--bg-primary)">
      {/* Navbar */}
      <Navbar page={page} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero & Header Section */}
        <HeroSection
          title={`And the time ${page === 'timeis' ? 'is' : 'was'}...`}
          page={page}
          compact={timezones.length > 0}
          searchComponent={<TimezoneSearch onTimezoneSelect={handleTimezoneSelect} />}
        />

        {/* Search and Controls Section */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {page === 'timewas' && (
            <div className="mb-6">
              <TimePicker now={timePickerNow} setDateString={setDateString} />
            </div>
          )}

          {/* Search Bar - Moved to HeroSection */}

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-sm font-medium text-(--text-muted) hidden sm:block">Grid</span>
              <div className="flex gap-1 bg-(--bg-card) p-1 rounded-lg border border-(--border-default) w-full sm:w-auto justify-center">
                {[1, 2, 4].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleGridColChange(col)}
                    className={`px-3 py-1.5 rounded-md transition-all flex-1 sm:flex-none flex items-center justify-center ${gridCols === col ? 'bg-(--accent-primary) text-white' : 'text-(--text-muted) hover:text-(--text-primary)'}`}
                    title={`${col} Column${col > 1 ? 's' : ''}`}
                  >
                    {col === 1 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                    )}
                    {col === 2 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
                    )}
                    {col === 4 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><line x1="3" y1="12" x2="21" y2="12"></line></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Toggle */}
            <FormatToggle
              selectedFormat={selectedFormat}
              onFormatChange={setSelectedFormat}
            />
          </div>

          {/* Timezone Cards Grid */}
          {timezones && timezones.length > 0 ? (
            <div className="flex justify-between items-center mb-4">
               {/* Any header content for cards can go here */}
            </div>
          ) : null}
          {timezones && timezones.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={timezones.map(t => t.name)} strategy={rectSortingStrategy}>
                <div className={`grid gap-4 pb-20 transition-all duration-300 ease-in-out ${gridColClasses[gridCols]}`}>
                  {timezones.map((tzData) => (
                    <Card key={tzData.name} tzData={tzData} page={page} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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

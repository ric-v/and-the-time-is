import { useState } from 'react';
import { store } from '../store/store';
import DateFormatModal from './DateFormatModal';

type FormatOption = {
  id: string;
  label: string;
  format: string;
};

const formatOptions: FormatOption[] = [
  { id: 'hhmmss', label: 'HH:MM:SS', format: '%H:%M:%S' },
  { id: '12h', label: '12h AM/PM', format: '%I:%M:%S %p' },
  { id: 'iso8601', label: 'ISO 8601', format: '%Y-%m-%dT%H:%M:%S%z' },
  { id: 'unix', label: 'Unix', format: '%s' },
];

type FormatToggleProps = {
  selectedFormat: string;
  onFormatChange: (format: string) => void;
};

/**
 * @description Modern format toggle component for switching time display formats
 */
const FormatToggle = ({ selectedFormat, onFormatChange }: FormatToggleProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFormatChange = (format: string) => {
    onFormatChange(format);
    store.dispatch({ type: 'dateformat/update', payload: format });
  };

  // Determine if the currently selected format matches one of the defaults
  const isCustomFormat = !formatOptions.find((o) => o.format === selectedFormat);

  return (
    <>
      <div className="flex items-center gap-2 p-1 bg-(--bg-secondary) rounded-xl border border-(--border-subtle)">
        {formatOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => handleFormatChange(option.format)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            selectedFormat === option.format && !isCustomFormat
              ? 'bg-(--accent-primary) text-(--bg-primary)'
              : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated)'
          }`}
        >
          {option.label}
        </button>
      ))}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
          isCustomFormat
            ? 'bg-(--accent-primary) text-(--bg-primary)'
            : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated)'
        }`}
      >
        Custom
      </button>
      </div>

      {isModalOpen && (
        <DateFormatModal
          setFormatPickerSelected={setIsModalOpen}
          onFormatApply={(format) => onFormatChange(format)}
        />
      )}
    </>
  );
};

export default FormatToggle;

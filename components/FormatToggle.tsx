import { store } from '../store/store';

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
  const handleFormatChange = (format: string) => {
    onFormatChange(format);
    store.dispatch({ type: 'dateformat/update', payload: format });
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
      {formatOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => handleFormatChange(option.format)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            selectedFormat === option.format
              ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default FormatToggle;

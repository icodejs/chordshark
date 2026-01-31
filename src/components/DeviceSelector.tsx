import { useState } from 'react';
import type { FC } from 'react';

type MidiStatus = 'initialising' | 'ready' | 'unsupported' | 'error';

interface MidiInputInfo {
  id: string;
  name: string;
}

interface Props {
  status: MidiStatus;
  inputs: MidiInputInfo[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}

const CogIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
      clipRule="evenodd"
    />
  </svg>
);

export const DeviceSelector: FC<Props> = ({ status, inputs, selectedId, onChange }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const statusLabel =
    status === 'initialising'
      ? 'Requesting MIDI access...'
      : status === 'ready'
      ? 'MIDI ready'
      : status === 'unsupported'
      ? 'Web MIDI not supported'
      : 'MIDI error';

  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowDropdown((prev) => !prev)}
          className="flex items-center gap-1.5 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-expanded={showDropdown}
          aria-label={showDropdown ? 'Hide MIDI device options' : 'Show MIDI device options'}
        >
          <CogIcon className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium text-slate-200">MIDI Device</span>
        </button>
        <span className="text-xs text-slate-400">{statusLabel}</span>
      </div>
      {showDropdown && (
        <select
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
          value={selectedId ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={status !== 'ready'}
        >
          <option value="">{inputs.length ? 'Select MIDI input…' : 'No inputs detected'}</option>
          {inputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};


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

export const DeviceSelector: FC<Props> = ({ status, inputs, selectedId, onChange }) => {
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
        <span className="text-sm font-medium text-slate-200">MIDI Device</span>
        <span className="text-xs text-slate-400">{statusLabel}</span>
      </div>
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
    </div>
  );
};


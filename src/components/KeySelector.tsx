import type { FC } from 'react';
import type { KeyMode } from '../app/App';
import { pitchClassToNoteName, getKeyPreferenceForTonic } from '../theory/noteNames';

interface Props {
  tonicPc: number;
  mode: KeyMode;
  onTonicChange: (pc: number) => void;
  onModeChange: (mode: KeyMode) => void;
}

const TONIC_OPTIONS = Array.from({ length: 12 }, (_, pc) => pc);

export const KeySelector: FC<Props> = ({ tonicPc, mode, onTonicChange, onModeChange }) => {
  const pref = getKeyPreferenceForTonic(tonicPc, mode);

  return (
    <div className="flex-1 space-y-1" data-testid="key-selector">
      <span className="text-sm font-medium text-slate-200">Key</span>
      <div className="flex gap-2">
        <select
          data-testid="key-tonic-select"
          aria-label="Key tonic"
          className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          value={tonicPc}
          onChange={(e) => onTonicChange(Number(e.target.value))}
        >
          {TONIC_OPTIONS.map((pc) => (
            <option key={pc} value={pc}>
              {pitchClassToNoteName(pc, pref)}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-0.5 text-xs" role="group" aria-label="Key mode">
          <button
            type="button"
            data-testid="key-mode-major"
            aria-pressed={mode === 'major'}
            onClick={() => onModeChange('major')}
            className={`px-3 py-1 rounded-sm ${
              mode === 'major'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Major
          </button>
          <button
            type="button"
            data-testid="key-mode-minor"
            aria-pressed={mode === 'minor'}
            onClick={() => onModeChange('minor')}
            className={`px-3 py-1 rounded-sm ${
              mode === 'minor'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            Minor
          </button>
        </div>
      </div>
    </div>
  );
};


import type { DiatonicChord } from '../theory/chordTheory';

export type TestChordFilter = 'triad' | '7th' | 'all';

export interface GameSelectorProps {
  testActive: boolean;
  setTestActive: (active: boolean) => void;
  testChordPoolLength: number;
  setTestCorrectFlash: (flash: boolean) => void;
  setTargetChord: (chord: DiatonicChord | null) => void;
  pickRandomTestChord: (exclude: DiatonicChord | null) => DiatonicChord | null;
  testCorrectTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  testChordFilter: TestChordFilter;
  setTestChordFilter: (filter: TestChordFilter) => void;
}

/**
 * UI for starting, selecting and configuring games.
 * Currently: practice mode (test me) and chord type filter.
 */
export function GameSelector({
  testActive,
  setTestActive,
  testChordPoolLength,
  setTestCorrectFlash,
  setTargetChord,
  pickRandomTestChord,
  testCorrectTimeoutRef,
  testChordFilter,
  setTestChordFilter,
}: GameSelectorProps) {
  return (
    <>
      <span className="text-sm font-medium text-slate-200">Practice</span>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            data-testid="test-me-button"
            disabled={testActive || testChordPoolLength === 0}
            onClick={() => {
              setTestActive(true);
              setTestCorrectFlash(false);
              setTargetChord(pickRandomTestChord(null));
            }}
            className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-700 hover:border-slate-500 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
          >
            Test me
          </button>
          {testActive && (
            <button
              type="button"
              data-testid="stop-test-button"
              onClick={() => {
                setTestActive(false);
                setTargetChord(null);
                setTestCorrectFlash(false);
                if (testCorrectTimeoutRef.current !== null) {
                  clearTimeout(testCorrectTimeoutRef.current);
                  testCorrectTimeoutRef.current = null;
                }
              }}
              className="rounded-md border border-amber-600/60 bg-amber-900/40 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-800/50 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              Stop test
            </button>
          )}
        </div>
        <fieldset className="flex flex-wrap gap-3" role="radiogroup" aria-label="Chord types to test">
          {(['triad', '7th', 'all'] as const).map((filter) => (
            <label key={filter} className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="testChordFilter"
                value={filter}
                checked={testChordFilter === filter}
                onChange={() => setTestChordFilter(filter)}
                disabled={testActive}
                className="rounded-full border-slate-600 text-sky-500 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-300 capitalize">{filter}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </>
  );
}

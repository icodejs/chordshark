import type { FC } from 'react';
import type { DiatonicChord } from '../theory/chordTheory';

interface Props {
  recognisedChord: DiatonicChord | null;
  inversionLabel: string | null;
}

export const RecognitionPanel: FC<Props> = ({ recognisedChord, inversionLabel }) => {
  const isRecognised = Boolean(recognisedChord);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Chord recognition</h2>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            isRecognised
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/40'
              : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/40'
          }`}
        >
          {isRecognised ? '✓' : '×'}
        </span>
        <div className="text-sm">
          {isRecognised ? (
            <p className="text-slate-100">
              <span className="font-medium">Recognised:</span>{' '}
              <span className="font-semibold">
                {recognisedChord?.degree}{' '}
                <span className="text-xs font-normal text-slate-400">
                  ({recognisedChord?.type === 'triad' ? 'triad' : '7th'})
                </span>
              </span>
              {inversionLabel && (
                <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  {inversionLabel}
                </span>
              )}
            </p>
          ) : (
            <p className="text-slate-400">Not recognised as a diatonic triad or 7th in this key.</p>
          )}
        </div>
      </div>
    </div>
  );
};


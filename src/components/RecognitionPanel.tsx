import type { FC } from 'react';
import type { DiatonicChord } from '../theory/chordTheory';
import type { RecognitionInputState } from '../app/recognitionTypes';

interface Props {
  recognitionState: RecognitionInputState;
  recognisedChord: DiatonicChord | null;
  chordName: string | null;
  inversionLabel: string | null;
  keyDisplayName: string;
}

export const RecognitionPanel: FC<Props> = ({
  recognitionState,
  recognisedChord,
  chordName,
  inversionLabel,
  keyDisplayName,
}) => {
  const isSuccess = recognitionState === 'success';
  const isMismatch = recognitionState === 'mismatch';
  const isListening = recognitionState === 'listening';

  if (recognitionState === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-[7.5rem]" data-testid="recognition-placeholder">
        <p className="text-slate-500 text-sm font-medium tracking-wide">
          Play a chord to see recognition
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border-2 p-6 transition-all duration-200 min-h-[7.5rem] flex ${
        isSuccess
          ? 'border-emerald-500/60 bg-emerald-950/40 shadow-[0_0_24px_rgba(16,185,129,0.12)]'
          : isMismatch
            ? 'border-amber-500/50 bg-amber-950/30 shadow-[0_0_24px_rgba(245,158,11,0.1)]'
            : 'border-slate-600/50 bg-slate-800/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
        <div
          className={`flex-shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ring-2 ${
            isSuccess
              ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/50'
              : isMismatch
                ? 'bg-amber-500/20 text-amber-300 ring-amber-500/50'
                : 'bg-slate-500/20 text-slate-400 ring-slate-500/50'
          }`}
        >
          {isSuccess ? '✓' : isMismatch ? '○' : '…'}
        </div>
        <div className="flex-1 min-w-0 min-h-[3.5rem] flex flex-col justify-center">
          {isSuccess ? (
            <>
              <p className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-1">
                Diatonic chord
              </p>
              {chordName && (
                <p className="text-2xl sm:text-3xl font-bold text-emerald-100 tracking-tight leading-tight mb-1">
                  {chordName}
                </p>
              )}
              <p className="text-lg sm:text-xl font-semibold text-slate-50 tracking-tight leading-tight">
                {recognisedChord?.degree}
                <span className="text-base font-normal text-slate-400 ml-2">
                  {recognisedChord?.type === 'triad' ? 'triad' : '7th'}
                </span>
                {inversionLabel && (
                  <span className="ml-3 inline-flex items-center rounded-full bg-slate-700/80 px-3 py-1 text-sm font-medium text-slate-200">
                    {inversionLabel}
                  </span>
                )}
              </p>
            </>
          ) : isMismatch ? (
            <>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                Not in key
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-amber-200/90 leading-tight">
                Not diatonic to {keyDisplayName}
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">
                {isListening ? 'Listening…' : 'Analysing chord…'}
              </p>
              <p className="text-lg text-slate-300 leading-tight">
                Hold a triad or 7th to see recognition
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


import type { FC } from 'react';

interface Props {
  activeNoteNumbers: number[];
  noteNames: string[];
}

export const HeldNotes: FC<Props> = ({ activeNoteNumbers, noteNames }) => {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Held notes</h2>
      {activeNoteNumbers.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Play some notes on your MIDI keyboard.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {noteNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100"
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};


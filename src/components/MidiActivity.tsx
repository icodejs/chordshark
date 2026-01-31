export interface MidiActivityProps {
  active: boolean;
}

/**
 * Fixed-position MIDI activity indicator (dot + label).
 */
export function MidiActivity({ active }: MidiActivityProps) {
  return (
    <>
      <div
        className={`h-3 w-3 rounded-full border border-yellow-300 shadow-[0_0_0_1px_rgba(250,204,21,0.4)] transition-[transform,opacity] duration-150 ${
          active
            ? 'bg-yellow-300 opacity-100 scale-110 shadow-[0_0_10px_rgba(250,204,21,0.9)]'
            : 'bg-yellow-300/20 opacity-40 scale-90'
        }`}
      />
      <span className="uppercase tracking-[0.16em]">MIDI</span>
    </>
  );
}

import type { KeyMode } from '../app/App';

export type KeyPreference = 'sharps' | 'flats';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export function midiNoteToPitchClass(noteNumber: number): number {
  return ((noteNumber % 12) + 12) % 12;
}

export function getKeyPreferenceForTonic(tonicPc: number, _mode: KeyMode): KeyPreference {
  // Simple, explicit mapping per tonic pitch class.
  // This is easy to extend later if you want more nuanced behavior.
  switch (tonicPc % 12) {
    case 1: // Db / C#
    case 3: // Eb
    case 6: // Gb / F#
    case 8: // Ab
    case 10: // Bb
      return 'flats';
    default:
      return 'sharps';
  }
}

export function pitchClassToNoteName(pc: number, pref: KeyPreference): string {
  const index = ((pc % 12) + 12) % 12;
  return pref === 'flats' ? FLAT_NAMES[index] : SHARP_NAMES[index];
}

export function pitchClassSetToNoteNames(pcs: number[], pref: KeyPreference): string[] {
  return pcs.map((pc) => pitchClassToNoteName(pc, pref));
}


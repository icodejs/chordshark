import { Note } from 'tonal';
import type { KeyMode } from '../app/App';

export type KeyPreference = 'sharps' | 'flats';

const FLAT_PCS = new Set<string>(['Db', 'Eb', 'Gb', 'Ab', 'Bb']);

export function midiNoteToPitchClass(noteNumber: number): number {
  const chroma = Note.chroma(Note.fromMidi(noteNumber));
  return chroma ?? (((noteNumber % 12) + 12) % 12);
}

export function getKeyPreferenceForTonic(tonicPc: number, mode: KeyMode): KeyPreference {
  void mode; // reserved for mode-specific key preference (e.g. minor keys)
  switch (tonicPc % 12) {
    case 1:
    case 3:
    case 6:
    case 8:
    case 10:
      return 'flats';
    default:
      return 'sharps';
  }
}

export function pitchClassToNoteName(pc: number, pref: KeyPreference): string {
  const normalised = ((pc % 12) + 12) % 12;
  const base = Note.get(Note.fromMidi(60 + normalised)).pc ?? 'C';
  if (pref === 'sharps' && FLAT_PCS.has(base)) {
    return Note.enharmonic(base) ?? base;
  }
  return base;
}

export function pitchClassSetToNoteNames(pcs: number[], pref: KeyPreference): string[] {
  return pcs.map((pc) => pitchClassToNoteName(pc, pref));
}

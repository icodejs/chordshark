import { Chord, Key, Note } from 'tonal';
import type { KeyMode } from '../app/App';
import {
  getKeyPreferenceForTonic,
  midiNoteToPitchClass,
  pitchClassToNoteName,
} from './noteNames';

export type TriadQuality = 'maj' | 'min' | 'dim' | 'aug';
export type SeventhQuality = 'dom7' | 'maj7' | 'min7' | 'hdim7';

export type ChordQuality = TriadQuality | SeventhQuality;

export interface DiatonicChord {
  id: string;
  symbol: string; // e.g. "Cmaj7", "Dm" – used for display
  pcs: number[]; // sorted pitch classes, length 3 or 4
  degree: string;
  quality: ChordQuality;
  type: 'triad' | '7th';
  rootPc: number;
}

/** Normalise input to sorted unique pitch classes (0–11). Accepts MIDI note numbers or raw PCs. */
export function normalisePitchClassSet(input: Iterable<number>): number[] {
  const set = new Set<number>();
  for (const n of input) {
    const pc = ((n % 12) + 12) % 12;
    set.add(pc);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function chordSymbolToPcs(symbol: string): number[] {
  const c = Chord.get(symbol);
  if (!c.notes.length) return [];
  return c.notes.map((n) => Note.chroma(n)!) as number[];
}

function buildDiatonicChordsForKey(
  tonicPc: number,
  mode: KeyMode
): DiatonicChord[] {
  const keyPref = getKeyPreferenceForTonic(tonicPc, mode);
  const tonicName = pitchClassToNoteName(tonicPc, keyPref);

  const keySource =
    mode === 'major'
      ? Key.majorKey(tonicName)
      : Key.minorKey(tonicName).natural;

  const triads = keySource.triads as string[];
  const chords = keySource.chords as string[];

  const triadDegreesMajor = [
    'I',
    'ii',
    'iii',
    'IV',
    'V',
    'vi',
    'vii°',
  ] as const;
  const triadDegreesMinor = [
    'i',
    'ii°',
    'III',
    'iv',
    'v',
    'VI',
    'VII',
  ] as const;
  const seventhDegreesMajor = [
    'I',
    'ii',
    'iii',
    'IV',
    'V',
    'vi',
    'viiø',
  ] as const;
  const seventhDegreesMinor = [
    'i',
    'iiø',
    'III',
    'iv',
    'v',
    'VI',
    'VII',
  ] as const;

  const triadDegrees = mode === 'major' ? triadDegreesMajor : triadDegreesMinor;
  const seventhDegrees =
    mode === 'major' ? seventhDegreesMajor : seventhDegreesMinor;

  const result: DiatonicChord[] = [];

  for (let i = 0; i < 7; i += 1) {
    const triadSymbol = triads[i];
    const seventhSymbol = chords[i];
    const triadPcs = chordSymbolToPcs(triadSymbol);
    const seventhPcs = chordSymbolToPcs(seventhSymbol);
    const rootPc = triadPcs[0] ?? 0;

    result.push({
      id: `${mode}-${tonicPc}-triad-${i}`,
      symbol: triadSymbol,
      pcs: triadPcs,
      degree: triadDegrees[i],
      quality: inferTriadQuality(triadSymbol),
      type: 'triad',
      rootPc,
    });

    result.push({
      id: `${mode}-${tonicPc}-7th-${i}`,
      symbol: seventhSymbol,
      pcs: seventhPcs,
      degree: seventhDegrees[i],
      quality: inferSeventhQuality(seventhSymbol),
      type: '7th',
      rootPc,
    });
  }

  return result;
}

function inferTriadQuality(symbol: string): TriadQuality {
  const s = symbol.toLowerCase();
  if (s.endsWith('dim')) return 'dim';
  if (s.endsWith('aug') || s.includes('aug')) return 'aug';
  if (s.includes('m') && !s.includes('maj') && !s.includes('m7')) return 'min';
  return 'maj';
}

function inferSeventhQuality(symbol: string): SeventhQuality {
  const s = symbol.toLowerCase();
  if (s.endsWith('m7b5') || s.endsWith('mb5')) return 'hdim7';
  if (s.endsWith('maj7') || s.endsWith('major7')) return 'maj7';
  if (s.includes('m7') || (s.includes('m') && s.endsWith('7'))) return 'min7';
  if (s.endsWith('7')) return 'dom7';
  return 'maj7';
}

/** Build diatonic triads and seventh chords for the given key. */
export { buildDiatonicChordsForKey };

export function recogniseChord(
  activePcs: number[],
  chords: DiatonicChord[]
): DiatonicChord | null {
  const normalisedActive = normalisePitchClassSet(activePcs);
  for (const chord of chords) {
    if (chord.pcs.length !== normalisedActive.length) continue;
    // chord.pcs are in chord order (root, third, fifth); normalisedActive is sorted. Compare as sets.
    const chordPcsSorted = [...chord.pcs].sort((a, b) => a - b);
    let match = true;
    for (let i = 0; i < chordPcsSorted.length; i += 1) {
      if (chordPcsSorted[i] !== normalisedActive[i]) {
        match = false;
        break;
      }
    }
    if (match) return chord;
  }
  return null;
}

export function detectInversionLabel(
  activeNoteNumbers: number[],
  chord: DiatonicChord
): string | null {
  if (activeNoteNumbers.length === 0) return null;
  const sorted = [...activeNoteNumbers].sort((a, b) => a - b);
  const bassPc = midiNoteToPitchClass(sorted[0]);

  const [root, third, fifth, seventh] =
    chord.pcs.length === 3
      ? [chord.pcs[0], chord.pcs[1], chord.pcs[2], -1]
      : [chord.pcs[0], chord.pcs[1], chord.pcs[2], chord.pcs[3]];

  if (bassPc === root) return 'root';
  if (bassPc === third) return '1st inv';
  if (bassPc === fifth) return '2nd inv';
  if (chord.pcs.length === 4 && bassPc === seventh) return '3rd inv';
  return null;
}

/** Display name for a recognised chord. Uses tonal's chord symbol (key spelling already applied). */
export function getChordDisplayName(chord: DiatonicChord): string {
  return chord.symbol;
}

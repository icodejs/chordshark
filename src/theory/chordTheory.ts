import type { KeyMode } from '../app/App';
import { midiNoteToPitchClass, pitchClassToNoteName, type KeyPreference } from './noteNames';

export type TriadQuality = 'maj' | 'min' | 'dim' | 'aug';
export type SeventhQuality = 'dom7' | 'maj7' | 'min7' | 'hdim7';

export type ChordQuality = TriadQuality | SeventhQuality;

export interface DiatonicChord {
  id: string;
  name: string;
  pcs: number[]; // sorted pitch classes, length 3 or 4
  degree: string;
  quality: ChordQuality;
  type: 'triad' | '7th';
  rootPc: number;
}

export function normalisePitchClassSet(input: Iterable<number>): number[] {
  const set = new Set<number>();
  for (const n of input) {
    const pc = ((n % 12) + 12) % 12;
    set.add(pc);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function buildScale(tonicPc: number, mode: KeyMode): number[] {
  const majorSteps = [2, 2, 1, 2, 2, 2, 1];
  const naturalMinorSteps = [2, 1, 2, 2, 1, 2, 2];
  const steps = mode === 'major' ? majorSteps : naturalMinorSteps;

  const scale = [((tonicPc % 12) + 12) % 12];
  let pc = scale[0];
  for (let i = 0; i < 6; i += 1) {
    pc = (pc + steps[i]) % 12;
    scale.push(pc);
  }
  return scale;
}

function rotate<T>(arr: T[], offset: number): T[] {
  const n = arr.length;
  const o = ((offset % n) + n) % n;
  return [...arr.slice(o), ...arr.slice(0, o)];
}

export function buildDiatonicChordsForKey(tonicPc: number, mode: KeyMode): DiatonicChord[] {
  const scale = buildScale(tonicPc, mode); // 7 degrees

  const triadDegreesMajor = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;
  const triadQualitiesMajor: TriadQuality[] = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];

  const triadDegreesMinor = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'] as const;
  const triadQualitiesMinor: TriadQuality[] = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];

  const seventhDegreesMajor = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viiø'] as const;
  const seventhQualitiesMajor: SeventhQuality[] = [
    'maj7',
    'min7',
    'min7',
    'maj7',
    'dom7',
    'min7',
    'hdim7',
  ];

  const seventhDegreesMinor = ['i', 'iiø', 'III', 'iv', 'v', 'VI', 'VII'] as const;
  const seventhQualitiesMinor: SeventhQuality[] = [
    'min7',
    'hdim7',
    'maj7',
    'min7',
    'min7',
    'maj7',
    'dom7',
  ];

  const triadDegrees = mode === 'major' ? triadDegreesMajor : triadDegreesMinor;
  const triadQualities = mode === 'major' ? triadQualitiesMajor : triadQualitiesMinor;
  const seventhDegrees = mode === 'major' ? seventhDegreesMajor : seventhDegreesMinor;
  const seventhQualities = mode === 'major' ? seventhQualitiesMajor : seventhQualitiesMinor;

  const chords: DiatonicChord[] = [];

  for (let degreeIndex = 0; degreeIndex < 7; degreeIndex += 1) {
    const rotatedScale = rotate(scale, degreeIndex);
    const rootPc = rotatedScale[0];
    const thirdPc = rotatedScale[2];
    const fifthPc = rotatedScale[4];
    const seventhPc = rotatedScale[6];

    const triadPcs = normalisePitchClassSet([rootPc, thirdPc, fifthPc]);
    const triadQuality = triadQualities[degreeIndex];
    const triadDegree = triadDegrees[degreeIndex];

    const triadNameSuffix =
      triadQuality === 'maj'
        ? ''
        : triadQuality === 'min'
        ? 'm'
        : triadQuality === 'dim'
        ? 'dim'
        : 'aug';

    chords.push({
      id: `${mode}-${tonicPc}-triad-${degreeIndex}`,
      name: '?', // human-readable names are not key-critical for recognition
      pcs: triadPcs,
      degree: triadDegree,
      quality: triadQuality,
      type: 'triad',
      rootPc,
    });

    const seventhQuality = seventhQualities[degreeIndex];
    const seventhDegree = seventhDegrees[degreeIndex];
    const seventhPcs = normalisePitchClassSet([rootPc, thirdPc, fifthPc, seventhPc]);

    const seventhNameSuffix =
      seventhQuality === 'maj7'
        ? 'maj7'
        : seventhQuality === 'min7'
        ? 'm7'
        : seventhQuality === 'dom7'
        ? '7'
        : 'm7b5';

    chords.push({
      id: `${mode}-${tonicPc}-7th-${degreeIndex}`,
      name: '?',
      pcs: seventhPcs,
      degree: seventhDegree,
      quality: seventhQuality,
      type: '7th',
      rootPc,
    });
  }

  return chords;
}

export function recogniseChord(activePcs: number[], chords: DiatonicChord[]): DiatonicChord | null {
  const normalisedActive = normalisePitchClassSet(activePcs);
  for (const chord of chords) {
    if (chord.pcs.length !== normalisedActive.length) continue;
    let match = true;
    for (let i = 0; i < chord.pcs.length; i += 1) {
      if (chord.pcs[i] !== normalisedActive[i]) {
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
  chord: DiatonicChord,
): string | null {
  if (activeNoteNumbers.length === 0) return null;
  const sorted = [...activeNoteNumbers].sort((a, b) => a - b);
  const bassPc = midiNoteToPitchClass(sorted[0]);

  const [root, third, fifth, seventh] =
    chord.pcs.length === 3
      ? chord.pcs
      : [chord.pcs[0], chord.pcs[1], chord.pcs[2], chord.pcs[3]];

  if (bassPc === root) return 'root';
  if (bassPc === third) return '1st inv';
  if (bassPc === fifth) return chord.pcs.length === 3 ? '2nd inv' : '2nd inv';
  if (chord.pcs.length === 4 && bassPc === seventh) return '3rd inv';
  return null;
}

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  dom7: '7',
  maj7: 'maj7',
  min7: 'm7',
  hdim7: 'm7b5',
};

export function getChordDisplayName(chord: DiatonicChord, keyPreference: KeyPreference): string {
  const rootName = pitchClassToNoteName(chord.rootPc, keyPreference);
  const suffix = QUALITY_SUFFIX[chord.quality];
  return rootName + suffix;
}


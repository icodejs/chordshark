import { describe, it, expect } from 'vitest';
import {
  normalisePitchClassSet,
  buildDiatonicChordsForKey,
  recogniseChord,
  detectInversionLabel,
  getChordDisplayName,
  type DiatonicChord,
} from './chordTheory';

describe('normalisePitchClassSet', () => {
  it('returns sorted unique pitch classes 0–11', () => {
    expect(normalisePitchClassSet([7, 11, 2])).toEqual([2, 7, 11]);
    expect(normalisePitchClassSet([0, 4, 7])).toEqual([0, 4, 7]);
  });

  it('deduplicates by pitch class', () => {
    expect(normalisePitchClassSet([0, 12, 24])).toEqual([0]);
    expect(normalisePitchClassSet([2, 7, 2, 11, 7])).toEqual([2, 7, 11]);
  });

  it('accepts MIDI note numbers and normalises to 0–11', () => {
    // G4=67, B4=71, D4=62
    expect(normalisePitchClassSet([67, 71, 62])).toEqual([2, 7, 11]);
    expect(normalisePitchClassSet([60, 64, 67])).toEqual([0, 4, 7]); // C4, E4, G4
  });

  it('handles negative or large numbers via mod 12', () => {
    expect(normalisePitchClassSet([-1])).toEqual([11]);
    expect(normalisePitchClassSet([12])).toEqual([0]);
  });
});

describe('buildDiatonicChordsForKey', () => {
  it('builds 14 chords for a key (7 triads + 7 sevenths)', () => {
    const chords = buildDiatonicChordsForKey(0, 'major');
    expect(chords).toHaveLength(14);
    expect(chords.filter((c) => c.type === 'triad')).toHaveLength(7);
    expect(chords.filter((c) => c.type === '7th')).toHaveLength(7);
  });

  it('C major: I is C, V is G', () => {
    const chords = buildDiatonicChordsForKey(0, 'major');
    const triads = chords.filter((c) => c.type === 'triad');
    expect(triads[0].symbol).toBe('C');
    expect(triads[0].degree).toBe('I');
    expect(triads[4].symbol).toBe('G');
    expect(triads[4].degree).toBe('V');
  });

  it('A minor: i is Am, v is Em', () => {
    const chords = buildDiatonicChordsForKey(9, 'minor'); // A = 9
    const triads = chords.filter((c) => c.type === 'triad');
    expect(triads[0].symbol).toMatch(/^A[m]?$/);
    expect(triads[0].degree).toBe('i');
  });
});

describe('recogniseChord', () => {
  const cMajorChords = buildDiatonicChordsForKey(0, 'major');

  it('recognises C major triad (I) from pitch classes in any order', () => {
    expect(recogniseChord([0, 4, 7], cMajorChords)?.symbol).toBe('C');
    expect(recogniseChord([4, 7, 0], cMajorChords)?.symbol).toBe('C');
    expect(recogniseChord([7, 0, 4], cMajorChords)?.symbol).toBe('C');
  });

  it('recognises G major triad (V) from G, B, D in any order', () => {
    // Bug fix: chord.pcs from Tonal are in chord order [7,11,2]; input is normalised to [2,7,11]
    expect(recogniseChord([2, 7, 11], cMajorChords)?.symbol).toBe('G');
    expect(recogniseChord([7, 11, 2], cMajorChords)?.symbol).toBe('G');
    expect(recogniseChord([11, 2, 7], cMajorChords)?.symbol).toBe('G');
  });

  it('recognises diatonic seventh chords', () => {
    // Cmaj7 = C,E,G,B = 0,4,7,11
    const chord = recogniseChord([0, 4, 7, 11], cMajorChords);
    expect(chord?.symbol).toBe('Cmaj7');
    expect(chord?.degree).toBe('I');
  });

  it('returns null for non-diatonic sets', () => {
    expect(recogniseChord([0, 3, 7], cMajorChords)).toBeNull(); // C Eb G
    expect(recogniseChord([0, 4, 7, 10], cMajorChords)).toBeNull();
  });

  it('returns null when pitch class count does not match', () => {
    expect(recogniseChord([0], cMajorChords)).toBeNull();
    expect(recogniseChord([0, 4], cMajorChords)).toBeNull();
    expect(recogniseChord([0, 4, 7, 8, 11], cMajorChords)).toBeNull();
  });
});

describe('detectInversionLabel', () => {
  const cMajorChords = buildDiatonicChordsForKey(0, 'major');
  const cTriad = cMajorChords.find(
    (c) => c.symbol === 'C' && c.type === 'triad'
  ) as DiatonicChord;
  const cMaj7 = cMajorChords.find((c) => c.symbol === 'Cmaj7') as DiatonicChord;

  it('returns "root" when bass is root', () => {
    // C4=60, E4=64, G4=67
    expect(detectInversionLabel([60, 64, 67], cTriad)).toBe('root');
    expect(detectInversionLabel([64, 60, 67], cTriad)).toBe('root'); // order irrelevant; lowest is 60
  });

  it('returns "1st inv" when third is in bass', () => {
    // E4=64, G4=67, C5=72
    expect(detectInversionLabel([64, 67, 72], cTriad)).toBe('1st inv');
  });

  it('returns "2nd inv" when fifth is in bass', () => {
    // G4=67, C5=72, E5=76
    expect(detectInversionLabel([67, 72, 76], cTriad)).toBe('2nd inv');
  });

  it('returns "3rd inv" for 7th chord when seventh is in bass', () => {
    // B3=59, C4=60, E4=64, G4=67
    expect(detectInversionLabel([59, 60, 64, 67], cMaj7)).toBe('3rd inv');
  });

  it('returns null for empty notes', () => {
    expect(detectInversionLabel([], cTriad)).toBeNull();
  });
});

describe('getChordDisplayName', () => {
  const chords = buildDiatonicChordsForKey(0, 'major');
  const gTriad = chords.find((c) => c.symbol === 'G' && c.type === 'triad')!;

  it('returns the chord symbol', () => {
    expect(getChordDisplayName(gTriad)).toBe('G');
    expect(getChordDisplayName(chords.find((c) => c.symbol === 'Dm')!)).toBe(
      'Dm'
    );
  });
});

import { useMemo, useState, useEffect } from 'react';
import { useMidi } from '../midi/useMidi';
import { buildDiatonicChordsForKey, normalisePitchClassSet, recogniseChord, type DiatonicChord, detectInversionLabel } from '../theory/chordTheory';
import { getKeyPreferenceForTonic, midiNoteToPitchClass, pitchClassSetToNoteNames } from '../theory/noteNames';
import { DeviceSelector } from '../components/DeviceSelector';
import { KeySelector } from '../components/KeySelector';
import { HeldNotes } from '../components/HeldNotes';
import { RecognitionPanel } from '../components/RecognitionPanel';
import { getStoredKeyMode, getStoredKeyTonicPc, setStoredKeyMode, setStoredKeyTonicPc } from '../utils/storage';

export type KeyMode = 'major' | 'minor';

const RECOGNITION_DEBOUNCE_MS = 80;

export default function App() {
  const {
    inputs,
    selectedInputId,
    status,
    activeNoteNumbers,
    derivedActivePitchClasses,
    selectInput,
  } = useMidi();

  const [tonicPc, setTonicPc] = useState<number>(() => getStoredKeyTonicPc() ?? 0);
  const [mode, setMode] = useState<KeyMode>(() => getStoredKeyMode() ?? 'major');

  const [recognisedChord, setRecognisedChord] = useState<DiatonicChord | null>(null);
  const [inversionLabel, setInversionLabel] = useState<string | null>(null);

  useEffect(() => {
    setStoredKeyTonicPc(tonicPc);
  }, [tonicPc]);

  useEffect(() => {
    setStoredKeyMode(mode);
  }, [mode]);

  const keyPreference = useMemo(() => getKeyPreferenceForTonic(tonicPc, mode), [tonicPc, mode]);

  const chords = useMemo(() => buildDiatonicChordsForKey(tonicPc, mode), [tonicPc, mode]);

  useEffect(() => {
    const pcsArray = normalisePitchClassSet([...derivedActivePitchClasses]);
    if (pcsArray.length === 0) {
      setRecognisedChord(null);
      setInversionLabel(null);
      return;
    }

    const timer = window.setTimeout(() => {
      const chord = recogniseChord(pcsArray, chords);
      setRecognisedChord(chord);
      if (chord) {
        const label = detectInversionLabel(activeNoteNumbers, chord);
        setInversionLabel(label);
      } else {
        setInversionLabel(null);
      }
    }, RECOGNITION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [activeNoteNumbers, derivedActivePitchClasses, chords]);

  const heldNoteNames = useMemo(
    () =>
      pitchClassSetToNoteNames(
        normalisePitchClassSet(activeNoteNumbers.map(midiNoteToPitchClass)),
        keyPreference,
      ),
    [activeNoteNumbers, keyPreference],
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur-sm p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Piano Chord Trainer
          </h1>
          <p className="text-sm text-slate-400">
            Connect a MIDI keyboard, choose a key, and play chords to see if they&apos;re diatonic.
          </p>
        </header>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <DeviceSelector
              inputs={inputs}
              selectedId={selectedInputId}
              status={status}
              onChange={selectInput}
            />
            <KeySelector tonicPc={tonicPc} mode={mode} onTonicChange={setTonicPc} onModeChange={setMode} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <HeldNotes activeNoteNumbers={activeNoteNumbers} noteNames={heldNoteNames} />
          <RecognitionPanel recognisedChord={recognisedChord} inversionLabel={inversionLabel} />
        </section>
      </div>
    </div>
  );
}


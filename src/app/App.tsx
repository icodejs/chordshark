import { useMemo, useState, useEffect, useRef } from 'react';
import { useMidi } from '../midi/useMidi';
import {
  buildDiatonicChordsForKey,
  normalisePitchClassSet,
  recogniseChord,
  type DiatonicChord,
  detectInversionLabel,
  getChordDisplayName,
} from '../theory/chordTheory';
import {
  getKeyPreferenceForTonic,
  midiNoteToPitchClass,
  pitchClassSetToNoteNames,
  pitchClassToNoteName,
} from '../theory/noteNames';
import { DeviceSelector } from '../components/DeviceSelector';
import { GameSelector, type TestChordFilter } from '../components/GameSelector';
import { HeldNotes } from '../components/HeldNotes';
import { MidiActivity } from '../components/MidiActivity';
import { KeySelector } from '../components/KeySelector';
import { RecognitionPanel } from '../components/RecognitionPanel';
import {
  getStoredKeyMode,
  getStoredKeyTonicPc,
  setStoredKeyMode,
  setStoredKeyTonicPc,
} from '../utils/storage';
import type { RecognitionInputState } from './recognitionTypes';

export type KeyMode = 'major' | 'minor';

export type { TestChordFilter } from '../components/GameSelector';

/** Delay before evaluating chord so input can stabilise (avoids flicker). */
const RECOGNITION_DEBOUNCE_MS = 150;
/** Minimum unique pitch classes before we evaluate (triad = 3, 7th = 4). */
const MIN_PITCH_CLASSES_FOR_EVALUATION = 3;
/** Delay before showing next chord after correct answer in test mode. */
const TEST_CORRECT_DELAY_MS = 1600;

export type { RecognitionInputState } from './recognitionTypes';

export default function App() {
  const {
    inputs,
    selectedInputId,
    status,
    activeNoteNumbers,
    derivedActivePitchClasses,
    hasRecentMidiActivity,
    selectInput,
  } = useMidi();

  const [tonicPc, setTonicPc] = useState<number>(
    () => getStoredKeyTonicPc() ?? 0
  );
  const [mode, setMode] = useState<KeyMode>(
    () => getStoredKeyMode() ?? 'major'
  );

  const [evaluatedPcs, setEvaluatedPcs] = useState<number[] | null>(null);
  const [recognisedChord, setRecognisedChord] = useState<DiatonicChord | null>(
    null
  );
  const [inversionLabel, setInversionLabel] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [testActive, setTestActive] = useState(false);
  const [testChordFilter, setTestChordFilter] =
    useState<TestChordFilter>('triad');
  const [targetChord, setTargetChord] = useState<DiatonicChord | null>(null);
  const [testCorrectFlash, setTestCorrectFlash] = useState(false);
  const testCorrectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    setStoredKeyTonicPc(tonicPc);
  }, [tonicPc]);

  useEffect(() => {
    setStoredKeyMode(mode);
  }, [mode]);

  const keyPreference = useMemo(
    () => getKeyPreferenceForTonic(tonicPc, mode),
    [tonicPc, mode]
  );

  const chords = useMemo(
    () => buildDiatonicChordsForKey(tonicPc, mode),
    [tonicPc, mode]
  );

  const testChordPool = useMemo(() => {
    if (testChordFilter === 'all') return chords;
    return chords.filter((c) => c.type === testChordFilter);
  }, [chords, testChordFilter]);

  const pickRandomTestChord = useMemo(
    () => (exclude: DiatonicChord | null) => {
      const pool = exclude
        ? testChordPool.filter((c) => c.id !== exclude.id)
        : testChordPool;
      if (pool.length === 0) return testChordPool[0] ?? null;
      return pool[Math.floor(Math.random() * pool.length)] ?? null;
    },
    [testChordPool]
  );

  const currentPcs = useMemo(
    () => normalisePitchClassSet([...derivedActivePitchClasses]),
    [derivedActivePitchClasses]
  );

  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const runEvaluation = () => {
      if (currentPcs.length === 0) {
        setEvaluatedPcs(null);
        setRecognisedChord(null);
        setInversionLabel(null);
        return;
      }
      setEvaluatedPcs([...currentPcs]);
      if (currentPcs.length < MIN_PITCH_CLASSES_FOR_EVALUATION) {
        setRecognisedChord(null);
        setInversionLabel(null);
        return;
      }
      const chord = recogniseChord(currentPcs, chords);
      setRecognisedChord(chord);
      if (chord) {
        const label = detectInversionLabel(activeNoteNumbers, chord);
        setInversionLabel(label);
      } else {
        setInversionLabel(null);
      }
    };

    const delay = currentPcs.length === 0 ? 0 : RECOGNITION_DEBOUNCE_MS;
    debounceRef.current = window.setTimeout(runEvaluation, delay);
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [activeNoteNumbers, currentPcs, chords]);

  useEffect(() => {
    if (
      !testActive ||
      !recognisedChord ||
      !targetChord ||
      recognisedChord.id !== targetChord.id ||
      testCorrectFlash
    ) {
      return;
    }
    const id = window.setTimeout(() => {
      setTestCorrectFlash(true);
      testCorrectTimeoutRef.current = window.setTimeout(() => {
        testCorrectTimeoutRef.current = null;
        setTargetChord(pickRandomTestChord(targetChord));
        setTestCorrectFlash(false);
      }, TEST_CORRECT_DELAY_MS);
    }, 0);
    return () => {
      clearTimeout(id);
      // Do not clear testCorrectTimeoutRef here: when testCorrectFlash becomes true
      // this effect re-runs and would cancel the "advance to next chord" timeout.
    };
  }, [
    testActive,
    recognisedChord,
    targetChord,
    testCorrectFlash,
    pickRandomTestChord,
  ]);

  useEffect(() => {
    return () => {
      if (testCorrectTimeoutRef.current !== null) {
        clearTimeout(testCorrectTimeoutRef.current);
      }
    };
  }, []);

  const hasKeysHeld = activeNoteNumbers.length > 0;

  const inputStable =
    hasKeysHeld &&
    evaluatedPcs !== null &&
    currentPcs.length === evaluatedPcs.length &&
    currentPcs.every((pc, i) => pc === evaluatedPcs![i]);

  const recognitionState: RecognitionInputState = !hasKeysHeld
    ? 'idle'
    : !inputStable
    ? 'listening'
    : recognisedChord
    ? 'success'
    : evaluatedPcs!.length >= MIN_PITCH_CLASSES_FOR_EVALUATION
    ? 'mismatch'
    : 'listening';

  const keyDisplayName = useMemo(() => {
    const tonicName = pitchClassToNoteName(tonicPc, keyPreference);
    return `${tonicName} ${mode}`;
  }, [tonicPc, mode, keyPreference]);

  const heldNoteNames = useMemo(
    () =>
      pitchClassSetToNoteNames(
        normalisePitchClassSet(activeNoteNumbers.map(midiNoteToPitchClass)),
        keyPreference
      ),
    [activeNoteNumbers, keyPreference]
  );

  const chordName = recognisedChord
    ? getChordDisplayName(recognisedChord)
    : null;

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left sidebar: Key (top) and MIDI Device (bottom) */}
        <aside className="flex flex-col justify-between w-56 shrink-0 border-r border-slate-800 bg-slate-900/60 p-4">
          <div className="space-y-4">
            <div data-testid="key-selector-area">
              <KeySelector
                tonicPc={tonicPc}
                mode={mode}
                onTonicChange={setTonicPc}
                onModeChange={setMode}
                disabled={testActive}
              />
            </div>
            <div
              className="border-t border-slate-700/80 pt-4 space-y-3"
              data-testid="test-me-area"
            >
              <GameSelector
                testActive={testActive}
                setTestActive={setTestActive}
                testChordPoolLength={testChordPool.length}
                setTestCorrectFlash={setTestCorrectFlash}
                setTargetChord={setTargetChord}
                pickRandomTestChord={pickRandomTestChord}
                testCorrectTimeoutRef={testCorrectTimeoutRef}
                testChordFilter={testChordFilter}
                setTestChordFilter={setTestChordFilter}
              />
            </div>
          </div>
          <div className="mt-auto pt-6" data-testid="device-selector-area">
            <DeviceSelector
              inputs={inputs}
              selectedId={selectedInputId}
              status={status}
              onChange={selectInput}
            />
          </div>
        </aside>

        {/* Main content: Recognition → Keyboard → Held notes */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="shrink-0 px-4 pt-4 pb-2" data-testid="app-header">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Piano Chord Trainer
            </h1>
            <p className="text-sm text-slate-400">
              Connect a MIDI keyboard, choose a key, and play chords to see if
              they&apos;re diatonic.
            </p>
          </header>

          {/* Recognition panel: fixed min-height to avoid layout shift */}
          <section
            aria-label="Chord recognition"
            className="shrink-0 w-full border-b border-slate-800 bg-slate-800/50 backdrop-blur-sm min-h-[15rem] flex flex-col justify-center"
          >
            <div
              className="mx-auto max-w-4xl px-4 py-6 w-full"
              data-testid="recognition-panel"
            >
              <RecognitionPanel
                recognitionState={recognitionState}
                recognisedChord={recognisedChord}
                chordName={chordName}
                inversionLabel={inversionLabel}
                keyDisplayName={keyDisplayName}
                testMode={testActive}
                targetChord={targetChord}
                testCorrectFlash={testCorrectFlash}
              />
            </div>
          </section>

          <div className="flex-1 px-4 py-6 space-y-6">
            <section data-testid="held-notes-section">
              <HeldNotes
                activeNoteNumbers={activeNoteNumbers}
                noteNames={heldNoteNames}
              />
            </section>
          </div>
        </main>
      </div>

      <div className="fixed bottom-4 right-4 flex items-center gap-2 text-[10px] font-medium text-slate-400 select-none pointer-events-none">
        <MidiActivity active={hasRecentMidiActivity} />
      </div>
    </>
  );
}

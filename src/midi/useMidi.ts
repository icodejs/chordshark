import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { midiNoteToPitchClass } from '../theory/noteNames';
import { getStoredMidiInputId, setStoredMidiInputId } from '../utils/storage';

type MidiStatus = 'initialising' | 'ready' | 'unsupported' | 'error';

interface MidiInputInfo {
  id: string;
  name: string;
}

interface UseMidiResult {
  status: MidiStatus;
  error: string | null;
  inputs: MidiInputInfo[];
  selectedInputId: string | null;
  activeNoteNumbers: number[];
  derivedActivePitchClasses: Set<number>;
   hasRecentMidiActivity: boolean;
  selectInput: (id: string | null) => void;
}

export function useMidi(): UseMidiResult {
  const [status, setStatus] = useState<MidiStatus>('initialising');
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<MidiInputInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [hasRecentMidiActivity, setHasRecentMidiActivity] = useState(false);
  const activityTimeoutRef = useRef<number | null>(null);

  // Keep a ref to current MIDI input to attach/detach listeners.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) {
      setStatus('unsupported');
      return;
    }

    let mounted = true;
    let midiAccess: MIDIAccess | null = null;
    let currentInput: MIDIInput | null = null;

    const handleStateChange = () => {
      if (!midiAccess || !mounted) return;
      const nextInputs: MidiInputInfo[] = Array.from(midiAccess.inputs.values()).map(
        (input: MIDIInput) => ({
          id: input.id,
          name: input.name || 'Unknown device',
        }),
      );
      setInputs(nextInputs);

      // Try to keep current selection if still available; otherwise clear.
      setSelectedInputId((prev) => {
        if (!prev) return null;
        const stillThere = nextInputs.some((i) => i.id === prev);
        if (!stillThere) {
          setStoredMidiInputId('');
          return null;
        }
        return prev;
      });
    };

    const handleMIDIMessage = (event: MIDIMessageEvent) => {
      const data = event.data as Uint8Array;
      const [statusByte, noteNumber, velocity] = data;
      const command = statusByte & 0xf0;

      // Mark recent MIDI activity for a short visual flash window.
      setHasRecentMidiActivity(true);
      if (activityTimeoutRef.current !== null) {
        window.clearTimeout(activityTimeoutRef.current);
      }
      activityTimeoutRef.current = window.setTimeout(() => {
        setHasRecentMidiActivity(false);
      }, 160);

      setActiveNotes((prev) => {
        const next = new Set(prev);
        const isNoteOn = command === 0x90 && velocity > 0;
        const isNoteOff = command === 0x80 || (command === 0x90 && velocity === 0);

        if (isNoteOn) {
          next.add(noteNumber);
        } else if (isNoteOff) {
          next.delete(noteNumber);
        }
        return next;
      });
    };

    const attachToInput = (inputId: string | null) => {
      if (!midiAccess) return;
      if (currentInput) {
        currentInput.onmidimessage = null;
      }
      currentInput = null;
      setActiveNotes(new Set());

      if (!inputId) return;
      const input = Array.from(midiAccess.inputs.values()).find((i) => i.id === inputId) || null;
      if (!input) return;
      currentInput = input;
      currentInput.onmidimessage = handleMIDIMessage;
    };

    navigator
      .requestMIDIAccess()
      .then((access) => {
        if (!mounted) return;
        midiAccess = access;
        setStatus('ready');
        handleStateChange();

        midiAccess.addEventListener('statechange', handleStateChange);

        // Restore previously selected device if available.
        const storedId = getStoredMidiInputId();
        if (storedId) {
          const stillThere = Array.from(midiAccess.inputs.values()).some(
            (i: MIDIInput) => i.id === storedId,
          );
          if (stillThere) {
            setSelectedInputId(storedId);
            attachToInput(storedId);
          }
        }
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      mounted = false;
      if (midiAccess) {
        midiAccess.onstatechange = null;
      }
      if (currentInput) {
        currentInput.onmidimessage = null;
      }
      if (activityTimeoutRef.current !== null) {
        window.clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = null;
      }
    };
  }, []);

  const selectInput = useCallback((id: string | null) => {
    setSelectedInputId(id);
    if (id) {
      setStoredMidiInputId(id);
    }
  }, []);

  const derivedActivePitchClasses = useMemo(() => {
    const pcs = new Set<number>();
    activeNotes.forEach((note) => {
      pcs.add(midiNoteToPitchClass(note));
    });
    return pcs;
  }, [activeNotes]);

  return {
    status,
    error,
    inputs,
    selectedInputId,
    activeNoteNumbers: Array.from(activeNotes).sort((a, b) => a - b),
    derivedActivePitchClasses,
    hasRecentMidiActivity,
    selectInput,
  };
}


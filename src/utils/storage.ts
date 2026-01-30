import type { KeyMode } from '../app/App';

const STORAGE_KEYS = {
  midiInputId: 'chordshark_selectedMidiInputId',
  keyTonicPc: 'chordshark_selectedKeyTonicPc',
  keyMode: 'chordshark_selectedKeyMode',
} as const;

function safeGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function getStoredMidiInputId(): string | null {
  return safeGet(STORAGE_KEYS.midiInputId);
}

export function setStoredMidiInputId(id: string | null): void {
  if (id == null) return;
  safeSet(STORAGE_KEYS.midiInputId, id);
}

export function getStoredKeyTonicPc(): number | null {
  const raw = safeGet(STORAGE_KEYS.keyTonicPc);
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 11) return null;
  return n;
}

export function setStoredKeyTonicPc(pc: number): void {
  if (!Number.isInteger(pc)) return;
  safeSet(STORAGE_KEYS.keyTonicPc, String(pc));
}

export function getStoredKeyMode(): KeyMode | null {
  const raw = safeGet(STORAGE_KEYS.keyMode);
  if (raw === 'major' || raw === 'minor') return raw;
  return null;
}

export function setStoredKeyMode(mode: KeyMode): void {
  safeSet(STORAGE_KEYS.keyMode, mode);
}


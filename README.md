## Piano Chord Trainer (React + TypeScript + Vite)

A minimal proof-of-concept web app to help you learn piano chords using **MIDI input** and **diatonic chord recognition**. Built with **React 18 + TypeScript + Vite** and **Tailwind CSS**.

### Setup

```bash
npm install
npm run dev
```

Then open the printed local URL in a **MIDI-capable browser** (Chrome / Edge).

### Connecting a MIDI keyboard

- Connect your MIDI keyboard via USB (or a MIDI–USB interface) before opening the app.
- In the app:
  - Look at the **MIDI Device** dropdown.
  - Select your keyboard from the list.
  - Status text should show **“MIDI ready”** once the browser has granted access.

The selected device is remembered in `localStorage` and restored on reload (if still available).

### Core flow

1. **MIDI device selection**
   - On load, the app calls `navigator.requestMIDIAccess` and populates the **MIDI Device** dropdown.
   - Selecting a device starts listening for **NOTE_ON** (0x90, velocity > 0) and **NOTE_OFF** (0x80 or 0x90 with velocity 0) messages.
   - Connection status and selected device are displayed at the top.

2. **Musical key selection**
   - Use the **Key** section to choose:
     - **Tonic**: 12 pitch classes (C–B), rendered with sharps or flats depending on key signature.
     - **Mode**: Major / Minor toggle.
   - Internally keys are represented as `(tonicPitchClass 0–11, mode 'major' | 'minor')` and persisted to `localStorage`.

3. **Chord recognition**
   - As you play, the app tracks:
     - `activeNoteNumbers: Set<number>` (raw MIDI note numbers)
     - `derivedActivePitchClasses: Set<number>` (0–11, computed from note numbers)
   - It builds **diatonic triads and 7th chords** for the selected key (natural minor for minor keys).
   - Recognition is:
     - **Pitch-class based** (ignores octave and voicing, so inversions match).
     - **Exact-set**: it ignores duplicates but requires the same set size:
       - `{C,E,G}` vs chord `{C,E,G}` → recognised.
       - `{C,E,G,D}` vs `{C,E,G}` → not recognised.
       - `{C,E,G}` vs `{C,E,G,B}` → not recognised.
   - A short debounce (~80ms) avoids UI spam when playing fast notes.

4. **UI panels**
   - **Held notes** shows the current distinct pitch classes as note names.
   - **Chord recognition** shows:
     - ✅ “Recognised” + the diatonic **degree** (e.g. `I`, `ii`, `vii°`) and chord type (triad / 7th),
     - or ❌ “Not recognised”.
   - A simple inversion label is shown when detectable (root / 1st inv / 2nd inv / 3rd inv).

### Manual test cases

Assume a MIDI keyboard is connected and selected, and velocity is non-zero for NOTE_ON events.

- **Test 1 – C major key, root position triad**
  - Set key to **C Major**.
  - Play **C–E–G** (any octaves, notes held together).
  - Expected:
    - Held notes show `C`, `E`, `G`.
    - Recognition: ✅ **Recognised** as the **I triad** (label may say `root`).

- **Test 2 – C major key, first inversion triad**
  - Set key to **C Major**.
  - Play **E–G–C** (any octaves).
  - Expected:
    - Held notes show `C`, `E`, `G`.
    - Recognition: ✅ **Recognised** as **I triad** with inversion label like `1st inv`.

- **Test 3 – C major key, extra non-diatonic note**
  - Set key to **C Major**.
  - Play **C–E–G–D**.
  - Expected:
    - Held notes show `C`, `D`, `E`, `G`.
    - Recognition: ❌ **Not recognised** (extra pitch class).

- **Test 4 – A minor key, diatonic 7th**
  - Set key to **A Minor** (natural minor).
  - Play **A–C–E–G**.
  - Expected:
    - Held notes show `A`, `C`, `E`, `G`.
    - Recognition: ✅ **Recognised** as **i7** (7th chord).

- **Test 5 – Persistence**
  - Select **a specific MIDI device** and set key to **D Minor**.
  - Reload the page.
  - Expected:
    - The same device is pre-selected if still connected.
    - Key selector shows **D Minor**.

### Tech notes

- **Stack**: React 18, TypeScript, Vite, Tailwind CSS (no component libraries).
- **MIDI**: Web MIDI API (`navigator.requestMIDIAccess`), no extra MIDI libraries.
- **State & logic**:
  - `src/midi/useMidi.ts` – MIDI access, device selection, active note tracking.
  - `src/theory/noteNames.ts` – pitch-class helpers and note spelling with sharps/flats preference.
  - `src/theory/chordTheory.ts` – diatonic triads + 7ths (major & natural minor), pitch-class set matching, inversion detection.
  - `src/components/*` – small, focused UI components.
  - `src/utils/storage.ts` – `localStorage` helpers for MIDI device and key settings.

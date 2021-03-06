import {
  SELECT_MIDI_CONTROLLER,
  SELECT_NUMBER_OF_KEYBOARD_OCTAVES,
  SET_WEB_MIDI_SUPPORTED,
  SELECT_TONIC,
  START_GAME,
  SELECT_CHORD_PROGRESSION,
  REGISTER_NOTE_PRESSED,
  REGISTER_NOTE_RELEASED,
} from './action-types';

export const selectMidiController = ({ selectedDevice }) => ({
  type: SELECT_MIDI_CONTROLLER,
  selectedDevice,
});

export const selectNumberOfKeyboardOctaves = ({ numberOfKeyboardOctaves }) => ({
  type: SELECT_NUMBER_OF_KEYBOARD_OCTAVES,
  numberOfKeyboardOctaves,
});

export const setWebMidiSupported = ({ webMidiSupported }) => ({
  type: SET_WEB_MIDI_SUPPORTED,
  webMidiSupported,
});

export const selectTonic = ({ tonic }) => ({
  type: SELECT_TONIC,
  tonic,
});

export const selectChordProgression = ({ id }) => ({
  type: SELECT_CHORD_PROGRESSION,
  id,
});

export const startGame = ({
  tonic,
  selectedLessonType,
  selectedChordProgression,
  chords,
  scale,
  numberOfNotesInChord,
}) => ({
  type: START_GAME,
  id: new Date().getTime(),
  tonic,
  selectedLessonType,
  selectedChordProgression,
  chords,
  scale,
  numberOfNotesInChord,
});

export const registerNotePressed = ({ note }) => ({
  type: REGISTER_NOTE_PRESSED,
  note,
});

export const registerNoteReleased = ({ note }) => ({
  type: REGISTER_NOTE_RELEASED,
  note,
});

/// https://www.8notes.com/resources/notefinders/piano_chords.asp
/// https://cifkao.github.io/tonnetz-viz/
/// https://danigb.github.io/tonal-app/#/C
/// https://www.cs.hmc.edu/~keller/jazz/improvisor/Scales.html

import React, { Component } from 'react';
import webmidi from 'webmidi';
import * as R from 'ramda'

import { Chord } from "tonal";
import { chord } from 'tonal-detect'
import * as Note from 'tonal-note'
import * as Scale from 'tonal-scale'
import * as Key from "tonal-key";

import Piano from '../../components/Piano';
import Display from '../../components/Display';
import DeviceSelection from '../../components/DeviceSelection';
import NoteSelector from '../../components/NoteSelector';
import LessonSelector from '../../components/LessonSelector';
import Scales from '../../components/Lessons';
import { addNote, removeNote } from '../../utils/notes';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      midiSupported: false,
      midiInputs: [],
      selectedInput: -1,
      notesPressed: [],
      displayText: '',
      selectedLesson: -1,
      selectedChordKey: 'C',
    };
  }

  componentDidMount() {
    webmidi.enable(err => {
      if (err) {
        this.setState({ midiSupported: false });
      } else {
        this.setState({ midiSupported: true });
      }
    });
  }

  handleReceivedMidiInputs = midiInputs => {
    this.setState({
      midiInputs: [...this.state.midiInputs, ...midiInputs]
    });
  };

  handleDeviceSelection = selectedInput => {
    this.setState({ selectedInput });
  };

  handleLessonSelection = event => {
    this.setState({
      selectedLesson: event.target.value,
    })
  }

  handleOnNoteOn = (note) => {
    console.log('Note on', note);
    this.setState({
      notesPressed: addNote(this.state.notesPressed)(note),
    });
  }

  handleOnNoteOff = (note) => {
    console.log('Note off', note);
    this.setState({
      notesPressed: removeNote(this.state.notesPressed)(note.id),
    });
  }

  handleChordKeySelected = (selectedChordKey) => {
    this.setState({
      selectedChordKey,
    });
  }

  // renderLesson() {
  //   const { correct, progress, complete } = this.state.lesson;
  //   return (
  //     <div>
  //       <h3>C Scale Lesson</h3>
  //       <div>{complete ? 'Scale completed' : progress}</div>
  //       {/* !correct ? <div>Incorrect key</div> : null */}
  //     </div>
  //   );
  // }

  // renderNotesPressed() {
  //   return this.state.notes.map(({ name }, index) => (
  //     <div className='notes-pressed' key={index}>
  //       {name}
  //     </div>
  //   ));
  // }

  renderPossibleChords() {
    const { notesPressed } = this.state;

    if (!notesPressed.length) {
      return;
    }

    const noteNames = notesPressed.map(R.prop('id'));
    const results = chord(noteNames);

    if (!results.length) {
      return;
    }

    return `Possible Chords: ${results.join(' | ')}`;
  }

  renderPossibleScale() {
    const { notesPressed } = this.state;

    if (!notesPressed.length) {
      return;
    }

    const noteNames = notesPressed.map(R.prop('name'))

    const results = Note.names(' #').map(n => {
      return {
        name: `${n} major`,
        notes: Scale.notes(`${n} major`),
      }
    }).filter(s => {
      return noteNames.every(n => s.notes.includes(n));
    }).map(R.prop('name'));

    if (!results.length) {
      return;
    }

    return `Possible Scales: ${results.join(' | ')}`;
  }

  render() {
    const { notesPressed, midiSupported, selectedInput, selectedLesson, midiInputs, selectedChordKey } = this.state;
    const lessons = ['scales', 'chords'];

    if (!midiSupported) {
      return <div className='error'>WebMidi is not supported</div>;
    }

    const displayRows = [
      this.renderPossibleChords(),
      this.renderPossibleScale()
    ];

    // This game will cycle through C chords and ask you to play them
    // Chord.names().map(c => console.log(
    //   `C: ${c}`,
    //   Chord.notes('C', c)
    // ));
    // console.log('------------');

    // https://github.com/danigb/tonal/tree/master/extensions/key
    // Game to play all chords in the key of C
    // Also limit to progression using: Key.chords("A major", [5, 4, 1]) // => ["E7", "DMaj7", AMaj7"]
    // Key.chords('Db major').map(c => console.log(
    //   `Chords in C: ${c}`,
    //   Chord.notes(c)
    // ));
    // console.log('============');

    return (
      <div>
        <Display rows={displayRows} />
        {
          selectedLesson !== -1
            ? <Scales notes={notesPressed} />
            : null
        }
        <DeviceSelection
          midiInputs={midiInputs}
          onReceivedMidiInputs={this.handleReceivedMidiInputs}
          onDeviceSelection={this.handleDeviceSelection}
        />
        <LessonSelector
          lessons={lessons}
          selectedLesson={selectedLesson}
          onLessonSelection={this.handleLessonSelection}
        />
        {
          selectedLesson === 'chords'
          ? <NoteSelector onNoteSelected={this.handleChordKeySelected} />
          : null
        }
        <Piano
          onNoteOn={this.handleOnNoteOn}
          onNoteOff={this.handleOnNoteOff}
          midiInputDevice={selectedInput}
          notesPressed={notesPressed}
        />
      </div>
    );
  }
}

export default Home;

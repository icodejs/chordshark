import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import webmidi from 'webmidi';

import Piano from '../../components/Piano';
import Display from '../../components/Display';
import LessonSelector from '../../components/LessonSelector';
import { addNote, removeNote } from '../../utils/notes';
import { progressionTest } from '../../lessons/chords';

import './Lessons.scss';

const getChordGuideNotes = ({
  chordProgression,
  chordsInKey,
  interval,
  octave,
}) => {
  if (interval > 2) {
    return [];
  }

  return chordsInKey
    .find(
      chord =>
        chord.scaleDegree === chordProgression.numericIntervals[interval],
    )
    .notes.map(key => key + octave);
};

let currentProgressionTest = [];

class Lessons extends Component {
  constructor(props) {
    super(props);

    this.state = {
      midiInputs: [],
      notesPressed: [],
      displayText: '',
      selectedProgression: [],
      showGuideNotes: true,
    };
  }

  componentDidMount() {
    webmidi.enable(err => {
      if (!err) {
        this.props.setWebMidiSupported({ webMidiSupported: true });

        this.setState({
          midiInputs: [...webmidi.inputs],
        });
      }
    });
  }

  handleDeviceSelection = ({ selectedDevice }) => {
    this.props.selectMidiController({ selectedDevice });
  };

  handleTonicSelection = event => {
    const { value: tonic } = event.target;
    this.props.selectTonic({ tonic });
  };

  handleChordProgressionSelection = event => {
    const { value: selectedProgression } = event.target;
    this.setState({ selectedProgression });
  };

  handleOnNoteOn = note => {
    // console.log('Note on', note);
    this.setState({
      notesPressed: addNote(this.state.notesPressed)(note),
    });
  };

  handleOnNoteOff = note => {
    // console.log('Note off', note);
    this.setState({
      notesPressed: removeNote(this.state.notesPressed)(note.id),
    });
  };

  handleNoteClick(noteClicked) {
    console.log('note mouse click', noteClicked);
  }

  handleStartGameClick = event => {
    event.preventDefault();
    const { tonic } = this.props;
    this.props.startGame({ tonic, lessonType: 'Chord' });
  };

  renderChordTestInformation() {
    const { notesPressed } = this.state;
    const { tonic, chords, chordProgressions } = this.props;

    // NOTE: USE STATE TO HANDLE INSTRUCTION / PROGRESS
    const testResults = progressionTest(
      {
        notesPressed,
        tonic,
        lesson: chordProgressions[0],
        chordsInKey: chords[tonic],
        currentProgressionTest,
      },
      (matchedChord, completed) => {
        if (completed) {
          currentProgressionTest = [];
        }
        currentProgressionTest.push(matchedChord);
      },
    );

    return (
      <Fragment>
        <p>{testResults}</p>
      </Fragment>
    );
  }

  render() {
    const {
      tonic,
      tonics,
      scales,
      chords,
      chordProgressions,
      selectedDevice,
      webMidiSupported,
      defaultOctave,
    } = this.props;
    const { notesPressed, midiInputs, showGuideNotes } = this.state;

    if (!webMidiSupported) {
      return <div className="error">WebMidi is not supported</div>;
    }

    const displayRows = [this.renderChordTestInformation()];
    const scaleNotes = scales[tonic].notes;
    const chordNotes = getChordGuideNotes({
      chordProgression: chordProgressions[0],
      chordsInKey: chords[tonic],
      interval: currentProgressionTest.length,
      octave: defaultOctave,
    });

    return (
      <div className="Lessons">
        <div className="lesson-options">
          <LessonSelector
            lessons={tonics}
            onLessonSelection={this.handleTonicSelection}
            selectedValue={tonic}
          />
          <button type="button" onClick={this.handleStartGameClick}>
            Start Game
          </button>
        </div>

        <Display rows={displayRows} />

        <Piano
          onNoteOn={this.handleOnNoteOn}
          onNoteOff={this.handleOnNoteOff}
          midiInputDevice={selectedDevice.input}
          notesPressed={notesPressed}
          guideNotes={
            showGuideNotes ? { scale: scaleNotes, chord: chordNotes } : null
          }
          onNoteClick={this.handleNoteClick}
          midiInputs={midiInputs}
          handleDeviceSelection={this.handleDeviceSelection}
          selectedDevice={selectedDevice}
        />
      </div>
    );
  }
}

Lessons.propTypes = {
  chords: PropTypes.object.isRequired,
  scales: PropTypes.object.isRequired,
  selectedDevice: PropTypes.object,
  selectedLessonType: PropTypes.string,
  selectMidiController: PropTypes.func.isRequired,
  setWebMidiSupported: PropTypes.func.isRequired,
  startGame: PropTypes.func.isRequired,
  tonic: PropTypes.string.isRequired,
  tonics: PropTypes.array.isRequired,
  webMidiSupported: PropTypes.bool.isRequired,
};

Lessons.defaultProps = {
  selectedDevice: {},
  selectedLessonType: 'Chord',
};

export default Lessons;

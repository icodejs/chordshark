import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as Note from 'tonal-note'
import { flatNotes, flatToSharp, octavesOptions } from '../../config';
import { addNote, removeNote, containsNote } from '../../utils/notes';
import './Piano.scss';

class Piano extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deviceSet: false,
      notesPressed: [],
    };
  }

  parseNote(event) {
    return {
      id: event.note.name + event.note.octave,
      midiNote: event.note.number,
      rawVelocity: event.rawVelocity,
      timestamp: event.timestamp,
      target: event.target,
      channel: event.channel,
      ...event.note
    };
  }

  onNoteOn = e => {
    const note = this.parseNote(e);
    this.props.onNoteOn(note);
  };

  onNoteOff = e => {
    const note = this.parseNote(e);
    this.props.onNoteOff(note);
  };

  componentDidUpdate() {
    const { midiInputDevice } = this.props;
    const { deviceSet } = this.state;

    if (midiInputDevice && !deviceSet) {
      this.setState({ deviceSet: true }, () => {
        midiInputDevice.addListener('noteon', 'all', this.onNoteOn);
        midiInputDevice.addListener('noteoff', 'all', this.onNoteOff);
      });
    }
  }

  componentWillUnmount() {
    const { midiInputDevice } = this.props;

    if (midiInputDevice) {
      midiInputDevice.removeListener('noteon', 'all', this.onNoteOn);
      midiInputDevice.removeListener('noteoff', 'all', this.onNoteOff);
    }
  }

  handleKeyboardKeysSelection = event => {
    const { value: numberOfKeyboardOctaves } = event.target;
    this.props.selectNumberOfKeyboardOctaves({
      numberOfKeyboardOctaves: parseInt(numberOfKeyboardOctaves, 10)
    })
  };

  handleNoteClicked = (note, pianoOctave) => (e) => {
    const { onNoteClick } = this.props;
    const id = note + pianoOctave;
    const event = {
      id,
      midiNote: Note.midi(id),
      timestamp: new Date().getTime(),
      target: 'Mouse click',
      rawVelocity: 127,
      channel: 1,
      octave: pianoOctave,
      number: Note.midi(id),
      name: note,
    };

    this.toggleNote(event);
    onNoteClick(event);
  }

  toggleNote(note) {
    if (containsNote(this.state.notesPressed, note.id)) {
      this.props.onNoteOff(note);

      this.setState({
        notesPressed: removeNote(this.state.notesPressed)(note.id),
      });
    } else {
      this.props.onNoteOn(note);

      this.setState({
        notesPressed: addNote(this.state.notesPressed)(note),
      });
    }
  }

  renderKeyboardKeysSelector() {
    return (
      <form className="octave-selector">
        <label>
          <select
            value={this.props.numberOfKeyboardOctaves}
            onChange={this.handleKeyboardKeysSelection}
          >
            {octavesOptions.map(({ keys, octaves }) => {
              return (
                <option key={octaves} value={octaves}>
                  {`${keys}-key keyboard`}
                </option>
              );
            })}
          </select>
        </label>
      </form>
    )
  }

  renderNote = (pianoOctave) => (k, noteIndex) => {
    const { notesPressed } = this.props;
    const note = flatNotes[noteIndex];
    const selected = notesPressed.find(({ name, octave }) => {
      return flatToSharp(name) === flatToSharp(note) &&
        octave === pianoOctave;
    });
    const noteId = `${note}_${pianoOctave}`;

    return (
      <li
        key={noteId}
        onClick={this.handleNoteClicked(note, pianoOctave)}
        className={classNames(noteId, { selected })}
      />
    );
  }

  renderPiano() {
    const { numberOfKeyboardOctaves } = this.props;
    const octavesOption = octavesOptions.find(
      ({ octaves }) => octaves === numberOfKeyboardOctaves
    );

    return [...Array(numberOfKeyboardOctaves)].map((o, index) => {
      const keysPerOctave = 12;
      const pianoOctave = index + octavesOption.startingOctave;

      return (
        <ul
          key={`octave-${pianoOctave}`}
          className={`octave-${pianoOctave}`}
        >
          {[...Array(keysPerOctave)].map(this.renderNote(pianoOctave))}
        </ul>
      );
    });
  }

  render() {
    return (
      <Fragment>
        {this.renderKeyboardKeysSelector()}
        <div className="piano">
          {this.renderPiano()}
        </div>
      </Fragment>
    );
  }
}

Piano.propTypes = {
  onNoteOn: PropTypes.func.isRequired,
  onNoteOff: PropTypes.func.isRequired,
  onNoteClick: PropTypes.func.isRequired,
  numberOfKeyboardOctaves: PropTypes.number.isRequired,
  selectNumberOfKeyboardOctaves: PropTypes.func.isRequired,
  midiInputDevice: PropTypes.object,
  notesPressed: PropTypes.array,
};

Piano.defaultProps = {
  notesPressed: [],
  numberOfKeyboardOctaves: 2,
};

export default Piano;
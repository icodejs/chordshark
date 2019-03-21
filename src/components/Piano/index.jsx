// https://www.scales-chords.com/chord/piano/Bdim
// import { chord } from "tonal-detect"
import React, { Component, Fragment } from 'react';
// import * as R from 'ramda';
// import webmidi from 'webmidi';
import classNames from 'classnames';
// import { scaleLesson } from '../../lessons/c-major';
import { notes } from '../../config';
import './Piano.scss';

class Piano extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: [],
      deviceSet: false
    };
  }

  parseNote(event) {
    return {
      id: event.note.name + event.note.octave,
      midiNote: event.note.number,
      rawVelocity: event.rawVelocity,
      ...event.note
    };
  }

  onNoteOn = e => {
    const note = this.parseNote(e);
    this.props.onNoteOn(note);
    this.setState({
      notes: [...this.state.notes, note].sort((a, b) => a.midiNote - b.midiNote)
    });
  };

  onNoteOff = e => {
    const note = this.parseNote(e);
    this.props.onNoteOff(note);

    this.setState({
      notes: this.state.notes.filter(({ id }) => id !== note.id)
    });
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

  renderPiano() {
    const octaves = 2;
    return [...Array(octaves)].map((o, index) => {
      const pianoOctave = index + 3;

      return (
        <ul key={`octave-${pianoOctave}`} className={`octave-${pianoOctave}`}>
          {[...Array(12)].map((k, index) => {
            const note = notes[index];
            const selected = this.state.notes.find(({ name, octave }) => {
              return name === note && octave === pianoOctave;
            });

            return (
              <li
                key={`${note}_${pianoOctave}`}
                className={classNames(`${note}_${pianoOctave}`, { selected })}
              />
            );
          })}
        </ul>
      );
    });
  }

  render() {
    return (
      <Fragment>
        <div className="piano">{this.renderPiano()}</div>
      </Fragment>
    );
  }
}

export default Piano;

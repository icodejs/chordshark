import type { FC } from 'react';
import { Note } from 'tonal';

/**
 * 3-octave piano keyboard (SVG). Visual reference: https://svgsilh.com/svg/307653.svg
 * Accepts activeNoteNumbers to highlight pressed keys (darker fill + note label).
 */

export const DEFAULT_PIANO_RANGE = ['C3', 'C6'] as const;

const KEYBOARD_LAYOUT = [
  { pitches: ['C', 'B#'], upperOffset: 0, upperWidth: 15.05 },
  { pitches: ['Db', 'C#'], upperOffset: 0, upperWidth: 12.7 },
  { pitches: ['D'], upperOffset: 4.15, upperWidth: 15.3 },
  { pitches: ['Eb', 'D#'], upperOffset: 0, upperWidth: 12.7 },
  { pitches: ['E'], upperOffset: 8.55, upperWidth: 15.05 },
  { pitches: ['F', 'E#'], upperOffset: 0, upperWidth: 13.95 },
  { pitches: ['Gb', 'F#'], upperOffset: 0, upperWidth: 12.7 },
  { pitches: ['G'], upperOffset: 3.05, upperWidth: 14.2 },
  { pitches: ['Ab', 'G#'], upperOffset: 0, upperWidth: 12.7 },
  { pitches: ['A'], upperOffset: 6.35, upperWidth: 14.2 },
  { pitches: ['Bb', 'A#'], upperOffset: 0, upperWidth: 12.7 },
  { pitches: ['B', 'Cb'], upperOffset: 9.65, upperWidth: 13.95 },
] as const;

const ACCIDENTALS = [1, 3, 6, 8, 10];

const OPTS = {
  scaleX: 1,
  scaleY: 1,
  lowerWidth: 23.6,
  upperHeight: 100,
  lowerHeight: 45,
  strokeWidth: 1,
  stroke: '#39383D',
  palette: ['#39383D', '#F2F2EF'] as const,
  /** Darker fill when key is pressed (black key, white key). */
  pressedPalette: ['#1a1a1d', '#c4c4be'] as const,
  /** Grey for first/last key labels when not pressed. */
  rangeLabelFill: '#C6C6C6',
};

type Range = readonly [string, string];

function parseRange(range: Range) {
  const pitchStart = range[0].slice(0, -1);
  const pitchEnd = range[1].slice(0, -1);
  const first = KEYBOARD_LAYOUT.findIndex((k) =>
    (k.pitches as readonly string[]).includes(pitchStart)
  );
  const last = KEYBOARD_LAYOUT.findIndex((k) =>
    (k.pitches as readonly string[]).includes(pitchEnd)
  );
  const keyOffset = first >= 0 ? first : 0;
  const octaveStart = parseInt(range[0].slice(-1), 10) || 3;
  const octaveEnd = parseInt(range[1].slice(-1), 10) || 5;
  const keyCount = Math.max(
    0,
    (octaveEnd - octaveStart + 1) * 12 - keyOffset - (11 - last)
  );
  return { keyCount, keyOffset, octaveStart };
}

function whiteIndex(index: number) {
  return (
    Array.from({ length: index % 12 }, (_, i) => i).filter(
      (i) => !ACCIDENTALS.includes(i)
    ).length +
    Math.floor(index / 12) * 7
  );
}

function getNoteName(index: number, octaveStart: number): string {
  const layout = KEYBOARD_LAYOUT[index % 12];
  const octave = Math.floor(index / 12) + octaveStart;
  // Use natural name (index 0) for white keys; use sharp (index 1) for black keys only.
  // Otherwise C would become "B#", F "E#", B "Cb" and MIDI/octave matching would be wrong.
  const isAccidental = ACCIDENTALS.includes(index % 12);
  const idx = layout.pitches.length > 1 && isAccidental ? 1 : 0;
  const pitch = layout.pitches[idx] ?? (layout.pitches[0] as string);
  return pitch + octave;
}

function upperWidthScaled(
  key: (typeof KEYBOARD_LAYOUT)[number],
  index: number,
  keyOffset: number,
  keyCount: number,
  scaleX: number
) {
  const isFirst = index === keyOffset;
  const isLast = index === keyOffset + keyCount - 1;
  if (isFirst) return (key.upperWidth + key.upperOffset) * scaleX;
  if (isLast) return (OPTS.lowerWidth - key.upperOffset) * scaleX;
  return key.upperWidth * scaleX;
}

function getKeyOffset(
  index: number,
  keyOffset: number,
  scaleX: number,
  strokeWidth: number
) {
  const { lowerWidth } = OPTS;
  const wi = whiteIndex(index);
  const oi = whiteIndex(keyOffset);
  let firstOffset = KEYBOARD_LAYOUT[keyOffset % 12].upperOffset;
  if (ACCIDENTALS.includes(keyOffset % 12)) {
    const prev = KEYBOARD_LAYOUT[(keyOffset + 11) % 12];
    firstOffset -= lowerWidth - (prev.upperWidth + prev.upperOffset);
  }
  if (!ACCIDENTALS.includes(index % 12)) {
    return (
      (wi * lowerWidth - oi * lowerWidth) * scaleX + Math.ceil(strokeWidth / 2)
    );
  }
  let sum = firstOffset * scaleX + Math.ceil(strokeWidth / 2);
  for (let i = keyOffset; i < index; i++) {
    sum += KEYBOARD_LAYOUT[i % 12].upperWidth * scaleX;
  }
  return sum;
}

interface KeyData {
  note: string;
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  isBlack: boolean;
  cx: number;
  cy: number;
}

function buildKeys(range: Range): KeyData[] {
  const { keyCount, keyOffset, octaveStart } = parseRange(range);
  const {
    scaleX,
    scaleY,
    lowerWidth,
    upperHeight,
    lowerHeight,
    strokeWidth,
    stroke,
    palette,
  } = OPTS;
  const totalHeight = (lowerHeight + upperHeight) * scaleY;
  const keys: KeyData[] = [];

  for (let i = keyOffset; i < keyOffset + keyCount; i++) {
    const layout = KEYBOARD_LAYOUT[i % 12];
    const isBlack = ACCIDENTALS.includes(i % 12);
    const upperW = upperWidthScaled(layout, i, keyOffset, keyCount, scaleX);
    const upperOff = (index: number) =>
      (index === keyOffset ? 0 : layout.upperOffset) * scaleX;
    const offsetX = getKeyOffset(i, keyOffset, scaleX, strokeWidth);
    const lowerW = isBlack ? layout.upperWidth * scaleX : lowerWidth * scaleX;
    const offsetY = 0;
    const upperY = upperHeight * scaleY + offsetY;

    const pts = isBlack
      ? [
          [upperOff(i) + offsetX, offsetY],
          [upperOff(i) + offsetX, upperY],
          [upperW + upperOff(i) + offsetX, upperY],
          [upperW + upperOff(i) + offsetX, offsetY],
        ]
      : [
          [upperOff(i) + offsetX, offsetY],
          [upperOff(i) + offsetX, upperY],
          [offsetX, upperY],
          [offsetX, totalHeight + offsetY],
          [lowerW + offsetX, totalHeight + offsetY],
          [lowerW + offsetX, upperY],
          [upperW + upperOff(i) + offsetX, upperY],
          [upperW + upperOff(i) + offsetX, offsetY],
        ];
    const ptsStr = pts.map((p) => p.join(',')).join(' ');

    const note = getNoteName(i, octaveStart);
    const cx = isBlack
      ? upperOff(i) + offsetX + upperW / 2
      : offsetX + lowerW / 2;
    const cy = isBlack ? upperY / 2 : (upperY + totalHeight + offsetY) / 2;

    keys.push({
      note,
      points: ptsStr,
      fill: palette[isBlack ? 0 : 1],
      stroke,
      strokeWidth,
      isBlack,
      cx,
      cy,
    });
  }
  return keys;
}

function totalDimensions(range: Range): [number, number] {
  const { keyCount, keyOffset } = parseRange(range);
  const { scaleX, scaleY, lowerWidth, upperHeight, lowerHeight, strokeWidth } =
    OPTS;
  const whiteCount = whiteIndex(keyOffset + keyCount) - whiteIndex(keyOffset);
  const w = scaleX * lowerWidth * whiteCount;
  const h = (lowerHeight + upperHeight) * scaleY;
  return [Math.round(w + strokeWidth * 2), Math.round(h + strokeWidth * 2)];
}

export interface PianoProps {
  range?: readonly [string, string];
  width?: string | number;
  height?: string | number;
  /** MIDI note numbers currently held; matching keys are shown darker with labels. */
  activeNoteNumbers?: number[];
}

export const Piano: FC<PianoProps> = ({
  range = DEFAULT_PIANO_RANGE,
  width,
  height,
  activeNoteNumbers = [],
}) => {
  const keys = buildKeys(range as Range);
  const [vbWidth, vbHeight] = totalDimensions(range as Range);
  const activeSet = new Set(activeNoteNumbers);
  const style: React.CSSProperties = {};
  if (width !== undefined)
    style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined)
    style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible"
      style={style}
      role="img"
      aria-label="Piano keyboard"
    >
      {keys.map((key, i) => {
        const midi = Note.midi(key.note);
        const isPressed = midi != null && activeSet.has(midi);
        const fill = isPressed
          ? OPTS.pressedPalette[key.isBlack ? 0 : 1]
          : key.fill;
        const isRangeEdge = i === 0 || i === keys.length - 1;
        const showLabel = isPressed || isRangeEdge;
        const labelFill = isPressed
          ? key.isBlack
            ? '#f2f2ef'
            : '#1a1a1d'
          : OPTS.rangeLabelFill;
        return (
          <g key={`${key.note}-${i}`}>
            <polygon
              points={key.points}
              fill={fill}
              stroke={key.stroke}
              strokeWidth={key.strokeWidth}
              data-note={key.note}
              data-pressed={isPressed ? 'true' : undefined}
            />
            {showLabel && (
              <text
                x={key.cx}
                y={key.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={labelFill}
                fontSize={key.isBlack ? 6 : 8}
                fontWeight="600"
                className="select-none pointer-events-none"
              >
                {key.note}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

import type { FC } from 'react';

/**
 * 3-octave piano keyboard (SVG). Visual reference: https://svgsilh.com/svg/307653.svg
 * UI only; no interaction or logic.
 */

export const DEFAULT_PIANO_RANGE = ['C3', 'B5'] as const;

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
};

type Range = readonly [string, string];

function parseRange(range: Range) {
  const pitchStart = range[0].slice(0, -1);
  const pitchEnd = range[1].slice(0, -1);
  const first = KEYBOARD_LAYOUT.findIndex((k) => (k.pitches as readonly string[]).includes(pitchStart));
  const last = KEYBOARD_LAYOUT.findIndex((k) => (k.pitches as readonly string[]).includes(pitchEnd));
  const keyOffset = first >= 0 ? first : 0;
  const octaveStart = parseInt(range[0].slice(-1), 10) || 3;
  const octaveEnd = parseInt(range[1].slice(-1), 10) || 5;
  const keyCount = Math.max(0, (octaveEnd - octaveStart + 1) * 12 - keyOffset - (11 - last));
  return { keyCount, keyOffset, octaveStart };
}

function whiteIndex(index: number) {
  return (
    Array.from({ length: index % 12 }, (_, i) => i).filter((i) => !ACCIDENTALS.includes(i)).length +
    Math.floor(index / 12) * 7
  );
}

function getNoteName(index: number, octaveStart: number): string {
  const layout = KEYBOARD_LAYOUT[index % 12];
  const octave = Math.floor(index / 12) + octaveStart;
  const idx = layout.pitches.length > 1 ? 1 : 0;
  const pitch = layout.pitches[idx] ?? (layout.pitches[0] as string);
  return pitch + octave;
}

function upperWidthScaled(
  key: (typeof KEYBOARD_LAYOUT)[number],
  index: number,
  keyOffset: number,
  keyCount: number,
  scaleX: number,
) {
  const isFirst = index === keyOffset;
  const isLast = index === keyOffset + keyCount - 1;
  if (isFirst) return (key.upperWidth + key.upperOffset) * scaleX;
  if (isLast) return (OPTS.lowerWidth - key.upperOffset) * scaleX;
  return key.upperWidth * scaleX;
}

function getKeyOffset(index: number, keyOffset: number, scaleX: number, strokeWidth: number) {
  const { lowerWidth } = OPTS;
  const wi = whiteIndex(index);
  const oi = whiteIndex(keyOffset);
  let firstOffset = KEYBOARD_LAYOUT[keyOffset % 12].upperOffset;
  if (ACCIDENTALS.includes(keyOffset % 12)) {
    const prev = KEYBOARD_LAYOUT[(keyOffset + 11) % 12];
    firstOffset -= lowerWidth - (prev.upperWidth + prev.upperOffset);
  }
  if (!ACCIDENTALS.includes(index % 12)) {
    return (wi * lowerWidth - oi * lowerWidth) * scaleX + Math.ceil(strokeWidth / 2);
  }
  let sum = firstOffset * scaleX + Math.ceil(strokeWidth / 2);
  for (let i = keyOffset; i < index; i++) {
    sum += KEYBOARD_LAYOUT[i % 12].upperWidth * scaleX;
  }
  return sum;
}

function buildKeys(range: Range): { note: string; points: string; fill: string; stroke: string; strokeWidth: number }[] {
  const { keyCount, keyOffset, octaveStart } = parseRange(range);
  const { scaleX, scaleY, lowerWidth, upperHeight, lowerHeight, strokeWidth, stroke, palette } = OPTS;
  const totalHeight = (lowerHeight + upperHeight) * scaleY;
  const keys: { note: string; points: string; fill: string; stroke: string; strokeWidth: number }[] = [];

  for (let i = keyOffset; i < keyOffset + keyCount; i++) {
    const layout = KEYBOARD_LAYOUT[i % 12];
    const isBlack = ACCIDENTALS.includes(i % 12);
    const upperW = upperWidthScaled(layout, i, keyOffset, keyCount, scaleX);
    const upperOff = (index: number) => (index === keyOffset ? 0 : layout.upperOffset) * scaleX;
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

    keys.push({
      note: getNoteName(i, octaveStart),
      points: ptsStr,
      fill: palette[isBlack ? 0 : 1],
      stroke,
      strokeWidth,
    });
  }
  return keys;
}

function totalDimensions(range: Range): [number, number] {
  const { keyCount, keyOffset } = parseRange(range);
  const { scaleX, scaleY, lowerWidth, upperHeight, lowerHeight, strokeWidth } = OPTS;
  const whiteCount = whiteIndex(keyOffset + keyCount) - whiteIndex(keyOffset);
  const w = scaleX * lowerWidth * whiteCount;
  const h = (lowerHeight + upperHeight) * scaleY;
  return [Math.round(w + strokeWidth * 2), Math.round(h + strokeWidth * 2)];
}

export interface PianoProps {
  range?: readonly [string, string];
  width?: string | number;
  height?: string | number;
}

export const Piano: FC<PianoProps> = ({ range = DEFAULT_PIANO_RANGE, width, height }) => {
  const keys = buildKeys(range as Range);
  const [vbWidth, vbHeight] = totalDimensions(range as Range);
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible"
      style={style}
      role="img"
      aria-label="Piano keyboard"
    >
      {keys.map((key, i) => (
        <polygon
          key={`${key.note}-${i}`}
          points={key.points}
          fill={key.fill}
          stroke={key.stroke}
          strokeWidth={key.strokeWidth}
          data-note={key.note}
        />
      ))}
    </svg>
  );
};

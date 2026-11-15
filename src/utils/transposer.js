const SHARP_NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLAT_TO_SHARP = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#" };

function moveNote(note, semitones) {
  const normalized = FLAT_TO_SHARP[note] || note;
  const index = SHARP_NOTES.indexOf(normalized);
  if (index < 0) return note;
  return SHARP_NOTES[(index + semitones + 120) % 12];
}

export function transposeChord(chord, semitones) {
  if (!semitones || !chord) return chord;
  const match = chord.match(/^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/);
  if (!match) return chord;
  const [, root, suffix, bass] = match;
  return moveNote(root, semitones) + suffix + (bass ? "/" + moveNote(bass, semitones) : "");
}

export function transposeSequence(chords, semitones) {
  return chords.map(chord => transposeChord(chord, semitones));
}
import { note } from "tblswvs";
import { RhythmStep, CLIP_16N_COUNT } from "../model/ableton/track";
import { AbletonNote } from "../model/ableton/note";


export const surroundRhythm = (sourceRhythm: RhythmStep[]): RhythmStep[] => {
  const surroundingRhythm: RhythmStep[] = [...new Array(sourceRhythm.length)].map(() => {
    return {state: 0, probability: 1, fillRepeats: 0, timingOffset: 0};
  });

  sourceRhythm.forEach((step, i, steps) => {
    if (step.state == 1) {
      if (steps.at(i - 1).state == 0) surroundingRhythm.at(i - 1).state = 1;
      if (steps.at((i + 1) % steps.length).state == 0) surroundingRhythm.at((i + 1) % steps.length).state = 1;
    }
  });

  return surroundingRhythm;
}


export const acceleratingBeatPositions = (gateCount: number, spreadAmount: number, offset: number) => {
  const acceleratingRange           = [...new Array(gateCount)].map((_, i) => i).map(i => 0.9 ** i);
  const acceleratingRangeNormalizer = 1 / acceleratingRange.reduce((p, c) => p + c, 0);
  const normalizedAcceleratingRange = acceleratingRange.map(offset => offset * acceleratingRangeNormalizer);

  const spreadNormalizedAcceleratingRange = normalizedAcceleratingRange.map(offset => offset * spreadAmount);
  return spreadNormalizedAcceleratingRange.reduce((beatPositions, distance, i) => {
    beatPositions.push(Math.round((beatPositions[i] + distance + Number.EPSILON) * 1000) / 1000)
    return beatPositions;
  }, [0]).slice(0, gateCount);
}


export const generateGhostNotes = (sourceRhythm: RhythmStep[], midiNote: number) => {
  const segmentRanges = sourceRhythm.reduce((segments, rhythmStep, i) => {
    if (rhythmStep.state == 1) segments.push(i)
    return segments;
  }, []).map((segmentIndex, i, arr) => {
    return i == arr.length - 1 ? [segmentIndex, sourceRhythm.length - 1] : [segmentIndex, arr[i + 1] - 1];
  });

  const ghostNotes = new Array();
  const measureCount = Math.floor(CLIP_16N_COUNT / sourceRhythm.length);
  const wholeNotesPerMeasure = Math.floor(sourceRhythm.length / 4);

  for (let measureIndex = 0; measureIndex < measureCount; measureIndex++) {
    const ghostNoteIndices = segmentRanges.reduce((ghostNotes, range, i) => {
      if (i % 2 == 0) {
        const offGateCount = range[1] - range[0];
        ghostNotes.push(Math.floor(Math.random() * offGateCount) + 1 + range[0]);
      }
      return ghostNotes;
    }, []);

    ghostNoteIndices.map(ghostNoteIndex => {
      // 16n within measure + timing offset + measure offset
      const clipPosition = (ghostNoteIndex * 0.25) + (0.25 * 0.25) + (wholeNotesPerMeasure * measureIndex);
      ghostNotes.push(new AbletonNote(midiNote, clipPosition, 0.25, 50, 1));
    });
  }

  return ghostNotes;
}


export const ghostNotesFor = (sourceRhythm: RhythmStep[], notes: note[][]) => {
  const ghostNotes = new Array();

  // filter the source rhythm to just the kicks, then just to the snares
  [36, 37].forEach(midiNote => {
    const voiceRhythm = new Array();
    let noteIndex = 0;
    for (let i = 0; i < sourceRhythm.length; i++) {
      if (sourceRhythm[i].state == 1) {
        // const state = notes[noteIndex].map(note => note.midi).includes(36) ? 1 : 0;
        voiceRhythm[i] = {state: notes[noteIndex].map(note => note.midi).includes(midiNote) ? 1 : 0, probability: 1, fillRepeats: 0, timingOffset: 0};
        noteIndex++;
      } else {
        voiceRhythm[i] = {state: 0, probability: 1, fillRepeats: 0, timingOffset: 0};
      }
    }
    ghostNotes.push(...generateGhostNotes(voiceRhythm, midiNote));
  });

  return ghostNotes;
}

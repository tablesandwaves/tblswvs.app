const missingNotes = (notes: AbletonNote[], otherNotes: AbletonNote[]) => {
  return notes.reduce((notesMissing: AbletonNote[], note: AbletonNote) => {
    let found = false;
    for (let i = 0; i < otherNotes.length; i++) {
      if (otherNotes[i].equals(note)) {
        found = true;
        break;
      }
    }
    if (!found) notesMissing.push(note);

    return notesMissing;
  }, []);
}


export class AbletonNote {
  midiNote: number;
  clipPosition: number;
  duration: number;
  velocity: number;
  inactive: boolean = false;


  constructor(midiNote: number, clipPosition: number, duration: number, velocity: number) {
    this.midiNote = midiNote;
    this.clipPosition = clipPosition;
    this.duration = duration;
    this.velocity = velocity;
  }


  toOscAddedNote(): {}[] {
    return [
      {type: "integer", value: this.midiNote},
      {type: "double",  value: this.clipPosition},
      {type: "double",  value: this.duration},
      {type: "float",   value: this.velocity},
      {type: "boolean", value: this.inactive}
    ];
  }


  toOscRemovedNote(): {}[] {
    return [
      {type: "integer", value: this.midiNote},
      {type: "integer", value: 1},
      {type: "double",  value: this.clipPosition},
      {type: "double",  value: this.duration},
    ];
  }


  equals(other: AbletonNote): boolean {
    return this.midiNote == other.midiNote &&
           this.clipPosition == other.clipPosition &&
           this.duration == other.duration &&
           this.velocity == other.velocity &&
           this.inactive == other.inactive;
  }


  static diffAbletonNotes(currentNotes: AbletonNote[], otherNotes: AbletonNote[]) {
    return {
      addedNotes:   missingNotes(otherNotes, currentNotes),
      removedNotes: missingNotes(currentNotes, otherNotes)
    }
  }
}

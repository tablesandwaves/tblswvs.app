declare module "tblswvs" {

  class Key {
    constructor(midiNote: number, scale: Scale)
  }

  enum Scale {
    Ionian,
    Dorian,
    Phrygian,
    Lydian,
    Mixolydian,
    Aeolian,
    Locrian,
    Major,
    Minor,
    MajPentatonic,
    MinPentatonic,
    WholeTone,
    Chromatic,
    GS,
  }
}

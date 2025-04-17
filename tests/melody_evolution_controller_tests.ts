import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { MelodyEvolutionController } from "../app/controller/melody_evolution_controller";
import { configDirectory, rhythmStepsForPattern } from "./test_helpers";
import { MelodicTrack } from "../app/model/ableton/melodic_track";


const testing   = true;


describe("MelodyEvolutionController", () => {
  describe("Selecting the initial blank melody evolution page", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    it("sets the active page to a melody evolution page", () => expect(evolutionPage).to.be.instanceOf(MelodyEvolutionController));

    it("has no active mutations", () => {
      expect(sequencer.daw.mutations.filter(m => m.active).length).to.eq(0)
    });

    it("there are no mutating or randomizing tracks", () => {
      sequencer.daw.tracks.forEach(t => {
        expect(t.mutating).to.be.false;
        expect(t.randomizing).to.be.false;
      });
    });

    it("has a a blank randomizing row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank independent mutations row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank trading solos row", () => {
      expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });

    it("has a blank active mutations row", () => {
      expect(evolutionPage.gridActiveMutationsRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });
  });


  describe("setting tracks to accompaniment", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the snare and keys track to randomizing
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});
    sequencer.grid.keyPress({y: 6, x: 5, s: 1});

    it("enables the tracks' accompaniment mode", () => {
      expect(sequencer.daw.tracks.map(t => t.accompaniment)).to.have.ordered.members(
        [false, true, false, false, false, true, false, false]
      );
    });

    it("updates the accompaniment row", () => {
      expect(evolutionPage.gridAccopmanimentTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 10, 0, 0]
      );
    });
  });


  describe("setting a previously randomizing track to accompaniment", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the snare track to randomizing
    sequencer.grid.keyPress({y: 0, x: 1, s: 1});
    expect(sequencer.daw.tracks[1].randomizing).to.be.true;
    expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0, 0]);

    // Then set it to accompaniment
    sequencer.grid.keyPress({y: 6, x: 1, s: 1});

    it("enables the track's accompaniment mode", () => {
      expect(sequencer.daw.tracks[1].accompaniment).to.be.true;
    });

    it("disables the track's randomizing mode", () => {
      expect(sequencer.daw.tracks[1].randomizing).to.be.false;
    });

    it("updates the randomizing row", () => {
      expect(evolutionPage.gridAccopmanimentTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 0, 0, 0]
      );
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("setting tracks to randomizing", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the snare and keys track to randomizing
    sequencer.grid.keyPress({y: 0, x: 1, s: 1});
    sequencer.grid.keyPress({y: 0, x: 5, s: 1});

    it("enables the tracks' randomization mode", () => {
      expect(sequencer.daw.tracks.map(t => t.randomizing)).to.have.ordered.members(
        [false, true, false, false, false, true, false, false]
      );
    });

    it("updates the randomizing row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 10, 0, 0]
      );
    });
  });


  describe("setting a previously mutating track to randomizing", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the snare track to mutating
    sequencer.grid.keyPress({y: 1, x: 1, s: 1});
    expect(sequencer.daw.tracks[1].mutating).to.be.true;
    expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0, 0]);

    // Then set it to randomizing
    sequencer.grid.keyPress({y: 0, x: 1, s: 1});

    it("enables the track's randomization mode", () => {
      expect(sequencer.daw.tracks[1].randomizing).to.be.true;
    });

    it("disables the track's mutating mode", () => {
      expect(sequencer.daw.tracks[1].mutating).to.be.false;
    });

    it("updates the randomizing row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 0, 0, 0]
      );
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("setting a previously randomizing track to mutating", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the snare track to randomizing
    sequencer.grid.keyPress({y: 0, x: 1, s: 1});
    expect(sequencer.daw.tracks[1].randomizing).to.be.true;
    expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0, 0]);

    // Then set it to mutating
    sequencer.grid.keyPress({y: 1, x: 1, s: 1});

    it("enables the track's mutating mode", () => {
      expect(sequencer.daw.tracks[1].mutating).to.be.true;
    });

    it("disables the track's randomizing mode", () => {
      expect(sequencer.daw.tracks[1].randomizing).to.be.false;
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 0, 0, 0]
      );
    });

    it("updates the randomizing row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("setting a previously soloing track to mutating", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the snare track to soloing
    sequencer.grid.keyPress({y: 2, x: 1, s: 1});
    expect(sequencer.daw.soloists).to.include(2);
    expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0, 0]);

    // Then set it to mutating
    sequencer.grid.keyPress({y: 1, x: 1, s: 1});

    it("enables the track's mutating mode", () => {
      expect(sequencer.daw.tracks[1].mutating).to.be.true;
    });

    it("removes the track from the soloists", () => {
      expect(sequencer.daw.soloists).not.to.include(2);
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 0, 0, 0]
      );
    });

    it("updates the soloists row", () => {
      expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("setting tracks to mutating", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 6, s: 1}); // Set the active track to a melodic track.
    const track = sequencer.daw.getActiveTrack() as MelodicTrack;

    const melodyNotes = [
      [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
      [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
      [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
    ];
    track.setInputNotes(melodyNotes);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the keys and hydra tracks to mutating
    sequencer.grid.keyPress({y: 1, x: 5, s: 1});
    sequencer.grid.keyPress({y: 1, x: 6, s: 1});

    it("enables the tracks' mutating mode", () => {
      expect(sequencer.daw.tracks.map(t => t.mutating)).to.have.ordered.members(
        [false, false, false, false, false, true, true, false]
      );
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 10, 10, 0]
      );
    });

    it("sets the track's current mutation to the flattened output notes", () => {
      expect(track.currentMutation).to.deep.eq([
        { octave: 3, note: 'C', midi: 60, scaleDegree: 1 },
        { octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 },
        { octave: 3, note: 'G', midi: 67, scaleDegree: 5 }
      ]);
    });
  });


  describe("setting tracks to soloing", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 5, s: 1}); // Set the active track to a melodic track.
    const track = sequencer.daw.getActiveTrack() as MelodicTrack;

    const melodyNotes = [
      [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
      [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
      [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
    ];
    track.setInputNotes(melodyNotes);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Set the keys and hydra tracks to soloing
    sequencer.grid.keyPress({y: 2, x: 5, s: 1});
    sequencer.grid.keyPress({y: 2, x: 6, s: 1});

    it("adds the tracks' DAW indices to the soloists list", () => {
      expect(sequencer.daw.soloists).to.have.ordered.members([6, 7]);
    });

    it("updates the soloing row", () => {
      expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 10, 10, 0]
      );
    });

    it("sets the DAW's current mutation to the first soloist's flattened output notes", () => {
      expect(sequencer.daw.currentSoloistMelody).to.have.ordered.members(melodyNotes.flat());
    });
  });

  describe("enabling the mutations to start", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Press the enable mutation button
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});

    it("enables on the DAW's mutation state", () => expect(sequencer.daw.mutating).to.be.true);
    it("returns the brightness for the button", () => expect(evolutionPage.gridMutationsEnabledButton()).to.eq(10));
  });


  describe("turning mutations on for a second time", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    sequencer.grid.keyPress({y: 7, x: 6, s: 1}); // Set the active track to a melodic track.
    const track = sequencer.daw.getActiveTrack() as MelodicTrack;

    track.setInputNotes([[{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }]]);
    // track.generateOutputNotes();
    track.rhythm = rhythmStepsForPattern([
      1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
      0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,
    ]);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});

    // Set a track to mutating, select a deterministic evolutionary algorithm, then press the enable mutations button
    sequencer.grid.keyPress({y: 1, x: 6, s: 1});
    sequencer.grid.keyPress({y: 0, x: 8, s: 1});
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});

    expect(track.currentMutation).to.deep.eq(
      [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }]
    );

    // Evolve the track's melody
    track.evolveMelody();
    expect(track.currentMutation).to.deep.eq([
      { octave: 3, note: 'C', midi: 60, scaleDegree: 1 },
      { octave: 3, note: 'C', midi: 60, scaleDegree: 1 },
      { octave: 3, note: 'C', midi: 60, scaleDegree: 1 },
      { octave: 3, note: 'C', midi: 60, scaleDegree: 1 }
    ]);

    // Turn the mutations off and then on again
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});

    it("should reset the mutating track's current mutation", () => {
      expect(track.currentMutation).to.deep.eq(
        [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }]
      );
    });
  });


  describe("disabling mutations", () => {
    const sequencer = new Sequencer(configDirectory, testing);

    // Select the global page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 12, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionController;

    // Press the enable mutation button
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});
    expect(sequencer.daw.mutating).to.be.true;

    // Press the enable mutation button again
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});

    it("enables on the DAW's mutation state", () => expect(sequencer.daw.mutating).to.be.false);
    it("returns the brightness for the button", () => expect(evolutionPage.gridMutationsEnabledButton()).to.eq(0));
  });
});

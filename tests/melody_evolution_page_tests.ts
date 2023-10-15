import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { MelodyEvolutionPage } from "../app/model/grid/melody_evolution_page";


const testing   = true;


describe("MelodyEvolutionPage", () => {
  describe("Selecting the initial blank melody evolution page", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    it("sets the active page to a ramp sequence page", () => expect(evolutionPage).to.be.instanceOf(MelodyEvolutionPage));

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
        [0, 0, 0, 0,  0, 0, 0]
      );
    });

    it("has a blank independent mutations row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });

    it("has a blank trading solos row", () => {
      expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });

    it("has a blank active mutations row", () => {
      expect(evolutionPage.gridActiveMutationsRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });


  describe("setting tracks to randomizing", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Set the snare and keys track to randomizing
    sequencer.grid.keyPress({y: 0, x: 1, s: 1});
    sequencer.grid.keyPress({y: 0, x: 5, s: 1});

    it("enables the tracks' randomization mode", () => {
      expect(sequencer.daw.tracks.map(t => t.randomizing)).to.have.ordered.members(
        [false, true, false, false, false, true, false]
      );
    });

    it("updates the randomizing row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 10, 0]
      );
    });
  });


  describe("setting a previously mutating track to randomizing", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Set the snare track to mutating
    sequencer.grid.keyPress({y: 1, x: 1, s: 1});
    expect(sequencer.daw.tracks[1].mutating).to.be.true;
    expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0]);

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
        [0, 10, 0, 0,  0, 0, 0]
      );
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });
  });


  describe("setting a previously randomizing track to mutating", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Set the snare track to randomizing
    sequencer.grid.keyPress({y: 0, x: 1, s: 1});
    expect(sequencer.daw.tracks[1].randomizing).to.be.true;
    expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0]);

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
        [0, 10, 0, 0,  0, 0, 0]
      );
    });

    it("updates the randomizing row", () => {
      expect(evolutionPage.gridRandomizingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });
  });


  describe("setting a previously soloing track to mutating", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Set the snare track to soloing
    sequencer.grid.keyPress({y: 2, x: 1, s: 1});
    expect(sequencer.daw.soloists).to.include(2);
    expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members([0, 10, 0, 0,  0, 0, 0]);

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
        [0, 10, 0, 0,  0, 0, 0]
      );
    });

    it("updates the soloists row", () => {
      expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });
  });


  describe("setting tracks to mutating", () => {
    const sequencer = new Sequencer(testing);
    const outputNotes = [
      [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
      [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
      [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
    ];
    sequencer.daw.tracks[1].outputNotes = outputNotes;

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Set the snare and keys track to mutating
    sequencer.grid.keyPress({y: 1, x: 1, s: 1});
    sequencer.grid.keyPress({y: 1, x: 5, s: 1});

    it("enables the tracks' mutating mode", () => {
      expect(sequencer.daw.tracks.map(t => t.mutating)).to.have.ordered.members(
        [false, true, false, false, false, true, false]
      );
    });

    it("updates the mutating row", () => {
      expect(evolutionPage.gridMutatingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 10, 0]
      );
    });

    it("sets a track's current mutation to its flattened output notes", () => {
      expect(sequencer.daw.tracks[1].currentMutation).to.have.ordered.members(outputNotes.flat());
    });
  });


  describe("setting tracks to soloing", () => {
    const sequencer = new Sequencer(testing);
    const outputNotes = [
      [{ octave: 3, note: 'C', midi: 60, scaleDegree: 1 }],
      [{ octave: 3, note: 'Eb', midi: 63, scaleDegree: 3 }],
      [{ octave: 3, note: 'G', midi: 67, scaleDegree: 5 }]
    ];
    sequencer.daw.tracks[1].outputNotes = outputNotes;

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Set the snare and keys track to soloing
    sequencer.grid.keyPress({y: 2, x: 1, s: 1});
    sequencer.grid.keyPress({y: 2, x: 5, s: 1});

    it("adds the tracks' DAW indices to the soloists list", () => {
      expect(sequencer.daw.soloists).to.have.ordered.members([2, 6]);
    });

    it("updates the soloing row", () => {
      expect(evolutionPage.gridSoloingTracksRow()).to.have.ordered.members(
        [0, 10, 0, 0,  0, 10, 0]
      );
    });

    it("sets the DAW's current mutation to the first soloist's flattened output notes", () => {
      expect(sequencer.daw.currentSoloistMelody).to.have.ordered.members(outputNotes.flat());
    });
  });

  describe("enabling the mutations to start", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Press the enable mutation button
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});

    it("enables on the DAW's mutation state", () => expect(sequencer.daw.mutating).to.be.true);
    it("returns the brightness for the button", () => expect(evolutionPage.gridMutationsEnabledButton()).to.eq(10));
  });


  describe("disabling mutations", () => {
    const sequencer = new Sequencer(testing);

    // Select the melody page, then paginate over to the right 1 sub-page
    sequencer.grid.keyPress({y: 7, x: 9, s: 1});
    sequencer.grid.keyPress({y: 7, x: 15, s: 1});
    const evolutionPage = sequencer.grid.activePage as MelodyEvolutionPage;

    // Press the enable mutation button
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});
    expect(sequencer.daw.mutating).to.be.true;

    // Press the enable mutation button again
    sequencer.grid.keyPress({y: 0, x: 15, s: 1});

    it("enables on the DAW's mutation state", () => expect(sequencer.daw.mutating).to.be.false);
    it("returns the brightness for the button", () => expect(evolutionPage.gridMutationsEnabledButton()).to.eq(0));
  });
});

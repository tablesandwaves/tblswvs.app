import { expect } from "chai";
import { Sequencer } from "../app/model/sequencer";
import { MelodyEvolutionPage } from "../app/model/grid/melody_evolution_page";


const testing   = true;


describe("MelodyEvolutionPage", () => {
  describe("Selecting the initial blank ramp sequence page", () => {
    const sequencer = new Sequencer(testing);
    const track = sequencer.daw.getActiveTrack();

    // Select the an active track, then the melody page, then paginate over to the right 1 sub-page
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
      expect(evolutionPage.gridIndependentMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });

    it("has a blank trading solos row", () => {
      expect(evolutionPage.gridSoloistMutatingTracksRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0]
      );
    });

    it("has a blank active mutations row", () => {
      expect(evolutionPage.gridActiveMutationsRow()).to.have.ordered.members(
        [0, 0, 0, 0,  0, 0, 0, 0]
      );
    });
  });
});

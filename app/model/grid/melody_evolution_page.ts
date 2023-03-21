import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class MelodyEvolutionPage extends GridPage {
  type = "Melody";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("toggleMutationAlgorithm", this.toggleMutationAlgorithm);
    this.functionMap.set("toggleImprovisingVoice", this.toggleImprovisingVoice);
    this.functionMap.set("queueMutationStart", this.queueMutationStart);
    this.functionMap.set("queueMutationStop", this.queueMutationStop);

    this.grid.clearGridDisplay();
    this.refresh();
  }


  refresh() {
    this.setGridMutationDisplay();
    this.setUiMutations();
  }


  queueMutationStart(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    // Set lead improvisor for trading melodies.
    gridPage.grid.sequencer.leadImproviser = gridPage.grid.sequencer.activeTrack;

    // Both the individual tracks AND the sequencer must set mutating=true to avoid an evolutionary cycles
    // starting before mutation melodies are in place since mutation cycles happen at the start of each
    // super measure.
    gridPage.grid.sequencer.daw.tracks.forEach((track, trackIndex) => {
      if (track.mutating) {
        gridPage.grid.sequencer.tracks[trackIndex].currentMutation = gridPage.grid.sequencer.tracks[trackIndex].outputNotes.flat();
        gridPage.grid.sequencer.evolve(trackIndex);
      }
    });
    gridPage.grid.sequencer.mutating = true;
  }


  /**
   * Stops all mutations.
   *
   * @param gridPage the MelodyEvolutionPage itself, required since `this` object is unavailable from function map
   * @param press the press object represented the grid key press button and state
   */
  queueMutationStop(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.tracks.forEach(t => t.mutating = false);
    gridPage.grid.sequencer.mutating = false;
    gridPage.refresh();
  }


  /**
   * Enables or disables mutation/evolution for the voice represented by the grid key press.
   *
   * @param gridPage the MelodyEvolutionPage itself, required since `this` object is unavailable from function map
   * @param press the press object represented the grid key press button and state
   */
  toggleImprovisingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.tracks[press.x].mutating = !gridPage.grid.sequencer.daw.tracks[press.x].mutating;
    gridPage.refresh();
  }


  toggleMutationAlgorithm(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const offset = 6;
    gridPage.grid.sequencer.mutations[press.x - offset].active = 1 - gridPage.grid.sequencer.mutations[press.x - offset].active;
    gridPage.refresh();
  }


  setGridMutationDisplay() {
    // Light up the particpating tracks
    for (let i = 0; i < this.grid.sequencer.daw.tracks.length; i++)
      this.grid.levelSet(i, 0, this.grid.sequencer.daw.tracks[i].mutating ? 10 : 0);

    // Ligth up the active mutations
    const offset = 6;
    for (let i = 0; i < this.grid.sequencer.mutations.length; i++)
      this.grid.levelSet(offset + i, 0, this.grid.sequencer.mutations[i].active == 1 ? 10 : 0);
  }


  setUiMutations() {
    this.grid.sequencer.gui.webContents.send(
      "update-mutations",
      this.grid.sequencer.daw.tracks.reduce((activeTracks, track, tIdx) => {
        if (track.mutating) activeTracks.push(this.grid.sequencer.tracks[tIdx].name);
        return activeTracks;
      }, []).join(" "),
      this.grid.sequencer.mutations.filter(m => m.active == 1).map(m => m.name).join(" ")
    );
  }
}

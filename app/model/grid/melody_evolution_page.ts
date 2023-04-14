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
    this.functionMap.set("toggleVoiceTrading", this.toggleVoiceTrading);

    this.grid.clearGridDisplay();
    this.refresh();
  }


  refresh() {
    this.setGridMutationDisplay();
    this.setUiMutations();
  }


  queueMutationStart(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    // Both the individual tracks AND the sequencer must set mutating=true to avoid an evolutionary cycle
    // starting before mutation melodies are in place since mutation cycles happen at the start of each
    // super measure.
    gridPage.grid.sequencer.daw.tracks.forEach((track) => {
      if (track.mutating) {
        track.currentMutation = track.outputNotes.flat();
        track.evolve();
      }
    });
    gridPage.grid.sequencer.daw.mutating = true;
  }


  /**
   * Stops all mutations.
   *
   * @param gridPage the MelodyEvolutionPage itself, required since `this` object is unavailable from function map
   * @param press the press object represented the grid key press button and state
   */
  queueMutationStop(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.tracks.forEach(t => t.mutating = false);
    gridPage.grid.sequencer.daw.mutating = false;
    gridPage.refresh();
  }


  /**
   * Enables or disables mutation/evolution for the voice represented by the grid key press.
   *
   * @param gridPage the MelodyEvolutionPage itself, required since `this` object is unavailable from function map
   * @param press the press object represented the grid key press button and state
   */
  toggleImprovisingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    // When in voice trading mode, the lead improvisor should not be removed from the soloists list and taken out
    // of mutating state.
    if (gridPage.grid.sequencer.daw.soloists[0] != press.x) {
      gridPage.grid.sequencer.daw.tracks[press.x].mutating = !gridPage.grid.sequencer.daw.tracks[press.x].mutating;
    }

    // When in voice trading mode and not the lead improvisor...
    if (gridPage.grid.sequencer.daw.soloists.length > 0 && gridPage.grid.sequencer.daw.soloists[0] != press.x) {
      // Was the pressed track index just set to mutating?
      if (gridPage.grid.sequencer.daw.tracks[press.x].mutating) {
        gridPage.grid.sequencer.daw.soloists.push(press.x);
      } else {
        // If the pressed track index is not mutating, remove it from the soloists list.
        const index = gridPage.grid.sequencer.daw.soloists.indexOf(press.x);
        if (index !== -1) {
          gridPage.grid.sequencer.daw.soloists.splice(index, 1);
        }
      }
    }
    gridPage.refresh();
  }


  toggleMutationAlgorithm(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const offset = 6;
    gridPage.grid.sequencer.daw.mutations[press.x - offset].active = 1 - gridPage.grid.sequencer.daw.mutations[press.x - offset].active;
    gridPage.refresh();
  }


  toggleVoiceTrading(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    if (gridPage.grid.sequencer.daw.soloists.length > 0) {
      // There are currently soloists, clear the soloists and reset all tracks' mutating state
      gridPage.grid.sequencer.daw.soloists = new Array();
      gridPage.grid.sequencer.daw.tracks.forEach(t => t.mutating = false);
    } else {
      // There are no current soloists, add the active track as the current soloist and reset all other tracks
      gridPage.grid.sequencer.daw.tracks.forEach((t, i) => t.mutating = (i == gridPage.grid.sequencer.daw.activeTrack));
      gridPage.grid.sequencer.daw.soloists.push(gridPage.grid.sequencer.daw.activeTrack);
      gridPage.grid.sequencer.daw.currentSoloistMelody = gridPage.grid.sequencer.daw.tracks[gridPage.grid.sequencer.daw.activeTrack].outputNotes.flat();
      gridPage.grid.sequencer.daw.soloistIndex = -1;
    }
    gridPage.refresh();
  }


  setGridMutationDisplay() {
    // Light up the particpating tracks
    for (let i = 0; i < this.grid.sequencer.daw.tracks.length; i++)
      this.grid.levelSet(i, 0, this.grid.sequencer.daw.tracks[i].mutating ? 10 : 0);

    // Ligth up the active mutations
    const offset = 6;
    for (let i = 0; i < this.grid.sequencer.daw.mutations.length; i++)
      this.grid.levelSet(offset + i, 0, this.grid.sequencer.daw.mutations[i].active == 1 ? 10 : 0);

    // Light up the voice trading/soloists state
    this.grid.levelSet(15, 2, this.grid.sequencer.daw.soloists.length > 0 ? 10 : 0);
  }


  setUiMutations() {
    this.grid.sequencer.gui.webContents.send(
      "update-mutations",
      this.grid.sequencer.daw.tracks.reduce((activeTracks, track, tIdx) => {
        if (track.mutating) activeTracks.push(this.grid.sequencer.daw.tracks[tIdx].name);
        return activeTracks;
      }, []).join(" "),
      this.grid.sequencer.daw.mutations.filter(m => m.active == 1).map(m => m.name).join(" ")
    );
  }
}

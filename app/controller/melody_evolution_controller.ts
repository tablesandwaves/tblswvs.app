import { ApplicationController, GridConfig, GridKeyPress, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./application_controller";
import { MonomeGrid } from "../model/grid/monome_grid";


export class MelodyEvolutionController extends ApplicationController {
  type = "Melody";


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("toggleMutationAlgorithm", this.toggleMutationAlgorithm);
    this.functionMap.set("toggleRandomizingVoice", this.toggleRandomizingVoice);
    this.functionMap.set("toggleMutatingVoice", this.toggleMutatingVoice);
    this.functionMap.set("toggleSoloingVoice", this.toggleSoloingVoice);
    this.functionMap.set("toggleMutations", this.toggleMutations);

    this.grid.clearGridDisplay();
  }


  refresh() {
    this.setGridEvolutionDisplay();

    if (!this.grid.sequencer.testing) {
      this.#setUiTrackEvolutions();
      this.#setUiActiveMutations();
    }
  }


  setGridEvolutionDisplay() {
    this.setGridTopRow();
    this.setGridMutatingTracksDisplay();
    this.setGridSoloistMutatingTracksDisplay();
  }


  setGridTopRow() {
    let row = this.gridRandomizingTracksRow()
    row = row.concat(this.gridActiveMutationsRow())
    row.push(this.gridMutationsEnabledButton());
    this.grid.levelRow(0, 0, row.slice(0, 8));
    this.grid.levelRow(8, 0, row.slice(8, 16));
  }


  setGridMutatingTracksDisplay() {
    const row = this.gridMutatingTracksRow();
    row.push(INACTIVE_BRIGHTNESS); // Grid requires updates of 8 per row
    this.grid.levelRow(0, 1, row);
  }


  setGridSoloistMutatingTracksDisplay() {
    const row = this.gridSoloingTracksRow();
    row.push(INACTIVE_BRIGHTNESS); // Grid requires updates of 8 per row
    this.grid.levelRow(0, 2, row);
  }


  setGridMutationsButton() {
    this.grid.levelSet(15, 0, this.gridMutationsEnabledButton());
  }


  toggleMutations(gridPage: MelodyEvolutionController, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.mutating = !gridPage.grid.sequencer.daw.mutating;
    // Flag for resetting all tracks to their current clips at the next super measure boundary
    if (!gridPage.grid.sequencer.daw.mutating) gridPage.grid.sequencer.daw.stopMutationQueued = true;
    gridPage.setGridMutationsButton();
  }


  toggleRandomizingVoice(gridPage: MelodyEvolutionController, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];
    track.randomizing = !track.randomizing;

    gridPage.refresh();
  }


  toggleMutatingVoice(gridPage: MelodyEvolutionController, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];
    track.mutating = !track.mutating;

    // Seed the initial mutating melody
    if (track.mutating) {
      track.currentMutation = track.outputNotes.flat();
    }

    gridPage.refresh();
  }


  toggleSoloingVoice(gridPage: MelodyEvolutionController, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];
    track.soloing = !track.soloing;

    // Seed the initial mutating melody from the first soloist
    if (gridPage.grid.sequencer.daw.soloists.length == 1) {
      gridPage.grid.sequencer.daw.currentSoloistMelody = track.outputNotes.flat();
    }

    gridPage.refresh();
  }


  toggleMutationAlgorithm(gridPage: MelodyEvolutionController, press: GridKeyPress) {
    const offset = 7;
    gridPage.grid.sequencer.daw.mutations[press.x - offset].active = 1 - gridPage.grid.sequencer.daw.mutations[press.x - offset].active;
    gridPage.refresh();
  }


  #setUiTrackEvolutions() {
    this.grid.sequencer.gui.webContents.send(
      "update-track-evolution",
      ...this.grid.sequencer.daw.tracks.reduce((evolutionStates, track, tIdx) => {
        if (track.randomizing) evolutionStates[0].push(tIdx);
        else if (track.mutating) evolutionStates[1].push(tIdx);
        else if (track.soloing) evolutionStates[2].push(tIdx);

        return evolutionStates;
      }, [[], [], []])
    );
  }


  #setUiActiveMutations() {
    this.grid.sequencer.gui.webContents.send(
      "update-mutations",
      this.grid.sequencer.daw.mutations.filter(m => m.active).map(m => m.name)
    );
  }


  gridRandomizingTracksRow() {
    return this.grid.sequencer.daw.tracks.map(t => t.randomizing ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  gridMutatingTracksRow() {
    return this.grid.sequencer.daw.tracks.map(t => {
      return t.mutating && !this.grid.sequencer.daw.soloists.includes(t.dawIndex) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    });
  }


  gridSoloingTracksRow() {
    return this.grid.sequencer.daw.tracks.map(t => t.soloing ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  gridActiveMutationsRow() {
    return this.grid.sequencer.daw.mutations.map(m => m.active ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  gridMutationsEnabledButton() {
    return this.grid.sequencer.daw.mutating ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
  }
}

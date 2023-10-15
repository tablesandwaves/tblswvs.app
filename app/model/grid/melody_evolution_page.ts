import { GridPage, GridConfig, GridKeyPress, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class MelodyEvolutionPage extends GridPage {
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
    // this.#setUiMutations();
  }


  setGridEvolutionDisplay() {
    this.setGridTopRow();
    this.setGridMutatingTracksDisplay();
    this.setGridSoloistMutatingTracksDisplay();
    // this.setGridActiveMutationsRow();
    // this.setGridMutationsButton();
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


  toggleMutations(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.mutating = !gridPage.grid.sequencer.daw.mutating;
    // Flag for resetting all tracks to their current clips at the next super measure boundary
    if (!gridPage.grid.sequencer.daw.mutating) gridPage.grid.sequencer.daw.stopMutationQueued = true;
    gridPage.setGridMutationsButton();
  }


  toggleRandomizingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];
    track.randomizing = !track.randomizing;

    gridPage.refresh();
  }


  toggleMutatingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];
    track.mutating = !track.mutating;

    // Seed the initial mutating melody
    if (track.mutating) {
      track.currentMutation = track.outputNotes.flat();
    }

    gridPage.refresh();
  }


  toggleSoloingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];
    track.soloing = !track.soloing;

    // Seed the initial mutating melody from the first soloist
    if (gridPage.grid.sequencer.daw.soloists.length == 1) {
      gridPage.grid.sequencer.daw.currentSoloistMelody = track.outputNotes.flat();
    }

    gridPage.refresh();
  }


  toggleMutationAlgorithm(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const offset = 7;
    gridPage.grid.sequencer.daw.mutations[press.x - offset].active = 1 - gridPage.grid.sequencer.daw.mutations[press.x - offset].active;
    gridPage.refresh();
  }


  #setUiMutations() {
    this.grid.sequencer.gui.webContents.send(
      "update-mutations",
      this.grid.sequencer.daw.tracks.reduce((activeTracks, track, tIdx) => {
        if (track.mutating) activeTracks.push(this.grid.sequencer.daw.tracks[tIdx].name);
        return activeTracks;
      }, []).join(" "),
      this.grid.sequencer.daw.mutations.filter(m => m.active == 1).map(m => m.name).join(" ")
    );

    this.grid.sequencer.gui.webContents.send(
      "toggle-melody-randomizer",
      this.grid.sequencer.daw.getActiveTrack().randomizing
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

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
    this.refresh();
  }


  refresh() {
    this.setGridEvolutionDisplay();
    // this.#setGridMutationDisplay();
    // this.#setUiMutations();
  }


  setGridEvolutionDisplay() {
    this.setGridRamdonizingTracksDisplay();
    this.setGridIndependentMutatingTracksDisplay();
    this.setGridSoloistMutatingTracksDisplay();
    this.setGridActiveMutationsRow();
    this.setGridMutationsButton();
  }


  setGridRamdonizingTracksDisplay() {
    const row = this.gridRandomizingTracksRow();
    this.grid.levelRow(0, 0, row);
  }


  setGridIndependentMutatingTracksDisplay() {
    const row = this.gridMutatingTracksRow();
    this.grid.levelRow(0, 1, row);
  }


  setGridSoloistMutatingTracksDisplay() {
    const row = this.gridSoloingTracksRow();
    this.grid.levelRow(0, 2, row);
  }


  setGridActiveMutationsRow() {
    const row = this.gridActiveMutationsRow();
    this.grid.levelRow(0, 7, row);
  }


  setGridMutationsButton() {
    this.grid.levelSet(15, 0, this.gridMutationsEnabledButton());
  }


  toggleMutations(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.daw.mutating = !gridPage.grid.sequencer.daw.mutating;
    gridPage.setGridMutationsButton();
  }


  toggleRandomizingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];

    track.randomizing = true;
    track.mutating    = false;

    const index = gridPage.grid.sequencer.daw.soloists.indexOf(press.x);
    if (index !== -1) gridPage.grid.sequencer.daw.soloists.splice(index, 1);

    gridPage.refresh();
  }


  toggleMutatingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];

    track.randomizing = false;
    track.mutating    = true;

    const index = gridPage.grid.sequencer.daw.soloists.indexOf(press.x);
    if (index !== -1) gridPage.grid.sequencer.daw.soloists.splice(index, 1);

    gridPage.refresh();
  }


  toggleSoloingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track = gridPage.grid.sequencer.daw.tracks[press.x];

    track.randomizing = false;
    track.mutating    = false;

    const index = gridPage.grid.sequencer.daw.soloists.indexOf(press.x);
    if (index === -1) {
      gridPage.grid.sequencer.daw.soloists.push(press.x);
    } else {
      gridPage.grid.sequencer.daw.soloists.splice(index, 1);
    }

    gridPage.refresh();
  }


  toggleMutationAlgorithm(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const offset = 6;
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
    return this.grid.sequencer.daw.tracks.map((_, i) => {
      return this.grid.sequencer.daw.soloists.includes(i) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    });
  }


  gridActiveMutationsRow() {
    return this.grid.sequencer.daw.mutations.map(m => m.active ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }


  gridMutationsEnabledButton() {
    return this.grid.sequencer.daw.mutating ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
  }
}

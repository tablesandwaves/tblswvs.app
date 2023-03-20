import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class MelodyEvolutionPage extends GridPage {
  type = "Melody";
  editingMutationParameters: boolean = false;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("toggleMutationAlgorithm", this.toggleMutationAlgorithm);
    this.functionMap.set("toggleImprovisingVoice", this.toggleImprovisingVoice);
    this.functionMap.set("toggleMutationSetup", this.toggleMutationSetup);
    this.functionMap.set("queueMutationStart", this.queueMutationStart);
    this.functionMap.set("queueMutationStop", this.queueMutationStop);

    this.grid.clearGridDisplay();
    this.refresh();
  }


  refresh() {
    this.setGridMutationDisplay();
    this.setUiMutations();
  }


  toggleMutationSetup(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.editingMutationParameters = !gridPage.editingMutationParameters;
    gridPage.grid.levelSet(press.x, press.y, (gridPage.editingMutationParameters ? 10 : 0));
    if (gridPage.editingMutationParameters) {
      gridPage.grid.sequencer.mutatingTracks = [0, 0, 0, 0, 0, 0];
      gridPage.grid.sequencer.mutations.forEach(m => m.active = 0);
      gridPage.refresh();
    }
  }


  queueMutationStart(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.leadImproviser = gridPage.grid.sequencer.activeTrack;
    gridPage.grid.sequencer.mutating = true;
    gridPage.grid.sequencer.daw.tracks[gridPage.grid.sequencer.activeTrack].mutating = true;
    gridPage.grid.sequencer.currentMutation = gridPage.grid.sequencer.getActiveTrack().outputNotes.flat();
    gridPage.grid.sequencer.evolve();
  }


  queueMutationStop(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    gridPage.grid.sequencer.mutating = false;
    gridPage.grid.sequencer.daw.tracks[gridPage.grid.sequencer.activeTrack].mutating = false;
  }


  toggleImprovisingVoice(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    if (gridPage.editingMutationParameters) {
      gridPage.grid.sequencer.mutatingTracks[press.x] = 1 - gridPage.grid.sequencer.mutatingTracks[press.x];
      gridPage.grid.levelSet(
        press.x, press.y,
        (gridPage.grid.sequencer.mutatingTracks[press.x] == 1 ? 10 : 0)
      );
      gridPage.refresh();
    }
  }


  toggleMutationAlgorithm(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    if (gridPage.editingMutationParameters) {
      const offset = 6;
      gridPage.grid.sequencer.mutations[press.x - offset].active = 1 - gridPage.grid.sequencer.mutations[press.x - offset].active;

      gridPage.refresh();
    }
  }


  setGridMutationDisplay() {
    // Light up the particpating tracks
    for (let i = 0; i < this.grid.sequencer.mutatingTracks.length; i++)
      this.grid.levelSet(i, 0, this.grid.sequencer.mutatingTracks[i] == 1 ? 10 : 0);

    // Ligth up the active mutations
    const offset = 6;
    for (let i = 0; i < this.grid.sequencer.mutations.length; i++)
      this.grid.levelSet(offset + i, 0, this.grid.sequencer.mutations[i].active == 1 ? 10 : 0);
  }


  setUiMutations() {
    this.grid.sequencer.gui.webContents.send(
      "update-mutations",
      this.grid.sequencer.mutatingTracks.reduce((activeTracks, track, tIdx) => {
        if (track == 1) activeTracks.push(this.grid.sequencer.tracks[tIdx].name);
        return activeTracks;
      }, []).join(" "),
      this.grid.sequencer.mutations.filter(m => m.active == 1).map(m => m.name).join(" ")
    );
  }
}

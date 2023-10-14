import { GridPage, GridConfig, GridKeyPress, ACTIVE_BRIGHTNESS, INACTIVE_BRIGHTNESS } from "./grid_page";
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
    this.functionMap.set("toggleVoiceRandomizer", this.toggleVoiceRandomizer);

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
  }


  setGridRamdonizingTracksDisplay() {
    const row = this.gridRandomizingTracksRow();
    this.grid.levelRow(0, 0, row);
  }


  setGridIndependentMutatingTracksDisplay() {
    const row = this.gridIndependentMutatingTracksRow();
    this.grid.levelRow(0, 1, row);
  }


  setGridSoloistMutatingTracksDisplay() {
    const row = this.gridSoloistMutatingTracksRow();
    this.grid.levelRow(0, 2, row);
  }


  setGridActiveMutationsRow() {
    const row = this.gridActiveMutationsRow();
    this.grid.levelRow(0, 7, row);
  }


  queueMutationStart(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    // Both the individual tracks AND the sequencer must set mutating=true to avoid an evolutionary cycle
    // starting before mutation melodies are in place since mutation cycles happen at the start of each
    // super measure.
    gridPage.grid.sequencer.daw.tracks.forEach((track) => {
      // All tracks should have their current mutation sources reset in case they show up to the mutation party late.
      track.currentMutation = track.outputNotes.flat();
      if (track.mutating || track.randomizing) {
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
    gridPage.grid.sequencer.daw.tracks.forEach(t => {
      t.mutating    = false;
      t.randomizing = false;
    });
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
    const track = gridPage.grid.sequencer.daw.tracks[press.x];

    // When in voice trading mode, the lead improvisor should not be removed from the soloists list and taken out
    // of mutating state.
    if (gridPage.grid.sequencer.daw.soloists[0] != track.dawIndex) {
      track.mutating = !track.mutating;
    }

    // When in voice trading mode and not the lead improvisor...
    if (gridPage.grid.sequencer.daw.soloists.length > 0 && gridPage.grid.sequencer.daw.soloists[0] != track.dawIndex) {
      // Was the pressed track index just set to mutating?
      if (track.mutating) {
        gridPage.grid.sequencer.daw.soloists.push(track.dawIndex);
      } else {
        // If the pressed track index is not mutating, remove it from the soloists list.
        const index = gridPage.grid.sequencer.daw.soloists.indexOf(track.dawIndex);
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
      gridPage.grid.sequencer.daw.mutating = false;
      gridPage.grid.sequencer.daw.soloists = new Array();
      gridPage.grid.sequencer.daw.tracks.forEach(t => t.mutating = false);
    } else {
      // There are no current soloists, add the active track as the current soloist and reset all other tracks

      // Reset the mutation state of all tracks
      gridPage.grid.sequencer.daw.tracks.forEach(t => t.mutating = false);

      // Set the current track to the lead soloist and make sure it is not randomizing.
      const track       = gridPage.grid.sequencer.daw.getActiveTrack();
      track.mutating    = true;
      track.randomizing = false;

      gridPage.grid.sequencer.daw.soloists.push(track.dawIndex);
      gridPage.grid.sequencer.daw.currentSoloistMelody = track.outputNotes.flat();
      gridPage.grid.sequencer.daw.soloistIndex = -1;
    }
    gridPage.refresh();
  }


  toggleVoiceRandomizer(gridPage: MelodyEvolutionPage, press: GridKeyPress) {
    const track       = gridPage.grid.sequencer.daw.getActiveTrack();
    track.randomizing = !track.randomizing; // Flip the current track's randomizing state.
    track.mutating    = !track.randomizing; // Be sure to set the mutation state mutually exclusive to randomizing

    // Remove the current track from the soloists list if it was put there.
    gridPage.grid.sequencer.daw.soloists = gridPage.grid.sequencer.daw.soloists.filter(s => s != track.dawIndex);

    gridPage.refresh();
  }


  #setGridMutationDisplay() {
    // Light up the particpating tracks
    this.#displayParticipatingTracks();

    // Ligth up the active mutations
    const offset = 6;
    for (let i = 0; i < this.grid.sequencer.daw.mutations.length; i++)
      this.grid.levelSet(offset + i, 0, this.grid.sequencer.daw.mutations[i].active == 1 ? 10 : 0);

    // Light up the voice trading/soloists state
    this.grid.levelSet(15, 2, this.grid.sequencer.daw.soloists.length > 0 ? 10 : 0);

    // Ligth up the randomizing state for the current track.
    this.grid.levelSet(15, 3, this.grid.sequencer.daw.getActiveTrack().randomizing ? 10 : 0);
  }


  #displayParticipatingTracks() {
    const activeTrack = this.grid.sequencer.daw.getActiveTrack();

    // Reset all participating tracks to start from a clean state
    for (let i = 0; i < this.grid.sequencer.daw.tracks.length; i++)
      this.grid.levelSet(i, 0, 0);

    if (activeTrack.randomizing) {
      // If the active track is randomzing, light it up only and no other tracks. Reset all, light up active
      this.grid.levelSet(activeTrack.dawIndex - 1, 0, 10);

    } else if (this.grid.sequencer.daw.soloists.length > 0) {

      // If the active track is the lead soloist, light it up bright and the other soloists, dimmer
      for (let i = 0; i < this.grid.sequencer.daw.soloists.length; i++) {
        const soloistIndex = this.grid.sequencer.daw.soloists[i] - 1;
        this.grid.levelSet(soloistIndex, 0, i == 0 ? 12 : 4);
      }

    } else {

      // Otherwise just display all the tracks that are mutating with the dim amount
      for (let i = 0; i < this.grid.sequencer.daw.tracks.length; i++) {
        this.grid.levelSet(i, 0, this.grid.sequencer.daw.tracks[i].mutating ? 4 : 0);
      }
    }
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


  gridIndependentMutatingTracksRow() {
    return this.grid.sequencer.daw.tracks.map(t => {
      return t.mutating && !this.grid.sequencer.daw.soloists.includes(t.dawIndex) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    });
  }


  gridSoloistMutatingTracksRow() {
    return this.grid.sequencer.daw.tracks.map(t => {
      return t.mutating && this.grid.sequencer.daw.soloists.includes(t.dawIndex) ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS;
    });
  }


  gridActiveMutationsRow() {
    return this.grid.sequencer.daw.mutations.map(m => m.active ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
  }
}

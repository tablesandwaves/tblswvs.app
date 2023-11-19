import { note } from "tblswvs";
import { GridConfig, GridKeyPress, ApplicationController, octaveTransposeMapping } from "./application_controller";
import { MonomeGrid } from "../model/monome_grid";
import { detect } from "@tonaljs/chord-detect";

export class ChordController extends ApplicationController {
  type = "Chords";

  recordingInputChord     = false;
  keyReleaseFunctionality = true;
  keyPressCount           = 0;
  chordNotes: note[]      = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addChordNote",             this.addChordNote);
    this.functionMap.set("removeLastChord",          this.removeLastChord);
    this.functionMap.set("toggleNewClipCreation",    this.toggleNewClipCreation);
    this.functionMap.set("setTrackChordProgression", this.setTrackChordProgression);
    this.functionMap.set("toggleChordRecording",     this.toggleChordRecording);
  }


  refresh() {
    const activeTrack = this.grid.sequencer.daw.getActiveTrack();
    this.grid.levelSet(15, 2, (activeTrack.createNewClip ? 10 : 0));
  }


  addChordNote(gridPage: ChordController, press: GridKeyPress) {
    if (gridPage.recordingInputChord) {
      if (press.s == 0) {
        gridPage.keyPressCount--;

        let octaveTranspose = octaveTransposeMapping[press.y];
        gridPage.chordNotes.push({ ...gridPage.grid.sequencer.key.degree(press.x + 1, octaveTranspose) });

        if (gridPage.keyPressCount == 0) {
          gridPage.grid.sequencer.queuedChordProgression.push(gridPage.chordNotes.sort((a,b) => a.midi - b.midi));
          gridPage.chordNotes = new Array();
          gridPage.setUiQueuedChordProgression();
        }
      } else {
        gridPage.keyPressCount++;
      }
    }
  }


  removeLastChord(gridPage: ChordController, press: GridKeyPress) {
    if (gridPage.recordingInputChord && press.s == 1) {
      gridPage.grid.sequencer.queuedChordProgression.pop();
      gridPage.setUiQueuedChordProgression();
    }
  }


  setTrackChordProgression(gridPage: ChordController, press: GridKeyPress) {
    if (press.s == 1 && gridPage.grid.sequencer.queuedChordProgression.length > 0) {
      gridPage.grid.sequencer.daw.getActiveTrack().notesAreMelody = false;
      gridPage.grid.sequencer.daw.getActiveTrack().setChordProgression(gridPage.grid.sequencer.queuedChordProgression);
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.grid.sequencer.daw.getActiveTrack().updateGuiTrackNotes();
    }
  }


  toggleChordRecording(gridPage: ChordController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.recordingInputChord = !gridPage.recordingInputChord;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.recordingInputChord ? 10 : 0));
      if (gridPage.recordingInputChord) {
        gridPage.grid.sequencer.queuedChordProgression = new Array();
        gridPage.setUiQueuedChordProgression();
      }
    }
  }


  setUiQueuedChordProgression() {
    this.grid.sequencer.gui.webContents.send(
      "update-progression",
      this.grid.sequencer.queuedChordProgression.flatMap((chordNotes: note[]) => {
        let chord = chordNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(chordNotes.map(n => n.note))[0];
        chord += namedChord == undefined ? "" : " (" + namedChord + ")";
        return chord;
      }).join("; ")
    );
  }
}

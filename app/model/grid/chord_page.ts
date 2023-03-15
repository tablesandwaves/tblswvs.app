import { note } from "tblswvs";
import { GridConfig, GridKeyPress, GridPage, octaveTransposeMapping } from "./grid_page";
import { MonomeGrid } from "./monome_grid";
import { detect } from "@tonaljs/chord-detect";

export class ChordPage extends GridPage {
  type = "Chord";
  recordingInputChord: boolean = false;
  keyPressCount: number = 0;
  chordNotes: note[] = new Array();
  keyReleaseFunctionality: boolean = true;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("addChordNote",             this.addChordNote);
    this.functionMap.set("removeLastChord",          this.removeLastChord);
    this.functionMap.set("toggleNewClipCreation",    this.toggleNewClipCreation);
    this.functionMap.set("setTrackChordProgression", this.setTrackChordProgression);
    this.functionMap.set("toggleChordRecording",     this.toggleChordRecording);

    this.grid.clearGridDisplay();
    this.setUiTrackChordProgression();
  }


  addChordNote(gridPage: ChordPage, press: GridKeyPress) {
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


  removeLastChord(gridPage: ChordPage, press: GridKeyPress) {
    if (gridPage.recordingInputChord && press.s == 1) {
      gridPage.grid.sequencer.queuedChordProgression.pop();
      gridPage.setUiQueuedChordProgression();
    }
  }


  setTrackChordProgression(gridPage: ChordPage) {
    gridPage.grid.sequencer.getActiveTrack().outputNotes = gridPage.grid.sequencer.queuedChordProgression;
    gridPage.grid.sequencer.refreshAbleton(gridPage.createNewClip);
    gridPage.setUiTrackChordProgression();
  }


  toggleChordRecording(gridPage: ChordPage, press: GridKeyPress) {
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
      this.grid.sequencer.queuedChordProgression.flatMap(chordNotes => {
        let chord = chordNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(chordNotes.map(n => n.note))[0];
        chord += namedChord == undefined ? "" : " (" + namedChord + ")";
        return chord;
      }).join("; ")
    );
  }


  setUiTrackChordProgression() {
    this.grid.sequencer.gui.webContents.send(
      "update-track-notes",
      this.grid.sequencer.queuedChordProgression.flatMap(chordNotes => {
        let chord = chordNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(chordNotes.map(n => n.note))[0];
        chord += namedChord == undefined ? "" : " (" + namedChord + ")";
        return chord;
      }).join("; ")
    );
  }
}

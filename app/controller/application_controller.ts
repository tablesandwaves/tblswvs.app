import { MonomeGrid } from "../model/monome_grid";
import { blank8x1Row } from "../helpers/utils";
import { defaultVelocities, RhythmStep } from "../model/ableton/track";
import { noteLengthMap, pulseRateMap, fillLengthMap } from "../model/ableton/note";
import { detect } from "@tonaljs/chord-detect";
import { note } from "tblswvs";


export type xyCoordinate = {
  x: number,
  y: number,
}


export type GridKeyPress = {
  x: number,
  y: number,
  s: number
}


export type GridConfig = {
  name: string,
  rows: any[],
  matrices?: any[]
}


export type GridButton = {
  mapping: string,
  shiftMapping?: string,
  // type: string,
  // group?: string,
  value?: any,
  shiftValue?: any
}


export const ACTIVE_BRIGHTNESS    = 10;
export const INACTIVE_BRIGHTNESS  = 0;
export const HIGHLIGHT_BRIGHTNESS = 15;

export class ApplicationController {
  type = "Generic";
  grid: MonomeGrid;
  matrix: GridButton[][] = new Array(8);
  functionMap: Map<string, Function> = new Map();
  // Overridden on pages where events happen when pressed.
  keyReleaseFunctionality: boolean = true;
  keyPressCount                    = 0;
  activeGates: GridKeyPress[]      = new Array();


  constructor(config: GridConfig, grid: MonomeGrid) {
    this.grid = grid;

    for (let i = 0; i < this.matrix.length; i++)
      this.matrix[i] = new Array(16);

    if (config.rows) {
      config.rows.forEach((row) => {
        for (let i = row.xStart; i < row.xStart + row.xLength; i++) {
          let entry: GridButton = this.matrix[row.index][i] ?
                                  this.matrix[row.index][i] :
                                  {mapping: undefined, shiftMapping: undefined};

          entry.mapping      = row.mapping      ? row.mapping      : entry.mapping;
          entry.shiftMapping = row.shiftMapping ? row.shiftMapping : entry.shiftMapping;
          entry.value        = row.value        ? row.value        : entry.value;
          entry.shiftValue   = row.shiftValue   ? row.shiftValue   : entry.shiftValue;

          if (row.values)      entry.value      = row.values[i - row.xStart];
          if (row.value)       entry.value      = row.value;
          if (row.shiftValues) entry.shiftValue = row.shiftValues[i - row.xStart];
          if (row.shiftValue)  entry.shiftValue = row.shiftValue;

          this.matrix[row.index][i] = entry;
        }
      });
    }

    if (config.matrices) {
      config.matrices.forEach((matrix) => {
        for (let y = matrix.rowStart; y <= matrix.rowEnd; y++) {
          for (let x = matrix.columnStart; x <= matrix.columnEnd; x++) {
            let entry: GridButton = this.matrix[y][x] ?
                                    this.matrix[y][x] :
                                    {mapping: undefined, shiftMapping: undefined};

            entry.mapping      = matrix.mapping      ? matrix.mapping      : entry.mapping;
            entry.shiftMapping = matrix.shiftMapping ? matrix.shiftMapping : entry.shiftMapping;
            entry.value        = matrix.value        ? matrix.value        : entry.value;
            entry.shiftValue   = matrix.shiftValue   ? matrix.shiftValue   : entry.shiftValue;

            if (matrix.columnValues)      entry.value      = matrix.columnValues[y - matrix.rowStart];
            if (matrix.shiftColumnValues) entry.shiftValue = matrix.shiftColumnValues[y - matrix.rowStart];
            if (matrix.rowValues)         entry.value      = matrix.rowValues[y - matrix.rowStart][x - matrix.columnStart];
            if (matrix.rowShiftValues)    entry.shiftValue = matrix.rowShiftValues[y - matrix.rowStart][x - matrix.columnStart];

            this.matrix[y][x] = entry;
          }
        }
      });
    }

    this.functionMap.set("updateRhythm", this.updateRhythm);
    this.functionMap.set("updateStepLength", this.updateStepLength);
    this.functionMap.set("ignoredIndicator", this.ignoredIndicator);
  }


  get activeTrack() {
    return this.grid.sequencer.daw.getActiveTrack();
  }


  // Should be overridden by any subclasses extending GridPage
  refresh(): void {}


  // Catch shift key held state for subclasses that do not care (e.g., not dynamics controller)
  holdShiftKey(): void {}
  releaseShiftKey(): void {}


  // Blank method to catch buttons that light up but provide no user interaction
  ignoredIndicator(): void {}


  // May be overridden by any subclasses extending GridPage
  keyPress(press: GridKeyPress) {
    if ((press.s == 0 && !this.keyReleaseFunctionality) || this.matrix[press.y][press.x] == undefined)
      return;

    if (this.grid.shiftStateActive && this.matrix[press.y][press.x].shiftMapping != undefined) {
      this.functionMap.get(this.matrix[press.y][press.x].shiftMapping)(this, press);
    } else {
      // console.log(this.matrix[press.y][press.x].mapping)
      this.functionMap.get(this.matrix[press.y][press.x].mapping)(this, press);
    }
  }


  toggleNewClipCreation(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.createNewClip = !gridPage.activeTrack.createNewClip;
      gridPage.grid.levelSet(press.x, press.y, (gridPage.activeTrack.createNewClip ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS));
      gridPage.activeTrack.updateGuiCreateNewClip();
    }
  }


  setGridRhythmDisplay(highlightIndex?: number) {
    // Transport rows 1 (steps 1-16) and 2 (steps 17-32)
    const transportRow = this.grid.shiftStateActive ? this.getRhythmStepLengthRow() : this.getRhythmGatesRow();
    if (highlightIndex != undefined) transportRow[highlightIndex] = HIGHLIGHT_BRIGHTNESS;
    this.grid.levelRow(0, 0, transportRow.slice(0, 8));
    this.grid.levelRow(8, 0, transportRow.slice(8, 16));
    this.grid.levelRow(0, 1, transportRow.slice(16, 24));
    this.grid.levelRow(8, 1, transportRow.slice(24, 32));

    // Shared parameter rows
    this.setGridFillParametersDisplay();
    this.toggleRadioButton(8, 4, pulseRateMap[this.activeTrack.pulseRate].index);
    this.updateGridRowMeter(8, 5, noteLengthMap[this.activeTrack.noteLength].index);
    this.updateGridRowMeter(8, 6, (this.activeTrack.defaultProbability / 0.125) - 1);
  }


  getRhythmStepLengthRow() {
    if (this.activeTrack.rhythmStepBreakpoint == this.activeTrack.rhythmStepLength) {
      return [
        ...new Array(this.activeTrack.rhythmStepLength).fill(5),
        ...new Array(32 - this.activeTrack.rhythmStepLength).fill(INACTIVE_BRIGHTNESS)
      ];
    } else {
      const firstRowActiveStepCount  = this.activeTrack.rhythmStepBreakpoint >= 16 ? 16 : this.activeTrack.rhythmStepBreakpoint;
      const secondRowActiveStepCount = this.activeTrack.rhythmStepLength - firstRowActiveStepCount;
      return [
        ...new Array(firstRowActiveStepCount).fill(5),
        ...new Array(16 - firstRowActiveStepCount).fill(INACTIVE_BRIGHTNESS),
        ...new Array(secondRowActiveStepCount).fill(5),
        ...new Array(16 - secondRowActiveStepCount).fill(INACTIVE_BRIGHTNESS)
      ];
    }
  }


  /**
   * Generate two rows of grid display data for rhythm gates.
   *
   * The resulting row will be based on the rhythm step length and the break point.
   *
   * @returns (Array) of 32 grid row brighness numbers for displaying the on/off rhythm gates
   */
  getRhythmGatesRow() {
    if (this.activeTrack.rhythmStepBreakpoint == this.activeTrack.rhythmStepLength) {
      return [
        ...this.activeTrack.rhythm.slice(0, this.activeTrack.rhythmStepLength).map((rhythmStep: RhythmStep) => {
          return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * ACTIVE_BRIGHTNESS) : INACTIVE_BRIGHTNESS;
        }),
        ...new Array(32 - this.activeTrack.rhythmStepLength).fill(INACTIVE_BRIGHTNESS)
      ];
    } else {
      const firstRowActiveStepCount  = this.activeTrack.rhythmStepBreakpoint >= 16 ? 16 : this.activeTrack.rhythmStepBreakpoint;
      const secondRowActiveStepCount = this.activeTrack.rhythmStepLength - firstRowActiveStepCount;
      return [
        ...this.activeTrack.rhythm.slice(0, firstRowActiveStepCount).map((rhythmStep: RhythmStep) => {
          return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * ACTIVE_BRIGHTNESS) : INACTIVE_BRIGHTNESS;
        }),
        ...new Array(16 - firstRowActiveStepCount).fill(INACTIVE_BRIGHTNESS),
        ...this.activeTrack.rhythm.slice(this.activeTrack.rhythmStepBreakpoint, this.activeTrack.rhythmStepLength).map((rhythmStep: RhythmStep) => {
          return rhythmStep.state == 1 ? Math.round(rhythmStep.probability * ACTIVE_BRIGHTNESS) : INACTIVE_BRIGHTNESS;
        }),
        ...new Array(16 - secondRowActiveStepCount).fill(INACTIVE_BRIGHTNESS)
      ];
    }
  }


  updateRhythm(gridPage: ApplicationController, press: GridKeyPress) {
    // As they are pressed, add gates to the active gates array for storing until the last key press is released.
    if (press.s == 1) {
      gridPage.keyPressCount++;

      if (press.y == 0) {
        if (press.x < gridPage.activeTrack.rhythmStepBreakpoint)
          gridPage.activeGates.push(press);
      } else {
        if (gridPage.activeTrack.rhythmStepBreakpoint < gridPage.activeTrack.rhythmStepLength) {
          if (press.x < gridPage.activeTrack.rhythmStepLength - gridPage.activeTrack.rhythmStepBreakpoint)
            gridPage.activeGates.push(press);
        } else {
          if (press.x < 32 - gridPage.activeTrack.rhythmStepLength + 16)
            gridPage.activeGates.push(press);
        }
      }
    } else {
      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {
        // Active gates may be reset by a single gate note length in RhythmController.updateNoteLength
        if (gridPage.activeTrack.rhythmAlgorithm != "surround" && gridPage.activeGates.length > 0) {
          const updatedRhythm = gridPage.activeTrack.rhythm.map(step => {return {...step}});
          gridPage.activeGates.forEach(queuedKeyPress => {
            let stepIndex = queuedKeyPress.x + (16 * queuedKeyPress.y);
            if (gridPage.activeTrack.rhythmStepBreakpoint < 16 && queuedKeyPress.y == 1)
              stepIndex -= (16 - gridPage.activeTrack.rhythmStepBreakpoint);

            // Do not allow changes to the steps outside the track's rhythm step lengths.
            if (stepIndex >= gridPage.activeTrack.rhythmStepLength) return;

            const stepState                      = 1 - gridPage.activeTrack.rhythm[stepIndex].state;
            updatedRhythm[stepIndex].state       = stepState;
            updatedRhythm[stepIndex].probability = gridPage.activeTrack.defaultProbability;
            if (stepState == 0) {
              updatedRhythm[stepIndex].fillRepeats = 0;
              updatedRhythm[stepIndex].noteLength  = undefined;
            }
          });
          gridPage.activeTrack.rhythm = updatedRhythm;
          gridPage.activeGates = new Array();

          gridPage.grid.sequencer.daw.updateActiveTrackNotes();

          gridPage.setGridRhythmDisplay();
          gridPage.updateGuiRhythmDisplay();

          if (gridPage.rhythmIsBlank()) {
            gridPage.activeTrack.fillMeasures = [0, 0, 0, 0, 0, 0, 0, 0];
            gridPage.activeTrack.fillDuration = "8nd";
          }
        }
      }
    }
  }


  getNoteLengthRow() {
    let selectedIndex;
    if (this.activeGates.length > 0) {
      const lastGateKeyPress = this.activeGates.at(-1);
      const stepIndex        = lastGateKeyPress.x + (16 * lastGateKeyPress.y);
      const noteLength       = this.activeTrack.rhythm[stepIndex].noteLength ?
                               this.activeTrack.rhythm[stepIndex].noteLength :
                               this.activeTrack.noteLength;

      selectedIndex = noteLengthMap[noteLength].index;
    } else {
      selectedIndex = noteLengthMap[this.activeTrack.noteLength].index;
    }
    let row = blank8x1Row.slice();
    for (let i = 0; i <= selectedIndex; i++) row[i] = ACTIVE_BRIGHTNESS;
    return row;
  }


  updateStepLength(gridPage: ApplicationController, press: GridKeyPress, updateDrumPadMelody = false) {
    if (press.s == 1) {
      gridPage.keyPressCount++;
      gridPage.activeGates.push(press);
    } else {
      gridPage.keyPressCount--;

      if (gridPage.keyPressCount == 0) {
        const firstRowIndex  = gridPage.activeGates.filter(press => press.y == 0).map(press => press.x).sort().at(-1);
        const secondRowIndex = gridPage.activeGates.filter(press => press.y == 1).map(press => press.x).sort().at(-1);

        if (firstRowIndex != undefined && secondRowIndex != undefined) {
          gridPage.activeTrack.rhythmStepLength = firstRowIndex + 1 + secondRowIndex + 1;
          gridPage.activeTrack.rhythmStepBreakpoint = firstRowIndex + 1;
        } else if (secondRowIndex == undefined) {
          gridPage.activeTrack.rhythmStepLength = firstRowIndex + 1;
          gridPage.activeTrack.rhythmStepBreakpoint = gridPage.activeTrack.rhythmStepLength;
        } else if (firstRowIndex == undefined) {
          gridPage.activeTrack.rhythmStepLength = secondRowIndex + 16 + 1;
          gridPage.activeTrack.rhythmStepBreakpoint = gridPage.activeTrack.rhythmStepLength;
        }
        gridPage.activeGates = new Array();

        if (updateDrumPadMelody) gridPage.activeTrack.updateDrumPadInputMelody();
        gridPage.grid.sequencer.daw.updateActiveTrackNotes();
        gridPage.setGridRhythmDisplay();
        gridPage.updateGuiRhythmDisplay();
      }
    }
  }


  toggleFillMeasure(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      const currentState = gridPage.activeTrack.fillMeasures[press.x];
      gridPage.activeTrack.fillMeasures[press.x] = currentState == 0 ? 1 : 0;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridFillParametersDisplay();
      gridPage.activeTrack.updateGuiFillMeasures();
    }
  }


  setFillDuration(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.fillDuration = gridPage.matrix[press.y][press.x].value;
      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      gridPage.setGridFillParametersDisplay();
      gridPage.activeTrack.updateGuiFillsDuration();
    }
  }


  setGridFillParametersDisplay() {
    // Set the measures on which the fills should play
    const row = this.activeTrack.fillMeasures.map((m: number) => m == 1 ? ACTIVE_BRIGHTNESS : INACTIVE_BRIGHTNESS);
    this.grid.levelRow(0, 2, row);

    // Set the fill duration meter buttons
    this.updateGridRowMeter(8, 2, fillLengthMap[this.grid.sequencer.daw.getActiveTrack().fillDuration].index);
  }


  updateDefaultProbability(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.defaultProbability = gridPage.matrix[press.y][press.x].value;
      gridPage.updateGridRowMeter(8, 6, (gridPage.activeTrack.defaultProbability / 0.125) - 1);
    }
  }


  updateNoteLength(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.noteLength = gridPage.matrix[press.y][press.x].value;
      gridPage.updateGridRowMeter(8, 5, noteLengthMap[gridPage.activeTrack.noteLength].index);
      gridPage.activeTrack.updateGuiNoteLength();

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
      if (!gridPage.grid.sequencer.testing) gridPage.activeTrack.updateGuiNoteLength();
    }
  }


  updatePulse(gridPage: ApplicationController, press: GridKeyPress) {
    if (press.s == 1) {
      gridPage.activeTrack.pulseRate = gridPage.matrix[press.y][press.x].value;
      gridPage.toggleRadioButton(8, 4, pulseRateMap[gridPage.activeTrack.pulseRate].index);
      gridPage.activeTrack.updateGuiPulseRate();

      gridPage.grid.sequencer.daw.updateActiveTrackNotes();
    }
  }


  rhythmIsBlank() {
    return this.activeTrack.rhythm.reduce((total, step) => {
      return total + step.state;
    }, 0) == 0;
  }


  // Overridden on the RhythmPage and RampSequencePage where the grid's transport row also needs to be updated.
  displayRhythmWithTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    this.updateGuiRhythmTransport(highlightIndex, pianoRollHighlightIndex);
  }


  updateGuiRhythmDisplay() {
    if (this.grid.sequencer.testing) return;
    this.activeTrack.updateGuiTrackRhythm();
  }


  updateGuiRhythmTransport(highlightIndex: number, pianoRollHighlightIndex: number) {
    if (this.grid.sequencer.testing || !this.grid.sequencer.gui.webContents) return;

    this.grid.sequencer.gui.webContents.send("transport", highlightIndex, pianoRollHighlightIndex);
  }


  setUiQueuedInputNotes() {
    if (this.grid.sequencer.testing) return;

    this.grid.sequencer.gui.webContents.send(
      "update-queued-notes",
      this.grid.sequencer.queuedNotes.flatMap((queuedNotes: note[]) => {
        let notes = queuedNotes.map(n => n.note + n.octave).join("-");
        let namedChord = detect(queuedNotes.map(n => n.note))[0];
        notes += namedChord == undefined ? "" : " (" + namedChord + ")";
        return notes;
      }).join("; ")
    );
  }


  toggleRadioButton(startIndex: number, rowIndex: number, selectedIndex: number) {
    let row = blank8x1Row.slice();
    row[selectedIndex] = ACTIVE_BRIGHTNESS;
    this.grid.levelRow(startIndex, rowIndex, row);
  }


  updateGridRowMeter(startIndex: number, rowIndex: number, selectedIndex: number) {
    let row = blank8x1Row.slice();
    for (let i = 0; i <= selectedIndex; i++) row[i] = ACTIVE_BRIGHTNESS;
    this.grid.levelRow(startIndex, rowIndex, row);
  }


  // Call the sub-class's refresh function to update the grid's button matrix.
  toggleShiftState() {
    this.refresh();
  }
}

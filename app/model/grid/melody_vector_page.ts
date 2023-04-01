import { GridPage, GridConfig, GridKeyPress } from "./grid_page";
import { MonomeGrid } from "./monome_grid";


export class MelodyVectorPage extends GridPage {
  type = "Melody";
  vectorShifts: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  length: number = 8;


  constructor(config: GridConfig, grid: MonomeGrid) {
    super(config, grid);

    this.functionMap.set("setStepShift", this.setStepShift);
  }


  setStepShift(gridPage: MelodyVectorPage, press: GridKeyPress) {
    if (gridPage.grid.shiftKey && press.y == 0 && gridPage.vectorShifts[press.x] == -1) {
      gridPage.vectorShifts[press.x] = 0;
    } else if (!gridPage.grid.shiftKey && press.y == 6 && gridPage.vectorShifts[press.x] == 1) {
      gridPage.vectorShifts[press.x] = 0;
    } else {
      gridPage.vectorShifts[press.x] = gridPage.grid.shiftKey ?
                                       gridPage.matrix[press.y][press.x].shiftValue :
                                       gridPage.matrix[press.y][press.x].value;
    }

    gridPage.refresh();
  }


  refresh() {
    this.setGridShiftsDisplay();
  }


  setGridShiftsDisplay() {
    this.vectorShifts.forEach((shift, x) => {
      if (shift == 0) {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, 0);
      } else if (shift < 0) {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, (-1 - y >= shift ? 10 : 0));
      } else {
        for (let y = 0; y < 7; y++)
          this.grid.levelSet(x, y, (y >= 7 - shift ? 10 : 0));
      }
    });
  }
}

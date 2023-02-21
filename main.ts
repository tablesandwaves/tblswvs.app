import { app, BrowserWindow } from "electron";
import * as path from "path";
import { Sequencer } from "./app/model/sequencer";


const sequencer = new Sequencer();


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1580,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  sequencer.gui = mainWindow;
  mainWindow.loadFile("app/view/index.html");
  mainWindow.webContents.openDevTools()
};


app.whenReady().then(() => {
  sequencer.connectToGrid().then((msg) => {
    console.log(msg);
    sequencer.follow();

    // The grid needs a moment to be fully ready. Wait half a second, then simulate a key press
    // to set the grid to the track 1, rhythm page.
    setTimeout(() => {
      sequencer.grid.keyPress({x: 0, y: 7, s: 1});
      sequencer.grid.keyPress({x: 6, y: 7, s: 1});
    }, 500);
  });
}).then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

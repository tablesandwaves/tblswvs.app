import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { noteData } from "tblswvs";
import { BeatSet, Sequencer } from "./app/model/sequencer";


const configDirectory = process.env.NODE_ENV && process.env.NODE_ENV === "production" ? process.resourcesPath : path.join(__dirname, "config");
const sequencer       = new Sequencer(configDirectory);


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  sequencer.gui = mainWindow;
  mainWindow.loadFile("app/view/index.html");
  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    sequencer.grid.clearGridDisplay(8);
  });
};


app.whenReady().then(() => {
  sequencer.connectToGrid().then((msg) => {
    console.log(msg);

    // The grid and UI need a moment to be fully ready. Wait half a second, then simulate a key press
    // to set the grid to the track 1, rhythm page.
    setTimeout(() => {
      fs.readdir(sequencer.configDirectory, (err, files) => {
        files.forEach(filename => {
          if (filename.startsWith("grid_page_")) {
            const configuration = yaml.load(fs.readFileSync( path.resolve(sequencer.configDirectory, filename), "utf8" ));
            sequencer.gui.webContents.send("documentation-page", configuration);
          } else if (filename.startsWith("patterns_beats")) {
            const beatPatterns = yaml.load(fs.readFileSync( path.resolve(sequencer.configDirectory, filename), "utf8" ));
            sequencer.setBeatPatterns(beatPatterns as BeatSet);
          }
        });
      });

      sequencer.gui.webContents.send("note-data", noteData);
      sequencer.grid.keyPress({x: 0, y: 7, s: 1});
      sequencer.grid.keyPress({x: 7, y: 7, s: 1});
    }, 1000);
  });
}).then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

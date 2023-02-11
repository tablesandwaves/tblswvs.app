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
  sequencer.connectToGrid().then((msg) => console.log(msg));
}).then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).then(() => {
  sequencer.follow();
});

const { app, BrowserWindow, } = require("electron");
const path = require("path");
const { Sequencer } = require("./app/model/sequencer");


const sequencer = new Sequencer();


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  sequencer.gui = mainWindow;
  mainWindow.loadFile("app/view/index.html");
};


app.whenReady().then(() => {
  sequencer.connectToGrid("m31931181").then((msg) => console.log(msg));
}).then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).then(() => {
  sequencer.follow();
});

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { MonomeGrid } = require("./app/model/monome_grid");


const grid = new MonomeGrid("m31931181");


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  grid.gui = mainWindow;
  mainWindow.loadFile("app/view/index.html");
};


app.whenReady().then(() => {

  grid.connectToGrid()
    .then((msg) => console.log(msg))
    .then(() => grid.displayRhythm());

}).then(() => {

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

});

const { app, BrowserWindow } = require("electron");
const path = require("path");


const createWindow = () => {
  const win = new BrowserWindow({
    width: 980,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });


  win.loadFile("app/view/index.html");
};


app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

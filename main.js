const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");


const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  ipcMain.handle("step", handleStep);
  win.loadFile("app/view/index.html");
};


app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


const handleStep = async (e, args) => {
  console.log(`Handling step ${args[0]} with state ${args[1]}`);
};

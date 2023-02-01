const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  toggleStep: (callback) => ipcRenderer.on("track-rhythm-step", callback),
})

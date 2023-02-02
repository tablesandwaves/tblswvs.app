const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  activateTrack: (callback) => ipcRenderer.on("track-activate", callback)
})

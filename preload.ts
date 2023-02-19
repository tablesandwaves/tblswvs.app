const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  activateTrack: (callback: any) => ipcRenderer.on("track-activate", callback)
});


contextBridge.exposeInMainWorld("parameters", {
  updateScale: (callback: any) => ipcRenderer.on("set-scale", callback),
  updateQueuedMelody: (callback: any) => ipcRenderer.on("update-melody", callback),
  updateTrackMelody: (callback: any) => ipcRenderer.on("update-track-melody", callback)
});

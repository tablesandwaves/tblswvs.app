const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  transport: (callback: any) => ipcRenderer.on("transport", callback)
});


contextBridge.exposeInMainWorld("parameters", {
  activateTrack: (callback: any) => ipcRenderer.on("track-activate", callback),
  updateScale: (callback: any) => ipcRenderer.on("set-scale", callback),
  updateQueuedMelody: (callback: any) => ipcRenderer.on("update-melody", callback),
  updateTrackMelody: (callback: any) => ipcRenderer.on("update-track-melody", callback)
});

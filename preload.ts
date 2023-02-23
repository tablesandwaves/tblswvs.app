const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  transport: (callback: any) => ipcRenderer.on("transport", callback),
  transportBeat: (callback: any) => ipcRenderer.on("transport-beat", callback)
});


contextBridge.exposeInMainWorld("parameters", {
  activateTrack: (callback: any) => ipcRenderer.on("track-activate", callback),
  updateScale: (callback: any) => ipcRenderer.on("set-scale", callback),
  updateSuperMeasure: (callback: any) => ipcRenderer.on("update-super-measure", callback),
  updateQueuedMelody: (callback: any) => ipcRenderer.on("update-melody", callback),
  updateTrackMelody: (callback: any) => ipcRenderer.on("update-track-melody", callback),
  toggleCreateClip: (callback: any) => ipcRenderer.on("toggle-create-clip", callback)
});

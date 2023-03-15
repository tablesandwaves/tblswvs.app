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
  updateQueuedProgression: (callback: any) => ipcRenderer.on("update-progression", callback),
  updateTrackNotes: (callback: any) => ipcRenderer.on("update-track-notes", callback),
  updateTrackRhythm: (callback: any) => ipcRenderer.on("update-track-rhythm", callback),
  updateNoteLength: (callback: any) => ipcRenderer.on("update-note-length", callback),
  toggleCreateClip: (callback: any) => ipcRenderer.on("toggle-create-clip", callback)
});

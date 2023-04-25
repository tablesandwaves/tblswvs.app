const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  transport: (callback: any) => ipcRenderer.on("transport", callback),
  transportBeat: (callback: any) => ipcRenderer.on("transport-beat", callback)
});


contextBridge.exposeInMainWorld("parameters", {
  activateTrackNav: (callback: any) => ipcRenderer.on("track-nav", callback),
  setRhythmDisplay: (callback: any) => ipcRenderer.on("track-rhythm", callback),
  updateScale: (callback: any) => ipcRenderer.on("set-scale", callback),
  updateSuperMeasure: (callback: any) => ipcRenderer.on("update-super-measure", callback),
  updateQueuedMelody: (callback: any) => ipcRenderer.on("update-melody", callback),
  updateQueuedProgression: (callback: any) => ipcRenderer.on("update-progression", callback),
  updateTrackNotes: (callback: any) => ipcRenderer.on("update-track-notes", callback),
  updateNoteLength: (callback: any) => ipcRenderer.on("update-note-length", callback),
  updateFillsDuration: (callback: any) => ipcRenderer.on("update-fills-duration", callback),
  updateFillMeasures: (callback: any) => ipcRenderer.on("update-fill-measures", callback),
  toggleCreateClip: (callback: any) => ipcRenderer.on("toggle-create-clip", callback),
  updateActiveClip: (callback: any) => ipcRenderer.on("update-active-clip", callback),
  updateMutations: (callback: any) => ipcRenderer.on("update-mutations", callback),
  updateMelodyVector: (callback: any) => ipcRenderer.on("update-melody-vector", callback)
});


contextBridge.exposeInMainWorld("documentation", {
  pageDocumentation: (callback: any) => ipcRenderer.on("documentation-page", callback)
});

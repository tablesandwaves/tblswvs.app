const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("stepSequencer", {
  transport: (callback: any) => ipcRenderer.on("transport", callback),
});


contextBridge.exposeInMainWorld("parameters", {
  activateTrackNav: (callback: any) => ipcRenderer.on("track-nav", callback),
  setRhythmDisplay: (callback: any) => ipcRenderer.on("track-rhythm", callback),
  updateScale: (callback: any) => ipcRenderer.on("set-scale", callback),
  updateBeat: (callback: any) => ipcRenderer.on("set-beat", callback),
  updateSuperMeasure: (callback: any) => ipcRenderer.on("update-super-measure", callback),
  updateQueuedNotes: (callback: any) => ipcRenderer.on("update-queued-notes", callback),
  updateTrackNotes: (callback: any) => ipcRenderer.on("update-track-notes", callback),
  updateNoteLength: (callback: any) => ipcRenderer.on("update-note-length", callback),
  updatePulseRate: (callback: any) => ipcRenderer.on("update-pulse-rate", callback),
  updateFillsDuration: (callback: any) => ipcRenderer.on("update-fills-duration", callback),
  updateFillMeasures: (callback: any) => ipcRenderer.on("update-fill-measures", callback),
  updateActiveClip: (callback: any) => ipcRenderer.on("update-active-clip", callback),
  updateMutations: (callback: any) => ipcRenderer.on("update-mutations", callback),
  updateTrackEvolution: (callback: any) => ipcRenderer.on("update-track-evolution", callback),
  updateNoteVector: (callback: any) => ipcRenderer.on("update-note-vector", callback),
  updateTrackChains: (callback: any) => ipcRenderer.on("update-track-chains", callback),
  updateRampSequence: (callback: any) => ipcRenderer.on("update-ramp-sequence", callback),
  setPianoRollNotes: (callback: any) => ipcRenderer.on("piano-roll-notes", callback),
  setDrumRackNotes: (callback: any) => ipcRenderer.on("drum-rack-notes", callback),
  setTimingAlgorithms: (callback: any) => ipcRenderer.on("timing-algorithms", callback),
  setMarkovy: (callback: any) => ipcRenderer.on("markovy", callback)
});


contextBridge.exposeInMainWorld("documentation", {
  pageDocumentation: (callback: any) => ipcRenderer.on("documentation-page", callback),
  setNoteData: (callback: any) => ipcRenderer.on("note-data", callback),
  displayResourcesPath: (callback: any) => ipcRenderer.on("resources-path", callback)
});

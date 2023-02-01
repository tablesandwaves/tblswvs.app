const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("sequencer", {
  // ping: () => ipcRenderer.invoke("ping")
  step: (...args) => ipcRenderer.invoke("step", args)
});


// contextBridge.exposeInIsolatedWorld()

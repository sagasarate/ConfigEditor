/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    OpenFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    SaveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
    ReadDir: (Path, options) => ipcRenderer.invoke('fs:readDir', Path, options),
    MakeDir: (Path, options) => ipcRenderer.invoke('fs:makeDir', Path, options),
    RemoveDir: (Path, options) => ipcRenderer.invoke('fs:removeDir', Path, options),
    ReadFile: (Path, options) => ipcRenderer.invoke('fs:readFile', Path, options),
    WriteFile: (Path, Data, options) => ipcRenderer.invoke('fs:writeFile', Path, Data, options),
    RemoveFile: (Path, options) => ipcRenderer.invoke('fs:removeFile', Path, options),
    RenameFile: (OldPath, NewPath) => ipcRenderer.invoke('fs:renameFile', OldPath, NewPath),
    FileState: (Path, options) => ipcRenderer.invoke('fs:fileState', Path, options),
});


window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

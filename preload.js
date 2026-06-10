const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadFxFloorBoardPatches: () => ipcRenderer.invoke('load-fxfloorboard-patches'),
    openLibraryWindow: () => ipcRenderer.send('open-library-window'),
    selectPatch: (patchData) => ipcRenderer.send('library-select-patch', patchData),
    onLoadPatchFromLibrary: (callback) => ipcRenderer.on('load-patch-from-library', (event, data) => callback(data)),
    onLibraryWindowClosed: (callback) => ipcRenderer.on('library-window-closed', () => callback()),
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close')
});

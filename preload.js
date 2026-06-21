const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadFxFloorBoardPatches: () => ipcRenderer.invoke('load-fxfloorboard-patches'),
    openLibraryWindow: () => ipcRenderer.send('open-library-window'),
    selectPatch: (patchData) => ipcRenderer.send('library-select-patch', patchData),
    onLoadPatchFromLibrary: (callback) => ipcRenderer.on('load-patch-from-library', (event, data) => callback(data)),
    onLibraryWindowClosed: (callback) => ipcRenderer.on('library-window-closed', () => callback()),
    openPlayerWindow: () => ipcRenderer.send('open-player-window'),
    sendPlayerAction: (type, data) => ipcRenderer.send('player-action', { type, data }),
    onPlayerAction: (callback) => ipcRenderer.on('player-action', (event, packet) => callback(packet)),
    onPlayerWindowClosed: (callback) => ipcRenderer.on('player-window-closed', () => callback()),
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    changeTheme: (theme) => ipcRenderer.send('theme-changed', theme),
    onThemeChanged: (callback) => ipcRenderer.on('apply-theme', (event, theme) => callback(theme))
});

contextBridge.exposeInMainWorld('stemAPI', {
    separate: (filePath) => ipcRenderer.invoke('stem:separate', filePath),
    cleanup: (tmpDir) => ipcRenderer.invoke('stem:cleanup', tmpDir),
    readBuffer: (filePath) => ipcRenderer.invoke('file:read-buffer', filePath),
    onProgress: (callback) => {
        ipcRenderer.on('stem:progress', (event, data) => callback(data));
    },
    listSeparated: () => ipcRenderer.invoke('library:list-separated'),
    getSeparatedDir: () => ipcRenderer.invoke('library:get-separated-dir'),
    saveSeparated: (name, tmpPaths, meta) => ipcRenderer.invoke('library:save-separated', { name, tmpPaths, meta }),
    deleteSeparated: (folderName) => ipcRenderer.invoke('library:delete-separated', folderName),
    saveDialog: (options) => ipcRenderer.invoke('file:save-dialog', options),
    writeBuffer: (filePath, buffer) => ipcRenderer.invoke('file:write-buffer', { filePath, buffer })
});

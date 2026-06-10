const { app, BrowserWindow, session, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

function decodeUtf16BE(buffer) {
    let str = '';
    for (let i = 0; i < buffer.length; i += 2) {
        if (i + 1 >= buffer.length) break;
        const charCode = (buffer[i] << 8) | buffer[i + 1];
        if (charCode === 0) break;
        if (charCode >= 32 && charCode <= 126) {
            str += String.fromCharCode(charCode);
        } else {
            break;
        }
    }
    return str.trim();
}

ipcMain.handle('load-fxfloorboard-patches', async () => {
    const allLibraries = [];

    // 1. Carregar patches do FxFloorBoard (.m2l)
    const dirPath = 'C:\\FxFloorBoard\\ME-25-Edit\\saved_patches';
    try {
        if (fs.existsSync(dirPath)) {
            const files = await fs.promises.readdir(dirPath);
            const m2lFiles = files.filter(f => f.endsWith('.m2l'));
            
            // Ler arquivos concorrentemente para evitar bloqueios de I/O síncronos
            const readPromises = m2lFiles.map(async (file) => {
                const filePath = path.join(dirPath, file);
                try {
                    const data = await fs.promises.readFile(filePath);
                    if (data.length < 36) return null;
                    
                    const header = data.slice(0, 20).toString('ascii');
                    if (!header.startsWith('ME2LibrarianFile')) return null;
                    
                    const numPatches = data.readUInt32BE(32);
                    const patches = [];
                    
                    let offset = 160;
                    for (let p = 0; p < numPatches; p++) {
                        if (offset + 4 > data.length) break;
                        const patchLen = data.readUInt32BE(offset);
                        offset += 4;
                        
                        if (offset + patchLen > data.length) break;
                        const patchData = data.slice(offset, offset + patchLen);
                        offset += patchLen;
                        
                        let name = '';
                        if (patchData.length >= 104) {
                            name = decodeUtf16BE(patchData.slice(104, 140));
                        }
                        
                        if (!name || name.length < 2) {
                            for (let i = 96; i < patchData.length - 1; i += 2) {
                                if (patchData[i] === 0x00 && patchData[i+1] >= 32 && patchData[i+1] <= 126) {
                                    const candidate = decodeUtf16BE(patchData.slice(i));
                                    if (candidate.length >= 3) {
                                        name = candidate;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        const appParams = Array(48).fill(0);
                        appParams[45] = 4;
                        
                        for (let i = 0; i < 44; i++) {
                            if (12 + (i + 4) * 2 + 1 < patchData.length) {
                                appParams[i] = patchData.readUInt16BE(12 + (i + 4) * 2);
                            }
                        }
                        
                        patches.push({
                            name: name || "Sem Nome",
                            params: appParams
                        });
                    }
                    
                    return {
                        fileName: file.replace('.m2l', ''),
                        isTSL: false,
                        patches
                    };
                } catch (err) {
                    console.error(`Error reading patch file ${file}:`, err);
                    return null;
                }
            });
            
            const results = await Promise.all(readPromises);
            results.forEach(res => {
                if (res) allLibraries.push(res);
            });
        }
    } catch (err) {
        console.error('Error loading FxFloorBoard patches:', err);
    }

    // 2. Carregar livesets do BOSS Tone Studio (.tsl)
    try {
        const tslDirPath = path.join(app.getPath('appData'), 'BOSS-TONE-STUDIO-for-ME-25', 'Local Store', 'livesets');
        if (fs.existsSync(tslDirPath)) {
            const files = await fs.promises.readdir(tslDirPath);
            const tslFiles = files.filter(f => f.endsWith('.tsl'));
            
            const readPromises = tslFiles.map(async (file) => {
                const filePath = path.join(tslDirPath, file);
                try {
                    const content = await fs.promises.readFile(filePath, 'utf8');
                    const json = JSON.parse(content);
                    const libName = (json.liveSetData && json.liveSetData.name) ? json.liveSetData.name : file.replace('.tsl', '');
                    
                    const patches = [];
                    if (Array.isArray(json.patchList)) {
                        json.patchList.forEach(p => {
                            const patchName = p.name ? p.name.trim() : "Sem Nome";
                            const appParams = Array(48).fill(0);
                            appParams[45] = 4;
                            
                            const data = p.params && p.params.paramData;
                            if (Array.isArray(data) && data.length >= 96) {
                                for (let i = 0; i < 48; i++) {
                                    const high = parseInt(data[i*2], 16) || 0;
                                    const low = parseInt(data[i*2+1], 16) || 0;
                                    appParams[i] = (high << 8) | low;
                                }
                            }
                            
                            patches.push({
                                name: patchName,
                                params: appParams
                            });
                        });
                    }
                    
                    return {
                        fileName: libName,
                        isTSL: true,
                        patches
                    };
                } catch (err) {
                    console.error(`Error reading TSL file ${file}:`, err);
                    return null;
                }
            });
            
            const results = await Promise.all(readPromises);
            results.forEach(res => {
                if (res) allLibraries.push(res);
            });
        }
    } catch (err) {
        console.error('Error loading TSL patches:', err);
    }

    // Ordenar alfabeticamente para misturar pastas locais e oficiais de forma limpa
    allLibraries.sort((a, b) => a.fileName.localeCompare(b.fileName, 'pt', { sensitivity: 'base' }));

    return allLibraries;
});

let mainWindow = null;
let libraryWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    show: false, // Ocultar até estar renderizada e evitar o flash branco
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: "BOSS ME-25 Web Editor & Librarian",
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico') // Optional
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (libraryWindow) {
      libraryWindow.close();
    }
  });
}

// Configurar ouvintes de IPC para a janela de biblioteca multi-tela
ipcMain.on('open-library-window', () => {
  if (libraryWindow) {
    libraryWindow.focus();
    return;
  }

  libraryWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    frame: false,
    show: false, // Evitar flash branco na janela popup
    center: true, // Centralizado na tela
    title: "Biblioteca BOSS ME-25",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  // Carregar index.html em modo biblioteca (passando query string)
  libraryWindow.loadFile(path.join(__dirname, 'index.html'), { query: { mode: 'library' } });

  libraryWindow.once('ready-to-show', () => {
    libraryWindow.show();
  });

  libraryWindow.on('closed', () => {
    libraryWindow = null;
    if (mainWindow) {
      mainWindow.webContents.send('library-window-closed');
    }
  });
});

ipcMain.on('library-select-patch', (event, patchData) => {
  if (mainWindow) {
    mainWindow.webContents.send('load-patch-from-library', patchData);
  }
});

// IPC handlers for custom title bar window controls
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

app.whenReady().then(() => {
  // Configurar permissão automática para MIDI, MIDI Sysex e Captura de Áudio (Microfone/Guitarra)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'midi' || permission === 'midiSysex' || permission === 'audioCapture' || permission === 'media') {
      return callback(true);
    }
    return callback(false);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

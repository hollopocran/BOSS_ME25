const { app, BrowserWindow, session, ipcMain, screen, dialog } = require('electron');
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
let playerWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    resizable: true,
    frame: false,
    show: false, // Ocultar até estar renderizada e evitar o flash branco
    webPreferences: {
      backgroundThrottling: false,
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
    if (playerWindow) {
      playerWindow.close();
    }
  });
}

let activeTheme = 'dark';

ipcMain.on('theme-changed', (event, theme) => {
  activeTheme = theme;
  if (mainWindow && event.sender !== mainWindow.webContents) {
    mainWindow.webContents.send('apply-theme', theme);
  }
  if (libraryWindow && event.sender !== libraryWindow.webContents) {
    libraryWindow.webContents.send('apply-theme', theme);
  }
  if (playerWindow && event.sender !== playerWindow.webContents) {
    playerWindow.webContents.send('apply-theme', theme);
  }
});

ipcMain.on('open-library-window', () => {
  if (libraryWindow) {
    libraryWindow.focus();
    return;
  }

  libraryWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    frame: false,
    show: false, // Evitar flash branco na janela popup
    center: true, // Centralizado na tela
    title: "Biblioteca BOSS ME-25",
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  // Carregar index.html em modo biblioteca (passando query string incluindo o tema atual)
  libraryWindow.loadFile(path.join(__dirname, 'index.html'), { query: { mode: 'library', theme: activeTheme } });

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

ipcMain.on('open-player-window', () => {
  if (playerWindow) {
    playerWindow.focus();
    return;
  }

  playerWindow = new BrowserWindow({
    width: 950,
    height: 570,
    minWidth: 600,
    minHeight: 400,
    resizable: true,
    frame: false,
    show: false, // Evitar flash branco na janela popup
    center: true,
    title: "Mixer & Player PIP",
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  playerWindow.loadFile(path.join(__dirname, 'index.html'), { query: { mode: 'player', theme: activeTheme } });

  playerWindow.once('ready-to-show', () => {
    playerWindow.show();
  });

  playerWindow.on('closed', () => {
    playerWindow = null;
    if (mainWindow) {
      mainWindow.webContents.send('player-window-closed');
    }
  });
});

ipcMain.on('player-action', (event, packet) => {
  // Encaminhar ações para as outras janelas
  if (mainWindow && event.sender !== mainWindow.webContents) {
    mainWindow.webContents.send('player-action', packet);
  }
  if (playerWindow && event.sender !== playerWindow.webContents) {
    playerWindow.webContents.send('player-action', packet);
  }
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
    const currentDisplay = screen.getDisplayMatching(win.getBounds());
    const workArea = currentDisplay.workArea;
    const bounds = win.getBounds();
    
    // Se a largura e altura forem iguais à workArea (com tolerância), considera-se maximizado
    const isCurrentlyMaximized = win.isMaximized() || 
      (Math.abs(bounds.width - workArea.width) < 15 && Math.abs(bounds.height - workArea.height) < 15);
      
    if (isCurrentlyMaximized) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        // Restaurar tamanho padrão dependendo do título da janela
        const title = win.getTitle();
        if (title.includes("Mixer") || title.includes("PIP")) {
          win.setBounds({
            x: workArea.x + Math.floor((workArea.width - 860) / 2),
            y: workArea.y + Math.floor((workArea.height - 520) / 2),
            width: 860,
            height: 520
          });
        } else if (title.includes("Biblioteca")) {
          win.setBounds({
            x: workArea.x + Math.floor((workArea.width - 1366) / 2),
            y: workArea.y + Math.floor((workArea.height - 768) / 2),
            width: 1366,
            height: 768
          });
        } else {
          win.setBounds({
            x: workArea.x + Math.floor((workArea.width - 1280) / 2),
            y: workArea.y + Math.floor((workArea.height - 800) / 2),
            width: 1280,
            height: 800
          });
        }
      }
    } else {
      // Maximiza definindo limites idênticos à workArea para respeitar a barra de tarefas
      win.setBounds({
        x: workArea.x,
        y: workArea.y,
        width: workArea.width,
        height: workArea.height
      });
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});


const { execFile } = require('child_process');
const os = require('os');

ipcMain.handle('stem:separate', async (event, inputFilePath) => {
  const ENGINE_DIR = path.join(__dirname, 'engine');
  const SEPARATOR_PATH = path.join(ENGINE_DIR, 'separate_engine.exe');
  
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'boss_stems_'));
  
  return new Promise((resolve) => {
    event.sender.send('stem:progress', { step: 'load_model', pct: 5, msg: 'Iniciando IA (carregando pesos)...' });
    
    const child = execFile(SEPARATOR_PATH, [inputFilePath, tmpDir], (error, stdout, stderr) => {
      if (error) {
        console.error("Separation failed:", error, stderr);
        try { fs.rmSync(tmpDir, { recursive: true }); } catch (_) {}
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({
          success: true,
          paths: {
            vocals: path.join(tmpDir, 'vocals.wav'),
            drums: path.join(tmpDir, 'drums.wav'),
            bass: path.join(tmpDir, 'bass.wav'),
            other: path.join(tmpDir, 'other.wav')
          },
          tmpDir: tmpDir
        });
      }
    });
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes("Reading audio file")) {
        event.sender.send('stem:progress', { step: 'read_audio', pct: 10, msg: 'Lendo arquivo de áudio...' });
      }
      
      const progressMatch = text.match(/Processing segment\s*(\d+)\/(\d+)/);
      if (progressMatch) {
        const current = parseInt(progressMatch[1]);
        const total = parseInt(progressMatch[2]);
        const pct = 10 + Math.round((current / total) * 80);
        event.sender.send('stem:progress', {
          step: 'infer',
          pct: pct,
          msg: `Processando segmento ${current}/${total}...`
        });
      }
      
      if (text.includes("Writing vocals stem")) {
        event.sender.send('stem:progress', { step: 'write', pct: 95, msg: 'Salvando faixas separadas...' });
      }
    });
  });
});

ipcMain.handle('stem:cleanup', async (event, tmpDir) => {
  try {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Biblioteca de stems separadas salvas permanentemente
const SEPARATED_DIR = path.join(__dirname, 'BT', 'separated');
if (!fs.existsSync(SEPARATED_DIR)) {
  fs.mkdirSync(SEPARATED_DIR, { recursive: true });
}

ipcMain.handle('library:get-separated-dir', () => {
  return SEPARATED_DIR;
});

ipcMain.handle('library:list-separated', async () => {
  try {
    if (!fs.existsSync(SEPARATED_DIR)) {
      return [];
    }
    const entries = await fs.promises.readdir(SEPARATED_DIR);
    const resultList = [];
    
    for (const entry of entries) {
      const entryPath = path.join(SEPARATED_DIR, entry);
      const stat = await fs.promises.stat(entryPath);
      
      if (stat.isDirectory()) {
        const fileNames = ['vocals.wav', 'drums.wav', 'bass.wav', 'other.wav'];
        const filesExist = fileNames.every(f => fs.existsSync(path.join(entryPath, f)));
        
        if (filesExist) {
          let meta = {};
          const metaPath = path.join(entryPath, 'metadata.json');
          if (fs.existsSync(metaPath)) {
            try {
              const metaContent = await fs.promises.readFile(metaPath, 'utf8');
              meta = JSON.parse(metaContent);
            } catch (err) {
              console.error("Erro ao ler metadados de", entry, err);
            }
          }
          
          resultList.push({
            name: entry,
            path: entryPath,
            isFile: false,
            paths: {
              vocals: path.join(entryPath, 'vocals.wav'),
              drums: path.join(entryPath, 'drums.wav'),
              bass: path.join(entryPath, 'bass.wav'),
              other: path.join(entryPath, 'other.wav')
            },
            meta: meta
          });
        }
      } else if (stat.isFile()) {
        const ext = path.extname(entry).toLowerCase();
        const validExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac'];
        
        if (validExtensions.includes(ext)) {
          const title = path.basename(entry, ext);
          resultList.push({
            name: entry,
            path: entryPath,
            isFile: true,
            paths: {
              original: entryPath
            },
            meta: {
              title: title,
              artist: "Faixa Única (Backing Track)",
              duration: 0
            }
          });
        }
      }
    }
    return resultList;
  } catch (err) {
    console.error("Erro ao listar biblioteca:", err);
    return [];
  }
});

ipcMain.handle('library:save-separated', async (event, { name, tmpPaths, meta }) => {
  try {
    const safeName = name.replace(/[\\/:*?"<>|]/g, '_').trim();
    const destFolder = path.join(SEPARATED_DIR, safeName);
    
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    
    const copyPromises = Object.keys(tmpPaths).map(async (key) => {
      const srcPath = tmpPaths[key];
      const destPath = path.join(destFolder, `${key}.wav`);
      await fs.promises.copyFile(srcPath, destPath);
      return destPath;
    });
    
    await Promise.all(copyPromises);
    
    const metaPath = path.join(destFolder, 'metadata.json');
    await fs.promises.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    
    return {
      success: true,
      path: destFolder,
      paths: {
        vocals: path.join(destFolder, 'vocals.wav'),
        drums: path.join(destFolder, 'drums.wav'),
        bass: path.join(destFolder, 'bass.wav'),
        other: path.join(destFolder, 'other.wav')
      }
    };
  } catch (err) {
    console.error("Erro ao salvar separado na biblioteca:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('library:delete-separated', async (event, folderName) => {
  try {
    const folderPath = path.join(SEPARATED_DIR, folderName);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      return { success: true };
    }
    return { success: false, error: "Diretório não encontrado." };
  } catch (err) {
    console.error("Erro ao excluir separado:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file:save-dialog', async (event, options) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, options);
    return result;
  } catch (err) {
    console.error("Erro ao abrir SaveDialog:", err);
    return { canceled: true };
  }
});

ipcMain.handle('file:write-buffer', async (event, { filePath, buffer }) => {
  try {
    const nodeBuffer = Buffer.from(buffer);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, nodeBuffer);
    return { success: true };
  } catch (err) {
    console.error("Erro ao salvar arquivo:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file:read-buffer', async (event, filePath) => {
  try {
    let finalPath = filePath;
    if (!path.isAbsolute(filePath)) {
      finalPath = path.join(__dirname, filePath);
    }
    const buffer = fs.readFileSync(finalPath);
    return buffer;
  } catch (e) {
    console.error("Read file failed:", e);
    return null;
  }
});

app.whenReady().then(() => {
  // Configurar permissão automática para MIDI, MIDI Sysex e Captura de Áudio (Microfone/Guitarra)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'midi' || permission === 'midiSysex' || permission === 'audioCapture' || permission === 'media') {
      return callback(true);
    }
    return callback(false);
  });

  // Forçar cabeçalhos HTTP válidos para requisições do YouTube (evita Erro 153/152 devido ao protocolo local file:// e desalinhamento de domínios)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
    (details, callback) => {
      try {
        const url = new URL(details.url);
        details.requestHeaders['Origin'] = url.origin;
        details.requestHeaders['Referer'] = url.origin + '/';
      } catch (e) {}
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

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

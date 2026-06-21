// app.js - Logic for the BOSS ME-25 Web Editor

// Verificar se a janela está rodando em modo biblioteca (multi-tela)
const urlParams = new URLSearchParams(window.location.search);
const isLibraryMode = urlParams.get('mode') === 'library';
const isPlayerMode = urlParams.get('mode') === 'player';
const urlTheme = urlParams.get('theme');

// Determinar e aplicar o tema salvo imediatamente para evitar piscadas (flicker)
let savedTheme = localStorage.getItem('boss_me25_theme') || 'dark';
if ((isLibraryMode || isPlayerMode) && urlTheme) {
    savedTheme = urlTheme;
}
document.documentElement.setAttribute('data-theme', savedTheme);

// Sincronizar o tema inicial com o processo principal do Electron
if (!isLibraryMode && !isPlayerMode && window.electronAPI && window.electronAPI.changeTheme) {
    window.electronAPI.changeTheme(savedTheme);
}

// Helper to get theme colors for slider fills
function getThemeColorsForSlider() {
    const computedStyle = getComputedStyle(document.documentElement);
    const primary = computedStyle.getPropertyValue('--primary-color').trim() || '#00d2ff';
    const bg = computedStyle.getPropertyValue('--bg-color').trim() || '#10151a';
    return { primary, bg };
}

// Refresh slider background gradients based on theme colors
function refreshSliderThemeBackgrounds() {
    const colors = getThemeColorsForSlider();
    const progressBar = document.getElementById('backingProgressBar');
    if (progressBar) {
        const val = parseFloat(progressBar.value) || 0;
        const max = parseFloat(progressBar.max) || 1;
        const pct = (val / max) * 100;
        progressBar.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${pct}%, ${colors.bg} ${pct}%, ${colors.bg} 100%)`;
    }
    const volSlider = document.getElementById('backingVolume');
    if (volSlider) {
        const val = parseFloat(volSlider.value) || 0;
        volSlider.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${val}%, ${colors.bg} ${val}%, ${colors.bg} 100%)`;
    }
}

// Ouvir alterações de tema de outras janelas (sincronizar editor <-> popup biblioteca via IPC e Storage)
if (window.electronAPI && window.electronAPI.onThemeChanged) {
    window.electronAPI.onThemeChanged((newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = newTheme;
        localStorage.setItem('boss_me25_theme', newTheme);
        refreshSliderThemeBackgrounds();
    });
}

window.addEventListener('storage', (e) => {
    if (e.key === 'boss_me25_theme') {
        const newTheme = e.newValue || 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) themeSelect.value = newTheme;
        refreshSliderThemeBackgrounds();
    } else if (e.key === 'boss_me25_fontsize') {
        const newSize = e.newValue || 'normal';
        let sizePercent = '100%';
        if (newSize === 'small') sizePercent = '85%';
        else if (newSize === 'medium') sizePercent = '115%';
        else if (newSize === 'large') sizePercent = '130%';
        
        document.documentElement.style.fontSize = sizePercent;
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        if (fontSizeSelect) fontSizeSelect.value = newSize;
        
        if (typeof alignLibraryCardWithDelay === 'function') {
            alignLibraryCardWithDelay();
            setTimeout(alignLibraryCardWithDelay, 100);
        }
    }
});

if (isLibraryMode || isPlayerMode) {
    const initMode = () => {
        if (isLibraryMode) {
            document.body.classList.add('library-window-mode');
        } else if (isPlayerMode) {
            document.body.classList.add('player-window-mode');
            
            // Alterar texto da barra de título customizada
            const titleText = document.getElementById('titleBarText');
            if (titleText) titleText.textContent = "Player & Mixer de Acompanhamento";
            
            // Solicitar sincronização inicial do processo principal
            if (window.electronAPI && window.electronAPI.sendPlayerAction) {
                window.electronAPI.sendPlayerAction('request-sync', null);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMode);
    } else {
        initMode();
    }
}

// Lista de Presets de fábrica extraídos dos arquivos .syx originais
const FACTORY_PRESETS = [
    { name: "Acoustic Strum", address: "7f000900", params: [1, 2, 47, 64, 75, 0, 0, 50, 50, 50, 0, 0, 40, 50, 50, 55, 1, 1, 9, 29, 22, 110, 0, 0, 50, 50, 50, 50, 50, 50, 0, 5, 0, 0, 0, 99, 90, 1, 1, 50, 10, 35, 0, 30, 0, 4, 0, 0] },
    { name: "BD Crunch", address: "7f000300", params: [0, 0, 40, 50, 50, 1, 3, 23, 50, 55, 0, 0, 40, 50, 50, 55, 0, 1, 40, 50, 50, 110, 1, 1, 50, 47, 52, 57, 47, 53, 0, 5, 0, 0, 0, 99, 90, 1, 0, 50, 10, 28, 0, 50, 0, 4, 0, 0] },
    { name: "Clean Tremolo", address: "7f000b00", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 1, 5, 39, 39, 50, 55, 0, 1, 40, 50, 50, 110, 1, 1, 50, 48, 56, 50, 50, 50, 0, 5, 0, 0, 0, 99, 90, 1, 1, 50, 10, 58, 0, 38, 0, 4, 0, 0] },
    { name: "Harmony Am", address: "7f000800", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 1, 6, 0, 40, 80, 55, 1, 1, 33, 28, 45, 110, 1, 9, 60, 50, 44, 43, 44, 56, 0, 6, 0, 0, 0, 99, 90, 0, 0, 50, 10, 20, 0, 56, 0, 4, 0, 0] },
    { name: "Maximum Gain", address: "7f000a00", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 0, 0, 40, 50, 50, 55, 0, 1, 40, 50, 50, 110, 1, 9, 78, 40, 48, 57, 42, 50, 1, 6, 0, 0, 0, 99, 90, 1, 1, 50, 10, 15, 0, 60, 0, 4, 0, 0] },
    { name: "Nice Clean", address: "7f000400", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 1, 0, 34, 50, 62, 55, 1, 1, 28, 20, 40, 110, 1, 0, 38, 61, 43, 58, 55, 60, 0, 5, 0, 0, 0, 99, 90, 1, 1, 50, 10, 53, 0, 35, 0, 4, 0, 0] },
    { name: "Punk Strum", address: "7f010000", params: [0, 0, 40, 50, 50, 1, 0, 42, 51, 58, 0, 0, 40, 50, 50, 55, 0, 1, 40, 50, 50, 110, 1, 5, 99, 52, 49, 52, 46, 50, 0, 5, 0, 0, 0, 99, 90, 1, 0, 50, 10, 21, 0, 55, 0, 4, 0, 0] },
    { name: "Rock'nRoll", address: "7f000500", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 0, 0, 40, 50, 50, 55, 0, 1, 40, 50, 50, 110, 1, 3, 75, 49, 50, 54, 43, 63, 0, 5, 0, 0, 0, 99, 90, 1, 0, 50, 10, 43, 0, 45, 0, 4, 0, 0] },
    { name: "Smooth Lead", address: "7f000600", params: [0, 0, 40, 50, 50, 1, 1, 97, 44, 44, 0, 0, 40, 50, 50, 55, 1, 1, 36, 32, 49, 110, 1, 0, 50, 50, 47, 52, 48, 77, 0, 5, 0, 0, 0, 99, 90, 1, 1, 50, 10, 47, 0, 53, 0, 4, 0, 0] },
    { name: "Speed Lead", address: "7f000200", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 0, 0, 40, 50, 50, 55, 1, 1, 31, 19, 37, 110, 1, 6, 58, 56, 51, 54, 48, 49, 0, 5, 0, 0, 0, 99, 90, 1, 1, 50, 10, 20, 1, 51, 0, 4, 0, 0] },
    { name: "Super Metal Riff", address: "7f000100", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 0, 0, 40, 50, 50, 55, 1, 1, 29, 15, 17, 110, 1, 9, 65, 53, 49, 51, 47, 62, 0, 6, 0, 0, 0, 99, 90, 1, 1, 50, 10, 22, 0, 55, 0, 4, 0, 0] },
    { name: "Wah Modern Lead", address: "7f000700", params: [0, 0, 40, 50, 50, 1, 0, 29, 51, 50, 0, 0, 40, 50, 50, 55, 1, 1, 13, 32, 34, 110, 1, 6, 72, 55, 53, 50, 46, 51, 0, 6, 1, 0, 0, 99, 90, 0, 0, 50, 10, 20, 0, 55, 0, 4, 0, 0] },
    { name: "Direct / DAW Out (Bypass)", address: "7f000c00", params: [0, 0, 40, 50, 50, 0, 0, 50, 50, 50, 0, 0, 40, 50, 50, 55, 0, 1, 40, 50, 50, 110, 0, 0, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 99, 90, 0, 1, 50, 10, 0, 0, 0, 0, 4, 0, 0] }
];

// Mapeamento dos parâmetros do ME-25 para facilitar o controle
const PARAM_MAP = {
    // COMP/FX
    compSwitch: { paramIdx: 0, type: "switch" },
    compType: { paramIdx: 1, type: "select" },
    compSustain: { paramIdx: 2, type: "range" },
    compAttack: { paramIdx: 3, type: "range" },
    compLevel: { paramIdx: 4, type: "range" },

    // OD/DS
    oddsSwitch: { paramIdx: 5, type: "switch" },
    oddsType: { paramIdx: 6, type: "select" },
    oddsDrive: { paramIdx: 7, type: "range" },
    oddsTone: { paramIdx: 8, type: "range" },
    oddsLevel: { paramIdx: 9, type: "range" },

    // MODULATION
    modSwitch: { paramIdx: 10, type: "switch" },
    modType: { paramIdx: 11, type: "select" },
    modRate: { paramIdx: 12, type: "range" },
    modDepth: { paramIdx: 13, type: "range" },
    modLevel: { paramIdx: 14, type: "range" },
    modParam4: { paramIdx: 15, type: "range" },

    // DELAY
    delaySwitch: { paramIdx: 16, type: "switch" },
    delayType: { paramIdx: 17, type: "select" },
    // time: P18 (MSB) e P19 (LSB) mapeados juntos na UI
    delayFeedback: { paramIdx: 20, type: "range" },
    delayLevel: { paramIdx: 21, type: "range" },

    // PREAMP
    preSwitch: { paramIdx: 22, type: "switch" },
    preType: { paramIdx: 23, type: "select" },
    preGain: { paramIdx: 24, type: "range" },
    preBass: { paramIdx: 25, type: "range" },
    preMiddle: { paramIdx: 26, type: "range" },
    preTreble: { paramIdx: 27, type: "range" },
    prePresence: { paramIdx: 28, type: "range" },
    preLevel: { paramIdx: 29, type: "range" },

    // SOLO / NOISE SUPPRESSOR / PEDAL FX
    soloSwitch: { paramIdx: 30, type: "switch" },
    nsThreshold: { paramIdx: 31, type: "range" },
    pedalFxType: { paramIdx: 32, type: "select" },
    
    // Auxiliares
    p33: { paramIdx: 33, type: "range" },
    p34: { paramIdx: 34, type: "range" },
    masterVol: { paramIdx: 35, type: "range" },
    p36: { paramIdx: 36, type: "range" },
    superStack: { paramIdx: 37, type: "switch" },
    p38: { paramIdx: 38, type: "range" },

    // REVERB
    p39: { paramIdx: 39, type: "range" },
    p40: { paramIdx: 40, type: "range" },
    reverbDecay: { paramIdx: 41, type: "range" },
    reverbType: { paramIdx: 42, type: "select" },
    reverbLevel: { paramIdx: 43, type: "range" },

    // Reservados
    p44: { paramIdx: 44, type: "range" },
    p45: { paramIdx: 45, type: "range" },
    p46: { paramIdx: 46, type: "range" },
    p47: { paramIdx: 47, type: "range" }
};

// Estado Global da Aplicação
const state = {
    midiAccess: null,
    midiInput: null,
    midiOutput: null,
    currentPatch: {
        name: "New Patch",
        params: Array(48).fill(0)
    },
    // Endereço de memória ativo padrão (Edit Buffer do ME-25)
    activeAddress: [0x20, 0x00, 0x00, 0x00],
    isEditorModeOn: false,
    lastReceivedMessage: null,
    isMutedMidiSend: false, // Impede loops infinitos ao sincronizar a UI
    backupInProgress: false,
    backupCurrentSlot: 0,
    backupData: Array(60).fill(null),
    restoreInProgress: false,
    restoreCurrentSlot: 0,
    restoreData: [],
    
    // Áudio Virtual / Simulação local
    audioCtx: null,
    simPlaying: false,
    simInterval: null,
    nodes: {
        input: null,
        distortion: null,
        bassFilter: null,
        midFilter: null,
        trebleFilter: null,
        delayNode: null,
        delayFeedback: null,
        delayWet: null,
        reverbNode: null,
        reverbFeedback: null,
        reverbWet: null,
        masterGain: null
    },
    isDawModeActive: false,
    savedPatchBeforeDaw: null,
    liveAudioStream: null,
    liveAudioSource: null,
    backingTrack: {
        audioCtx: null,
        sources: [],
        gains: [],
        masterGain: null,
        isPlaying: false,
        duration: 0,
        startTime: 0,
        pauseTime: 0,
        audioBuffers: [],
        fileNames: [],
        fileName: '',
        tmpPaths: null,
        tmpDir: null,
        mode: 'stems', // O modo será sempre stems/IA de acordo com a solicitação
        cardOrder: [0, 1, 2, 3], // Ordem visual dos cards no mixer PIP
        progressBarInterval: null,
        // Configurações de EQ independentes por canal/stem (5 canais: Voz, Bateria, Baixo, Guitarra/Outros e Canção Original)
        eqSettings: Array.from({ length: 5 }, () => ({
            hpf: 20,          // Passa-alto freq (20Hz a 20000Hz)
            hpfQ: 0.707,
            hpfSlope: 1,
            lpf: 20000,       // Passa-baixo freq (20Hz a 20000Hz)
            lpfQ: 0.707,
            lpfSlope: 1,
            bands: [
                { freq: 80, q: 1.0, gain: 0 },   // Grave
                { freq: 250, q: 1.0, gain: 0 },  // Médio/Grave
                { freq: 1000, q: 1.0, gain: 0 }, // Médio
                { freq: 4000, q: 1.0, gain: 0 }, // Médio/Agudo
                { freq: 12000, q: 1.0, gain: 0 } // Agudo
            ],
            low: 0,
            mid: 0,
            high: 0,
            mute: false,
            volume: 80
        })),
        // Referências para nós ativos em execução por canal (para manipulação em tempo real)
        // Cada item será { hpfNode, lpfNode, hpfNodes: [], lpfNodes: [], bandNodes: [5], gainNode }
        stemNodes: Array.from({ length: 5 }, () => ({
            hpfNode: null,
            lpfNode: null,
            hpfNodes: [],
            lpfNodes: [],
            bandNodes: [],
            gainNode: null
        }))
    }
};

const SVG_VOLUME_HIGH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

const SVG_VOLUME_LOW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

const SVG_VOLUME_MUTE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

// Inicializar tudo ao carregar
window.addEventListener('DOMContentLoaded', () => {
    initFontSize();
    initTitleBar();
    initUIElements();
    initPresetsList();
    initMidiConnection();
    loadCustomPatchesList();
    initSlotSelect();
    
    // Configurar valores padrão para o patch atual
    loadPatchValues(FACTORY_PRESETS[0].params, FACTORY_PRESETS[0].name);

    // Inicializar novos recursos
    initializeKnobs();
    initCloudPresetsList();
    initLibrarianEvents();
    initSignalFlowEvents();
    loadSessionFromLocalStorage();
    initSidebarTabs();
    initFxFloorBoardPatches();
    initLibrarySearch();
    initEffectsSearch();
    initPopupLibrary();
    initPopupPlayer();
    initDawMode();
    initTheme();
    initBackingPlayer();
    initStemSeparator();
    initStemLibrary();
    initMainTabs();
    initDocumentation();

    // Configurar comunicação da biblioteca externa em modo editor principal
    if (!isLibraryMode) {
        if (window.electronAPI && window.electronAPI.onLoadPatchFromLibrary) {
            window.electronAPI.onLoadPatchFromLibrary((patchData) => {
                loadPatchValues(patchData.params, patchData.name);
                // Enviar atualização completa para a pedaleira
                if (!state.isMutedMidiSend) {
                    sendPatchToPedalThrottled();
                }
                logConsole(`Patch carregado da biblioteca externa: ${patchData.name}`, 'info');
            });
        }
        if (window.electronAPI && window.electronAPI.onLibraryWindowClosed) {
            window.electronAPI.onLibraryWindowClosed(() => {
                const btnPopup = document.getElementById('btnPopupLibrary');
                if (btnPopup) btnPopup.style.display = 'block';
            });
        }
    } else {
        // Em modo Biblioteca (Popup), movemos o contêiner de pesquisa para ficar ao lado do título
        const panelTitle = document.querySelector('.sidebar-panel:last-of-type .panel-title');
        const searchContainer = document.querySelector('.search-container');
        if (panelTitle && searchContainer) {
            panelTitle.appendChild(searchContainer);
        }
    }

    // Configurar comunicação do Player & Mixer PIP (Modo Multi-tela)
    if (window.electronAPI && window.electronAPI.onPlayerAction) {
        window.electronAPI.onPlayerAction(async (packet) => {
            const { type, data } = packet;
            
            if (isPlayerMode) {
                // Modo PIP (Janela Player) recebendo sincronização do editor principal
                if (type === 'playback-sync') {
                    state.backingTrack.isPlaying = data.isPlaying;
                    state.backingTrack.pauseTime = data.pauseTime;
                    state.backingTrack.duration = data.duration;
                    state.backingTrack.currentElapsed = data.currentElapsed; // Salvar no estado global
                    
                    const btnPlay = document.getElementById('btnPlayBacking');
                    if (btnPlay) {
                        btnPlay.textContent = data.isPlaying ? "⏸" : "▶";
                        btnPlay.setAttribute('title', data.isPlaying ? "Pause" : "Play");
                        if (data.isPlaying) {
                            btnPlay.classList.add('playing');
                        } else {
                            btnPlay.classList.remove('playing');
                        }
                    }
                    
                    const wave = document.querySelector('.bp3-wave-icon');
                    if (wave) {
                        if (data.isPlaying) {
                            wave.classList.add('playing');
                        } else {
                            wave.classList.remove('playing');
                        }
                    }
                    
                    const progressBar = document.getElementById('backingProgressBar');
                    const timeCurrentEl = document.getElementById('backingTimeCurrent');
                    const timeTotalEl = document.getElementById('backingTimeTotal');
                    if (progressBar) {
                        progressBar.max = Math.floor(data.duration) || 100;
                        progressBar.value = Math.floor(data.currentElapsed) || 0;
                        progressBar.disabled = false;
                        progressBar.removeAttribute('disabled');
                        
                        const pct = (progressBar.value / (progressBar.max || 1)) * 100;
                        const colors = getThemeColorsForSlider();
                        progressBar.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${pct}%, ${colors.bg} ${pct}%, ${colors.bg} 100%)`;
                        
                        if (state.backingTrack.updateCustomProgressBarUI) {
                            state.backingTrack.updateCustomProgressBarUI();
                        }
                    }
                    if (timeCurrentEl) timeCurrentEl.textContent = formatBackingTime(data.currentElapsed);
                    if (timeTotalEl) timeTotalEl.textContent = formatBackingTime(data.duration);
                    
                } else if (type === 'stems-loaded') {
                    state.backingTrack.mode = data.mode || 'original';
                    state.backingTrack.eqSettings = data.eqSettings;
                    state.backingTrack.fileNames = data.fileNames;
                    state.backingTrack.bypassEq = !!data.bypassEq;
                    state.backingTrack.fileName = data.fileName || '';
                    state.backingTrack.metaTitle = data.metaTitle || '';
                    state.backingTrack.metaArtist = data.metaArtist || '';
                    state.backingTrack.metaCoverUrl = data.metaCoverUrl || '';
                    
                    const btnPlay = document.getElementById('btnPlayBacking');
                    const btnStop = document.getElementById('btnStopBacking');
                    if (btnPlay) btnPlay.removeAttribute('disabled');
                    if (btnStop) btnStop.removeAttribute('disabled');
                    
                    const progressBar = document.getElementById('backingProgressBar');
                    if (progressBar) {
                        progressBar.disabled = false;
                        progressBar.removeAttribute('disabled');
                        progressBar.max = Math.floor(data.duration || 100);
                        progressBar.value = 0;
                    }
                    if (state.backingTrack.updateCustomProgressBarUI) {
                        state.backingTrack.updateCustomProgressBarUI();
                    }
                    
                    const titleEl = document.getElementById('playerTrackTitle');
                    const subtitleEl = document.getElementById('playerTrackSubtitle');
                    const coverEl = document.getElementById('playerTrackCover');
                    const iconEl = document.getElementById('playerTrackIcon');
                    
                    if (data.metaTitle) {
                        if (titleEl) titleEl.textContent = data.metaTitle;
                        if (subtitleEl) subtitleEl.textContent = data.metaArtist || "Stems prontas";
                        if (coverEl && data.metaCoverUrl) {
                            coverEl.src = data.metaCoverUrl;
                            coverEl.style.display = 'block';
                        }
                        if (iconEl && data.metaCoverUrl) iconEl.style.display = 'none';
                    } else {
                        if (titleEl) titleEl.textContent = data.fileName;
                        if (subtitleEl) subtitleEl.textContent = "Stems prontas para mixagem";
                        if (coverEl) coverEl.style.display = 'none';
                        if (iconEl) iconEl.style.display = 'flex';
                    }
                    
                    renderStemsList();
                    
                } else if (type === 'eq-settings-sync') {
                    state.backingTrack.eqSettings = data;
                    for (let i = 0; i < state.backingTrack.eqSettings.length; i++) {
                        const itemData = data[i];
                        if (!itemData) continue;
                        
                        const slider = document.querySelector(`.stem-volume-slider[data-idx="${i}"]`);
                        if (slider) {
                            slider.value = itemData.volume;
                            slider.dispatchEvent(new Event('input'));
                        }

                        const eqHigh = document.querySelector(`.stem-eq-high[data-idx="${i}"]`);
                        if (eqHigh) {
                            eqHigh.value = itemData.high || 0;
                            eqHigh.dispatchEvent(new Event('input'));
                        }

                        const eqMid = document.querySelector(`.stem-eq-mid[data-idx="${i}"]`);
                        if (eqMid) {
                            eqMid.value = itemData.mid || 0;
                            eqMid.dispatchEvent(new Event('input'));
                        }

                        const eqLow = document.querySelector(`.stem-eq-low[data-idx="${i}"]`);
                        if (eqLow) {
                            eqLow.value = itemData.low || 0;
                            eqLow.dispatchEvent(new Event('input'));
                        }
                    }
                } else if (type === 'bypass-global-sync') {
                    state.backingTrack.bypassEq = data;
                    const globalSwitch = document.getElementById('globalBypassSwitch');
                    if (globalSwitch) globalSwitch.checked = data;
                    if (!isPlayerMode) {
                        setEqBypass(data);
                    }
                } else if (type === 'bypass-channel-sync') {
                    const { stemIdx, bypass } = data;
                    state.backingTrack.eqSettings[stemIdx].bypass = bypass;
                    const chSwitch = document.getElementById(`chBypass-${stemIdx}`);
                    if (chSwitch) chSwitch.checked = bypass;
                    if (!isPlayerMode) {
                        setChannelBypass(stemIdx, bypass);
                    }
                }
            } else {
                // Modo Editor Principal recebendo ações da janela PIP
                if (type === 'request-sync') {
                    syncStemsToPlayer();
                } else if (type === 'control-play') {
                    playBacking();
                    const btnPlay = document.getElementById('btnPlayBacking');
                    if (btnPlay) {
                        btnPlay.textContent = "⏸";
                        btnPlay.classList.add('playing');
                    }
                    const wave = document.querySelector('.bp3-wave-icon');
                    if (wave) wave.classList.add('playing');
                } else if (type === 'control-pause') {
                    pauseBacking();
                    const btnPlay = document.getElementById('btnPlayBacking');
                    if (btnPlay) {
                        btnPlay.textContent = "▶";
                        btnPlay.classList.remove('playing');
                    }
                    const wave = document.querySelector('.bp3-wave-icon');
                    if (wave) wave.classList.remove('playing');
                } else if (type === 'control-stop') {
                    stopBacking();
                    const btnPlay = document.getElementById('btnPlayBacking');
                    if (btnPlay) {
                        btnPlay.textContent = "▶";
                        btnPlay.classList.remove('playing');
                    }
                    const wave = document.querySelector('.bp3-wave-icon');
                    if (wave) wave.classList.remove('playing');
                } else if (type === 'control-seek') {
                    seekBacking(data);
                } else if (type === 'control-volume-master') {
                    const volSlider = document.getElementById('backingVolume');
                    if (volSlider) {
                        volSlider.value = data;
                        document.getElementById('backingVolumeVal').textContent = volumeToDbString(data);
                        const colors = getThemeColorsForSlider();
                        volSlider.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${data}%, ${colors.bg} ${data}%, ${colors.bg} 100%)`;
                    }
                    const btnMute = document.getElementById('btnPlayerMute');
                    if (btnMute) {
                        if (data === 0) {
                            btnMute.classList.add('muted');
                            btnMute.innerHTML = '🔇 Mutado';
                            btnMute.style.background = 'rgba(255, 59, 48, 0.15)';
                            btnMute.style.color = '#ff3b30';
                            btnMute.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                        } else {
                            btnMute.classList.remove('muted');
                            btnMute.innerHTML = '🔊 Ativo';
                            btnMute.style.background = 'rgba(0, 255, 135, 0.08)';
                            btnMute.style.color = '#00ff87';
                            btnMute.style.borderColor = 'rgba(0, 255, 135, 0.2)';
                        }
                    }
                    if (state.backingTrack.eqSettings[4]) {
                        state.backingTrack.eqSettings[4].volume = data;
                    }
                    if (state.backingTrack.masterGain) {
                        const db = valueToDb(data);
                        state.backingTrack.masterGain.gain.value = (db === -Infinity) ? 0 : Math.pow(10, db / 20);
                    }
                } else if (type === 'control-eq-change') {
                    const { stemIdx, settings } = data;
                    state.backingTrack.eqSettings[stemIdx] = settings;
                    updateStemAudioNode(stemIdx);
                    syncEqSettingsToPlayer();
                } else if (type === 'control-load-library-item') {
                    const savedTracks = await window.stemAPI.listSeparated();
                    const item = savedTracks.find(t => t.name === data);
                    if (item) {
                        await loadStemsFromLibraryPath(item);
                    }
                } else if (type === 'control-export-mixdown') {
                    await exportMixdown();
                } else if (type === 'control-export-stem') {
                    await exportIndividualStem(data);
                }
            }
        });
    }
});

// Inicializar elementos da interface gráfica e listeners
function initUIElements() {
    // Vincular todos os inputs mapeados no PARAM_MAP
    Object.keys(PARAM_MAP).forEach(key => {
        const config = PARAM_MAP[key];
        const el = document.getElementById(key);
        if (!el) return;

        if (config.type === "range" || config.type === "select") {
            el.addEventListener('input', (e) => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) val = 0;
                
                // Atualizar exibição do valor ao lado do controle
                const valEl = document.getElementById(`${key}Val`);
                if (valEl) valEl.textContent = val;

                updateParamValue(config.paramIdx, val);
            });
        } else if (config.type === "switch") {
            el.addEventListener('change', (e) => {
                const val = e.target.checked ? 1 : 0;
                updateParamValue(config.paramIdx, val);
                
                // Toggle classes do card para mudar a opacidade visual do bloco ativo/inativo (exceto switches globais)
                const card = el.closest('.effect-card');
                const isGlobalSwitch = key === 'soloSwitch' || key === 'superStack';
                if (card && !isGlobalSwitch) {
                    if (val === 1) card.classList.remove('disabled');
                    else card.classList.add('disabled');
                }
            });
        }
    });

    // Configurar controle composto de Delay Time
    const delayTimeEl = document.getElementById('delayTimeCombined');
    if (delayTimeEl) {
        delayTimeEl.addEventListener('input', (e) => {
            const timeMs = parseInt(e.target.value, 10);
            document.getElementById('delayTimeCombinedVal').textContent = `${timeMs} ms`;
            
            // Converter delay time para MSB e LSB (Roland 7-bit MIDI format)
            const msb = Math.floor(timeMs / 128);
            const lsb = timeMs % 128;

            updateParamValue(18, msb); // P18
            updateParamValue(19, lsb); // P19
        });
    }

    // Input do nome do Patch
    const nameEl = document.getElementById('patchNameInput');
    if (nameEl) {
        nameEl.addEventListener('input', (e) => {
            let name = e.target.value;
            // Truncar para 16 caracteres
            if (name.length > 16) {
                name = name.substring(0, 16);
                e.target.value = name;
            }
            state.currentPatch.name = name;
            resetPatchStatusBadge();
            sendPatchToPedalThrottled();
        });
    }

    // Botões globais
    const btnAudioSim = document.getElementById('btnToggleAudioSim');
    if (btnAudioSim) {
        btnAudioSim.addEventListener('click', toggleAudioSimulation);
    }

    document.getElementById('btnConnect').addEventListener('click', initMidiConnection);
    document.getElementById('btnEditorOn').addEventListener('click', toggleEditorMode);
    document.getElementById('btnRequestPatch').addEventListener('click', requestPatchFromPedal);
    document.getElementById('btnSendAll').addEventListener('click', sendPatchToPedal);
    document.getElementById('btnImport').addEventListener('click', importSyxFile);
    document.getElementById('btnExport').addEventListener('click', exportSyxFile);
    
    // Copiar e Colar Parâmetros como Texto
    const btnCopy = document.getElementById('btnCopyParams');
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            const patchObj = {
                name: state.currentPatch.name,
                params: state.currentPatch.params
            };
            const patchStr = JSON.stringify(patchObj);
            navigator.clipboard.writeText(patchStr).then(() => {
                logConsole(`Parâmetros do patch "${state.currentPatch.name}" copiados para a área de transferência!`, 'success');
                alert("Parâmetros do patch copiados com sucesso!");
            }).catch(err => {
                logConsole("Falha ao copiar parâmetros: " + err, 'error');
            });
        });
    }

    const btnPaste = document.getElementById('btnPasteParams');
    if (btnPaste) {
        btnPaste.addEventListener('click', () => {
            const text = prompt("Cole o código do patch aqui (JSON ou lista de 48 números):");
            if (!text) return;
            const cleanText = text.trim();
            try {
                let name = "Importado Clipboard";
                let params = null;

                if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
                    const obj = JSON.parse(cleanText);
                    if (obj.params && Array.isArray(obj.params)) {
                        params = obj.params;
                        if (obj.name) name = obj.name;
                    }
                } else if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
                    const arr = JSON.parse(cleanText);
                    if (Array.isArray(arr)) {
                        params = arr;
                    }
                } else {
                    const arr = cleanText.split(/[\s,]+/).map(x => parseInt(x.trim())).filter(x => !isNaN(x));
                    if (arr.length === 48) {
                        params = arr;
                    }
                }

                if (params && params.length === 48) {
                    loadPatchValues(params, name);
                    sendPatchToPedal();
                    logConsole(`Patch "${name}" colado e carregado com sucesso!`, 'success');
                    alert(`Patch "${name}" carregado com sucesso!`);
                } else {
                    alert("Erro: O formato do patch é inválido ou não possui 48 parâmetros.");
                    logConsole("Falha ao colar patch: Formato inválido ou número incorreto de parâmetros (deve ter 48).", 'error');
                }
            } catch (e) {
                alert("Erro ao ler código de patch: " + e.message);
                logConsole("Erro ao colar patch: " + e.message, 'error');
            }
        });
    }
    // Limpar logs
    const btnClear = document.getElementById('btnClearLog') || document.getElementById('btnFloatingClearLog');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            const consoleLog = document.getElementById('consoleLog');
            if (consoleLog) consoleLog.innerHTML = '';
        });
    }
    
    // Controle de abertura e fechamento do Modal de Configurações
    const btnSettings = document.getElementById('btnSettings');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    if (btnSettings && settingsModal && closeSettings) {
        btnSettings.addEventListener('click', () => {
            settingsModal.style.display = 'block';
        });

        closeSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        // Fechar ao clicar fora da área de conteúdo do modal
        window.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    // Controle e arraste da Janela de Logs Flutuante
    const btnToggleFloatingLogs = document.getElementById('btnToggleFloatingLogs');
    const floatingLogsWindow = document.getElementById('floatingLogsWindow');
    const closeFloatingLogs = document.getElementById('closeFloatingLogs');

    if (btnToggleFloatingLogs && floatingLogsWindow && closeFloatingLogs) {
        btnToggleFloatingLogs.addEventListener('click', () => {
            if (floatingLogsWindow.style.display === 'none') {
                floatingLogsWindow.style.display = 'flex';
                btnToggleFloatingLogs.textContent = "🖥️ Fechar Janela de Logs";
                btnToggleFloatingLogs.style.background = "var(--danger-color)";
                btnToggleFloatingLogs.style.color = "white";
            } else {
                floatingLogsWindow.style.display = 'none';
                btnToggleFloatingLogs.textContent = "🖥️ Abrir Janela de Logs Flutuante";
                btnToggleFloatingLogs.style.background = "rgba(255, 255, 255, 0.05)";
                btnToggleFloatingLogs.style.color = "var(--text-color)";
            }
        });

        closeFloatingLogs.addEventListener('click', () => {
            floatingLogsWindow.style.display = 'none';
            btnToggleFloatingLogs.textContent = "🖥️ Abrir Janela de Logs Flutuante";
            btnToggleFloatingLogs.style.background = "rgba(255, 255, 255, 0.05)";
            btnToggleFloatingLogs.style.color = "var(--text-color)";
        });

        // Tornar a janela de logs arrastável pelo cabeçalho
        makeElementDraggable(floatingLogsWindow, document.getElementById("floatingLogsHeader"));
    }
    
    // Salvar na biblioteca local
    const btnSaveLocal = document.getElementById('btnSaveLocal');
    if (btnSaveLocal) btnSaveLocal.addEventListener('click', saveCurrentPatchLocally);
    
    // Gravar no slot da pedaleira
    const btnWriteToSlot = document.getElementById('btnWriteToSlot');
    if (btnWriteToSlot) btnWriteToSlot.addEventListener('click', writePatchToSlot);
}

// Inicializar a barra de título customizada e seus controles
function initTitleBar() {
    const minimizeBtn = document.getElementById('btnWindowMinimize');
    const maximizeBtn = document.getElementById('btnWindowMaximize');
    const closeBtn = document.getElementById('btnWindowClose');
    
    const headerMinimizeBtn = document.getElementById('btnHeaderMinimize');
    const headerMaximizeBtn = document.getElementById('btnHeaderMaximize');
    const headerCloseBtn = document.getElementById('btnHeaderClose');
    
    const titleText = document.getElementById('titleBarText');

    if (isLibraryMode && titleText) {
        titleText.textContent = "Biblioteca BOSS ME-25";
    }

    if (window.electronAPI) {
        // Controles da janela de Biblioteca (modo popup)
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });
        }
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                window.electronAPI.maximizeWindow();
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.electronAPI.closeWindow();
            });
        }
        
        // Controles integrados no Header (modo Editor principal)
        if (headerMinimizeBtn) {
            headerMinimizeBtn.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });
        }
        if (headerMaximizeBtn) {
            headerMaximizeBtn.addEventListener('click', () => {
                window.electronAPI.maximizeWindow();
            });
        }
        if (headerCloseBtn) {
            headerCloseBtn.addEventListener('click', () => {
                window.electronAPI.closeWindow();
            });
        }
    } else {
        // Se estiver rodando no navegador (e não no Electron), esconde os controles customizados
        const titleBar = document.querySelector('.custom-title-bar');
        if (titleBar) {
            titleBar.style.display = 'none';
        }
        const headerControls = document.querySelector('.header-window-controls');
        if (headerControls) {
            headerControls.style.display = 'none';
        }
    }
}

// Inicializar lista de Presets de Fábrica
function initPresetsList() {
    const listContainer = document.getElementById('factoryPatchesList');
    listContainer.innerHTML = '';

    FACTORY_PRESETS.forEach((preset, idx) => {
        const item = document.createElement('div');
        item.className = 'patch-item';
        item.patchParams = preset.params;
        item.innerHTML = `
            <span class="patch-name">${preset.name}</span>
            <span class="patch-addr">${preset.address}</span>
        `;
        item.addEventListener('click', () => {
            // Remover classe ativa de todos
            document.querySelectorAll('.patch-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            // Carregar na UI e enviar para a pedaleira
            loadPatchValues(preset.params, preset.name);
            sendPatchToPedal();
            logConsole(`Carregou preset de fábrica: ${preset.name}`, 'info');
        });
        listContainer.appendChild(item);
    });
}

// Inicializar conexão MIDI usando a Web MIDI API
async function initMidiConnection() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const inputSelect = document.getElementById('midiInput');
    const outputSelect = document.getElementById('midiOutput');

    statusText.textContent = "Solicitando permissão MIDI...";
    statusDot.className = "status-dot";

    try {
        state.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
        logConsole("Acesso MIDI SysEx concedido.", "info");

        // Atualizar portas MIDI disponíveis
        updateMidiPorts();
        
        state.midiAccess.onstatechange = (e) => {
            logConsole(`Mudança no estado do dispositivo: ${e.port.name} está ${e.port.state}`, 'info');
            updateMidiPorts();
        };
    } catch (err) {
        logConsole(`Erro ao acessar dispositivos MIDI: ${err.message}`, 'error');
        statusText.textContent = "Permissão MIDI Negada/Erro";
    }
}

// Atualizar dropdowns com os dispositivos conectados
function updateMidiPorts() {
    const inputSelect = document.getElementById('midiInput');
    const outputSelect = document.getElementById('midiOutput');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    const prevInput = inputSelect.value;
    const prevOutput = outputSelect.value;

    inputSelect.innerHTML = '<option value="">Selecione entrada...</option>';
    outputSelect.innerHTML = '<option value="">Selecione saída...</option>';

    let me25Input = null;
    let me25Output = null;

    for (let input of state.midiAccess.inputs.values()) {
        const opt = document.createElement('option');
        opt.value = input.id;
        opt.textContent = input.name;
        inputSelect.appendChild(opt);
        if (input.name.includes('ME-25')) me25Input = input;
    }

    for (let output of state.midiAccess.outputs.values()) {
        const opt = document.createElement('option');
        opt.value = output.id;
        opt.textContent = output.name;
        outputSelect.appendChild(opt);
        if (output.name.includes('ME-25')) me25Output = output;
    }

    // Auto-selecionar o ME-25 se encontrado
    if (me25Input) {
        inputSelect.value = me25Input.id;
        selectMidiInput(me25Input.id);
    } else if (prevInput && state.midiAccess.inputs.get(prevInput)) {
        inputSelect.value = prevInput;
        selectMidiInput(prevInput);
    }

    if (me25Output) {
        outputSelect.value = me25Output.id;
        selectMidiOutput(me25Output.id);
    } else if (prevOutput && state.midiAccess.outputs.get(prevOutput)) {
        outputSelect.value = prevOutput;
        selectMidiOutput(prevOutput);
    }

    // Atualizar status visual
    if (state.midiInput && state.midiOutput) {
        statusDot.className = "status-dot connected";
        statusText.textContent = `Conectado ao ${state.midiOutput.name}`;
    } else {
        statusDot.className = "status-dot";
        statusText.textContent = "Dispositivo não selecionado";
    }

    inputSelect.onchange = (e) => selectMidiInput(e.target.value);
    outputSelect.onchange = (e) => selectMidiOutput(e.target.value);
}

// Configurar Entrada MIDI ativa
function selectMidiInput(id) {
    if (state.midiInput) {
        state.midiInput.onmidimessage = null;
    }
    if (!id) {
        state.midiInput = null;
        return;
    }
    state.midiInput = state.midiAccess.inputs.get(id);
    state.midiInput.onmidimessage = handleIncomingMidiMessage;
    logConsole(`Entrada ativa: ${state.midiInput.name}`, 'info');
}

// Configurar Saída MIDI ativa
function selectMidiOutput(id) {
    if (!id) {
        state.midiOutput = null;
        return;
    }
    state.midiOutput = state.midiAccess.outputs.get(id);
    logConsole(`Saída ativa: ${state.midiOutput.name}`, 'info');
}

// Ativar/Desativar modo Editor (Handshake SysEx)
function toggleEditorMode() {
    if (!state.midiOutput) {
        logConsole("Erro: Conecte um dispositivo MIDI primeiro!", "error");
        return;
    }

    const btn = document.getElementById('btnEditorOn');
    if (!state.isEditorModeOn) {
        // Enviar Editor Mode ON: F0 41 10 00 00 45 12 7F 00 00 01 01 [Checksum] F7
        sendRolandSysEx(0x12, [0x7F, 0x00, 0x00, 0x01], [0x01]);
        state.isEditorModeOn = true;
        btn.textContent = "🛑 Desativar Modo Editor";
        btn.classList.add('success');
        logConsole("Modo Editor ATIVADO (Sincronização em tempo real ativada). Tente mover os knobs na pedaleira física!", "info");
    } else {
        // Enviar Editor Mode OFF: F0 41 10 00 00 45 12 7F 00 00 01 00 [Checksum] F7
        sendRolandSysEx(0x12, [0x7F, 0x00, 0x00, 0x01], [0x00]);
        state.isEditorModeOn = false;
        btn.textContent = "🚀 Ativar Modo Editor";
        btn.classList.remove('success');
        logConsole("Modo Editor DESATIVADO.", "info");
    }
}

// Requisitar as configurações do patch ativo atual na pedaleira
function requestPatchFromPedal() {
    if (!state.midiOutput) {
        logConsole("Erro: Conecte um dispositivo MIDI primeiro!", "error");
        return;
    }
    logConsole("Solicitando dump de patch da pedaleira...", "info");
    // RQ1 (Request Data 1) Cmd: 0x11
    // Endereço do edit buffer: 20 00 00 00
    // Tamanho do dump: 00 00 01 0D (141 bytes)
    sendRolandSysEx(0x11, [0x20, 0x00, 0x00, 0x00], [0x00, 0x00, 0x01, 0x0D]);
}

// Enviar o patch atual completo na UI para o buffer ativo da pedaleira
function sendPatchToPedal() {
    if (!state.midiOutput) return;

    // Montar os 128 bytes de payload
    const payload = new Uint8Array(128);
    
    // Preencher os 48 parâmetros (96 bytes) em 16-bit BE
    for (let i = 0; i < 48; i++) {
        payload[2 * i] = 0x00;
        payload[2 * i + 1] = state.currentPatch.params[i] & 0x7F;
    }

    // Preencher o nome (32 bytes) em 16-bit BE
    const nameStr = state.currentPatch.name.padEnd(16, ' ');
    for (let i = 0; i < 16; i++) {
        payload[96 + 2 * i] = 0x00;
        payload[96 + 2 * i + 1] = nameStr.charCodeAt(i) & 0x7F;
    }

    // Enviar via DT1 (0x12) para o buffer de edição ativa (20 00 00 00)
    sendRolandSysEx(0x12, state.activeAddress, Array.from(payload));
}

// Enviar uma mensagem Roland SysEx customizada
function sendRolandSysEx(cmd, address, dataOrSize) {
    if (!state.midiOutput) return;

    // Header Roland para o ME-25 (Model ID = 00 00 45)
    const header = [0xF0, 0x41, 0x10, 0x00, 0x00, 0x45, cmd];
    const checksum = calculateRolandChecksum(address, dataOrSize);
    const msg = [...header, ...address, ...dataOrSize, checksum, 0xF7];

    state.midiOutput.send(msg);
    
    // Logar envio
    logMidiMessage(msg, 'sent');
}

// Calcular checksum da Roland (Soma(endereço + dados) % 128, depois 128 - resto)
function calculateRolandChecksum(address, dataOrSize) {
    let sum = 0;
    for (let b of address) sum += b;
    for (let b of dataOrSize) sum += b;
    return (128 - (sum % 128)) % 128;
}

// Tratar mensagens recebidas do dispositivo MIDI
function handleIncomingMidiMessage(event) {
    const data = event.data;
    
    // Ignorar Active Sensing (FE) para não poluir o console
    if (data[0] === 0xFE) return;

    logMidiMessage(data, 'received');

    // Verificar se é uma mensagem SysEx da Roland (F0 41 ...)
    if (data[0] === 0xF0 && data[1] === 0x41 && data.length >= 15) {
        const cmd = data[6];
        
        // DT1 (Data Transfer)
        if (cmd === 0x12) {
            // Verificar o endereço da mensagem
            const address = data.slice(7, 11);
            const addressHex = Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
            
            // O payload de dados começa após o comando e endereço (index 11)
            // O checksum e F7 ficam no final (exclui os últimos 2 bytes)
            const payload = data.slice(11, data.length - 2);

            // Se for um dump completo de patch (128 bytes de dados)
            if (payload.length === 128) {
                logConsole(`Recebeu dump de patch completo para o endereço: ${addressHex}`, 'info');
                
                // Extrair os 48 parâmetros
                const newParams = [];
                for (let i = 0; i < 96; i += 2) {
                    newParams.push(payload[i + 1]);
                }

                // Extrair o nome
                const nameBytes = [];
                for (let i = 96; i < 128; i += 2) {
                    nameBytes.push(payload[i + 1]);
                }
                const newName = String.fromCharCode(...nameBytes).trim();

                // Tratamento especial para Backup em andamento (slots 7F 00 XX 00)
                if (state.backupInProgress && addressHex.startsWith('7f00')) {
                    const slotIdx = address[2];
                    state.backupData[slotIdx] = {
                        params: newParams,
                        name: newName
                    };
                    if (backupTimeout) {
                        clearTimeout(backupTimeout);
                        backupTimeout = null;
                    }
                    continueBackupProcess();
                    return;
                }

                // Impedir re-envio em loop para a pedaleira ao carregar os dados recebidos
                state.isMutedMidiSend = true;
                loadPatchValues(newParams, newName);
                state.isMutedMidiSend = false;
            } else {
                // Modificação de parâmetro individual em tempo real
                // Se a pedaleira enviar uma alteração de knob física
                logConsole(`Recebeu alteração de knob no endereço: ${addressHex} (Tamanho: ${payload.length} bytes)`, 'info');
                
                // Se recebermos alteração no active buffer edit, podemos mapear ou solicitar redump
                // Geralmente o ME-25 envia o dump completo de 128 bytes ao trocar de preset.
            }
        }
    }
}

let lastSendTime = 0;
let throttleTimeout = null;
const SEND_THROTTLE_MS = 60; // Evita sobrecarga de MIDI SysEx no processador da pedaleira

// Envia os dados para a pedaleira de forma controlada para não engasgar o buffer MIDI
function sendPatchToPedalThrottled() {
    const now = Date.now();
    const elapsed = now - lastSendTime;

    if (elapsed >= SEND_THROTTLE_MS) {
        sendPatchToPedal();
        lastSendTime = now;
        if (throttleTimeout) {
            clearTimeout(throttleTimeout);
            throttleTimeout = null;
        }
    } else {
        if (throttleTimeout) clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            sendPatchToPedal();
            lastSendTime = Date.now();
            throttleTimeout = null;
        }, SEND_THROTTLE_MS - elapsed);
    }
}

// Atualizar o valor de um único parâmetro no patch
function updateParamValue(paramIdx, value) {
    state.currentPatch.params[paramIdx] = value;
    
    // Se o Modo DAW estiver ativo e o usuário alterar manualmente algum parâmetro, desativa o Modo DAW
    if (state.isDawModeActive) {
        state.isDawModeActive = false;
        setLiveGuitarAudio(false);
        const dawSwitch = document.getElementById('dawModeSwitch');
        if (dawSwitch) dawSwitch.checked = false;
        const statusEl = document.getElementById('dawModeStatus');
        if (statusEl) {
            statusEl.textContent = "Inativo";
            statusEl.className = "status-badge inactive";
        }
        const cardEl = document.getElementById('cardDawMode');
        if (cardEl) cardEl.classList.remove('active-mode');
        
        // Re-sincronizar as classes disabled nos cartões com base em seus estados reais
        document.querySelectorAll('.effects-grid .effect-card').forEach(card => {
            if (card.id !== 'cardDawMode') {
                const checkbox = card.querySelector('.switch-container input[type="checkbox"]');
                const isGlobalSwitch = card.id === 'cardGlobals'; // Não tem checkbox direto
                if (isGlobalSwitch) {
                    card.classList.remove('disabled');
                } else if (checkbox) {
                    if (checkbox.checked) card.classList.remove('disabled');
                    else card.classList.add('disabled');
                }
            }
        });
    }

    // Salvar sessão localmente
    saveSessionToLocalStorage();

    // Sincronizar nós correspondentes no Signal Flow
    updateSignalFlowUI();

    // Enviar atualização completa para a pedaleira se não estiver mutado
    // O ME-25 ignora atualizações de parâmetros individuais, exigindo o dump completo
    if (!state.isMutedMidiSend) {
        sendPatchToPedalThrottled();
    }

    // Atualizar sintetizador local do PC
    updateAudioSimParameters();
}

// Carregar um conjunto de parâmetros e nome para a interface gráfica
function loadPatchValues(paramsArray, name) {
    if (isLibraryMode) {
        if (window.electronAPI && window.electronAPI.selectPatch) {
            window.electronAPI.selectPatch({ params: paramsArray, name: name });
        }
        return;
    }
    state.currentPatch.params = [...paramsArray];
    state.currentPatch.name = name;

    const nameInput = document.getElementById('patchNameInput');
    if (nameInput) nameInput.value = name;

    // Atualizar cada controle da UI
    Object.keys(PARAM_MAP).forEach(key => {
        const config = PARAM_MAP[key];
        const el = document.getElementById(key);
        if (!el) return;

        const val = state.currentPatch.params[config.paramIdx];

        if (config.type === "range" || config.type === "select") {
            el.value = val;
            const valEl = document.getElementById(`${key}Val`);
            if (valEl) valEl.textContent = val;
        } else if (config.type === "switch") {
            el.checked = (val === 1);
            
            // Sincronizar classes css de disabled (exceto switches globais)
            const card = el.closest('.effect-card');
            const isGlobalSwitch = key === 'soloSwitch' || key === 'superStack';
            if (card && !isGlobalSwitch) {
                if (val === 1) card.classList.remove('disabled');
                else card.classList.add('disabled');
            }
        }
    });

    // Atualizar controle composto de Delay Time
    // delayTime = (MSB * 128) + LSB
    const msb = state.currentPatch.params[18];
    const lsb = state.currentPatch.params[19];
    const timeMs = (msb * 128) + lsb;

    const delayTimeEl = document.getElementById('delayTimeCombined');
    if (delayTimeEl) {
        delayTimeEl.value = timeMs;
        document.getElementById('delayTimeCombinedVal').textContent = `${timeMs} ms`;
    }

    // Verificar se é o preset de DAW Out para sincronizar o Switch do Cartão DAW
    const isDAWOutPreset = state.currentPatch.params[0] === 0 && 
                           state.currentPatch.params[5] === 0 && 
                           state.currentPatch.params[10] === 0 && 
                           state.currentPatch.params[16] === 0 && 
                           state.currentPatch.params[22] === 0 && 
                           state.currentPatch.params[43] === 0;

    const dawSwitch = document.getElementById('dawModeSwitch');
    const statusEl = document.getElementById('dawModeStatus');
    const cardEl = document.getElementById('cardDawMode');
    
    if (isDAWOutPreset) {
        state.isDawModeActive = true;
        if (dawSwitch) dawSwitch.checked = true;
        if (statusEl) {
            statusEl.textContent = "Ativo";
            statusEl.className = "status-badge active";
        }
        if (cardEl) cardEl.classList.add('active-mode');
        
        // Esmaecer todos os outros cartões
        document.querySelectorAll('.effects-grid .effect-card').forEach(card => {
            if (card.id !== 'cardDawMode') {
                card.classList.add('disabled');
            }
        });
    } else {
        state.isDawModeActive = false;
        setLiveGuitarAudio(false);
        if (dawSwitch) dawSwitch.checked = false;
        if (statusEl) {
            statusEl.textContent = "Inativo";
            statusEl.className = "status-badge inactive";
        }
        if (cardEl) cardEl.classList.remove('active-mode');
    }

    // Sincronizar nós correspondentes no Signal Flow
    updateSignalFlowUI();

    // Salvar sessão localmente
    saveSessionToLocalStorage();

    // Resetar o status do badge para Temporário/Modo Audição
    resetPatchStatusBadge();

    // Atualizar sintetizador local do PC
    updateAudioSimParameters();
}

// Imprimir informações básicas na janela do terminal/console
function logConsole(message, type = 'info') {
    const consoleLog = document.getElementById('consoleLog');
    const line = document.createElement('div');
    line.className = 'log-line';

    const timeStr = new Date().toLocaleTimeString();
    line.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-type ${type}">${type.toUpperCase()}</span>
        <span class="log-text">${message}</span>
    `;

    consoleLog.appendChild(line);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

// Formatar e logar mensagens MIDI em linguagem leiga para novos usuários, mantendo detalhes hexadecimais sob demanda
function logMidiMessage(data, direction) {
    const consoleLog = document.getElementById('consoleLog');
    if (!consoleLog) return;

    const line = document.createElement('div');
    line.className = 'log-line';
    const timeStr = new Date().toLocaleTimeString();

    // Interpretar mensagem MIDI para linguagem amigável
    const friendlyDescription = interpretMidiMessage(data, direction);
    if (!friendlyDescription) return; // ignora mensagens MIDI irrelevantes/ruídos

    // Converter dados para vetor de strings hex
    const hexArr = Array.from(data).map(b => b.toString(16).padStart(2, '0').toUpperCase());
    
    let formattedHex = '';

    // Se tivermos uma mensagem anterior da mesma direção e mesmo tamanho, podemos calcular o DIFF!
    if (state.lastReceivedMessage && state.lastReceivedMessage.direction === direction && state.lastReceivedMessage.data.length === data.length) {
        const prevData = state.lastReceivedMessage.data;
        for (let i = 0; i < data.length; i++) {
            if (data[i] !== prevData[i]) {
                formattedHex += `<span class="diff-highlight">${hexArr[i]}</span> `;
            } else {
                formattedHex += `${hexArr[i]} `;
            }
        }
    } else {
        formattedHex = hexArr.join(' ');
    }

    // Salvar estado da última mensagem
    state.lastReceivedMessage = {
        direction,
        data: new Uint8Array(data)
    };

    line.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-type ${direction}">${direction === 'sent' ? 'ENVIADO' : 'RECEBIDO'}</span>
        <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1;">
            <span class="log-text" style="font-weight: 600;">${friendlyDescription}</span>
            <details style="font-size: 0.65rem; color: var(--text-muted); cursor: pointer; margin-top: 2px; outline: none;">
                <summary>Ver detalhes técnicos (MIDI SysEx)</summary>
                <code style="display: block; background: rgba(0,0,0,0.25); padding: 4px; border-radius: 4px; margin-top: 3px; word-break: break-all; font-family: monospace;">${formattedHex} (${data.length} bytes)</code>
            </details>
        </div>
    `;

    consoleLog.appendChild(line);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

// Mapeamento de nomes de parâmetros para o log em português amigável
const PARAM_NAMES_PT = {
    0: "Compressor/FX (Liga/Desliga)",
    1: "Compressor/FX (Tipo de Efeito)",
    2: "Compressor/FX (Sustain/Sensibilidade)",
    3: "Compressor/FX (Attack/Tone)",
    4: "Compressor/FX (Volume)",
    5: "Distorção (Liga/Desliga)",
    6: "Distorção (Tipo de Distorção)",
    7: "Distorção (Drive/Ganho)",
    8: "Distorção (Tone/Brilho)",
    9: "Distorção (Volume)",
    10: "Modulação (Liga/Desliga)",
    11: "Modulação (Tipo de Modulação)",
    12: "Modulação (Rate/Chave)",
    13: "Modulação (Depth/Harmonia)",
    14: "Modulação (Volume)",
    15: "Modulação (Ressonância)",
    16: "Delay (Liga/Desliga)",
    17: "Delay (Tipo de Delay)",
    18: "Delay Tempo (Parte Alta)",
    19: "Delay Tempo (Parte Baixa)",
    20: "Delay (Feedback/Repetições)",
    21: "Delay (Volume)",
    22: "Preamp COSM (Liga/Desliga)",
    23: "Preamp COSM (Modelo de Amplificador)",
    24: "Preamp COSM (Ganho)",
    25: "Preamp COSM (Graves)",
    26: "Preamp COSM (Médios)",
    27: "Preamp COSM (Agudos)",
    28: "Preamp COSM (Presença)",
    29: "Preamp COSM (Volume)",
    30: "Solo Boost (Liga/Desliga)",
    31: "Noise Gate (Limiar do Supressor)",
    32: "Pedal de Expressão (Modo/Tipo)",
    35: "Volume Geral (Master)",
    37: "Super Stack (Liga/Desliga)",
    41: "Reverb (Decay/Duração)",
    42: "Reverb (Tipo de Reverb)",
    43: "Reverb (Volume)"
};

// Helper para traduzir mensagens de sistema Roland SysEx para português compreensível
function interpretMidiMessage(data, direction) {
    if (data[0] === 0xF0 && data[1] === 0x41 && data.length >= 15) {
        const cmd = data[6];
        const address = data.slice(7, 11);
        const addressHex = Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');

        if (cmd === 0x11) {
            // Leitura (RQ1)
            if (addressHex === '20000000') {
                return 'Solicitando os parâmetros do timbre ativo atual na pedaleira...';
            } else if (addressHex.startsWith('7f00')) {
                const slotIdx = address[2];
                const bank = Math.floor(slotIdx / 3) + 1;
                const patchNum = (slotIdx % 3) + 1;
                const bankStr = bank.toString().padStart(2, '0');
                return `Solicitando dados do Preset do usuário U${bankStr}-${patchNum}...`;
            }
            return `Lendo dados de memória da pedaleira (Endereço: 0x${addressHex.toUpperCase()})`;
        } else if (cmd === 0x12) {
            // Escrita (DT1)
            const payload = data.slice(11, data.length - 2);
            if (payload.length === 128) {
                // Dump completo de preset (128 bytes de payload)
                const nameBytes = [];
                for (let i = 96; i < 128; i += 2) {
                    nameBytes.push(payload[i + 1]);
                }
                const patchName = String.fromCharCode(...nameBytes).trim() || "Sem Nome";

                if (addressHex === '20000000') {
                    return `Carregando configurações do timbre "${patchName}" temporariamente na pedaleira.`;
                } else if (addressHex.startsWith('7f00')) {
                    const slotIdx = address[2];
                    const bank = Math.floor(slotIdx / 3) + 1;
                    const patchNum = (slotIdx % 3) + 1;
                    const bankStr = bank.toString().padStart(2, '0');
                    return `Gravando o timbre "${patchName}" na memória permanente U${bankStr}-${patchNum} da pedaleira.`;
                }
                return `Enviando bloco do timbre "${patchName}" (Endereço: 0x${addressHex.toUpperCase()})`;
            } else if (payload.length === 2 && addressHex.startsWith('200000')) {
                const offsetHex = addressHex.substring(6);
                const offset = parseInt(offsetHex, 16);
                if (!isNaN(offset) && offset % 2 === 0) {
                    const paramIdx = offset / 2;
                    const val = payload[1];
                    const paramName = PARAM_NAMES_PT[paramIdx] || `Parâmetro #${paramIdx}`;
                    return `Ajustando ${paramName} para o valor: ${val}`;
                }
            } else if (addressHex === '7f000001') {
                const val = payload[0];
                return val === 0x01 ? 'Ativando o Modo Editor (Sincronização em tempo real)' : 'Desativando o Modo Editor';
            }
            return `Enviando bloco de dados (Endereço: 0x${addressHex.toUpperCase()}, ${payload.length} bytes)`;
        }
    }
    return null;
}

// Biblioteca de Patches Customizados Salvos Localmente (LocalStorage)
function saveCurrentPatchLocally() {
    const name = state.currentPatch.name.trim();
    if (!name) {
        alert("Dê um nome ao patch antes de salvar!");
        return;
    }

    const customPatches = JSON.parse(localStorage.getItem('me25_custom_patches') || '[]');
    
    // Verificar se já existe um com o mesmo nome para substituir
    const existingIdx = customPatches.findIndex(p => p.name === name);
    const newPatchData = {
        name,
        params: [...state.currentPatch.params]
    };

    if (existingIdx !== -1) {
        customPatches[existingIdx] = newPatchData;
        logConsole(`Patch local atualizado: ${name}`, 'info');
    } else {
        customPatches.push(newPatchData);
        logConsole(`Novo patch local salvo: ${name}`, 'info');
    }

    localStorage.setItem('me25_custom_patches', JSON.stringify(customPatches));
    loadCustomPatchesList();
}

function loadCustomPatchesList() {
    const listContainer = document.getElementById('customPatchesList');
    listContainer.innerHTML = '';

    const customPatches = JSON.parse(localStorage.getItem('me25_custom_patches') || '[]');
    
    if (customPatches.length === 0) {
        listContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px;">Nenhum patch salvo.</div>';
        return;
    }

    customPatches.forEach((patch, idx) => {
        const item = document.createElement('div');
        item.className = 'patch-item';
        item.innerHTML = `
            <span class="patch-name">${patch.name}</span>
            <span class="patch-addr" style="color: var(--danger-color); cursor: pointer;" title="Excluir">✖</span>
        `;
        
        // Clique no nome carrega o patch
        item.querySelector('.patch-name').addEventListener('click', () => {
            document.querySelectorAll('.patch-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            loadPatchValues(patch.params, patch.name);
            sendPatchToPedal();
            logConsole(`Carregou patch local: ${patch.name}`, 'info');
        });

        // Clique no X exclui o patch
        item.querySelector('.patch-addr').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Excluir o patch "${patch.name}"?`)) {
                customPatches.splice(idx, 1);
                localStorage.setItem('me25_custom_patches', JSON.stringify(customPatches));
                loadCustomPatchesList();
                logConsole(`Patch local excluído: ${patch.name}`, 'info');
            }
        });

        listContainer.appendChild(item);
    });
}

// Importar arquivo .SYX
function importSyxFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.syx';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const buffer = new Uint8Array(evt.target.result);
            
            // Validar tamanho e cabeçalho do arquivo SysEx (141 bytes)
            if (buffer.length !== 141) {
                alert(`Erro: Tamanho de arquivo inválido (${buffer.length} bytes). Um patch do ME-25 precisa ter exatamente 141 bytes.`);
                return;
            }

            if (buffer[0] !== 0xF0 || buffer[1] !== 0x41 || buffer[2] !== 0x10) {
                alert("Erro: Este arquivo não possui os cabeçalhos MIDI SysEx corretos da BOSS/Roland.");
                return;
            }

            // Extrair endereço de memória contido no arquivo
            const address = buffer.slice(7, 11);
            const addressHex = Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('');
            logConsole(`Importando arquivo .syx com endereço original: ${addressHex}`, 'info');

            // Extrair os 48 parâmetros
            const payload = buffer.slice(11, 139);
            const newParams = [];
            for (let i = 0; i < 96; i += 2) {
                newParams.push(payload[i + 1]);
            }

            // Extrair o nome
            const nameBytes = [];
            for (let i = 96; i < 128; i += 2) {
                nameBytes.push(payload[i + 1]);
            }
            const newName = String.fromCharCode(...nameBytes).trim();

            loadPatchValues(newParams, newName);
            sendPatchToPedal();
            logConsole(`Patch importado com sucesso: ${newName}`, 'info');
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

// Exportar arquivo .SYX
function exportSyxFile() {
    const payload = new Uint8Array(128);
    
    // Preencher os 48 parâmetros
    for (let i = 0; i < 48; i++) {
        payload[2 * i] = 0x00;
        payload[2 * i + 1] = state.currentPatch.params[i] & 0x7F;
    }

    // Preencher o nome
    const nameStr = state.currentPatch.name.padEnd(16, ' ');
    for (let i = 0; i < 16; i++) {
        payload[96 + 2 * i] = 0x00;
        payload[96 + 2 * i + 1] = nameStr.charCodeAt(i) & 0x7F;
    }

    // Definir cabeçalho e endereço ativo (20 00 00 00)
    const header = [0xF0, 0x41, 0x10, 0x00, 0x00, 0x45, 0x12];
    const address = [0x20, 0x00, 0x00, 0x00];
    const checksum = calculateRolandChecksum(address, Array.from(payload));
    
    const fileContent = new Uint8Array([...header, ...address, ...payload, checksum, 0xF7]);

    // Criar download do arquivo blob
    const blob = new Blob([fileContent], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentPatch.name.replace(/[^a-zA-Z0-9]/g, '_')}.syx`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logConsole(`Patch exportado como arquivo .syx: ${state.currentPatch.name}.syx`, 'info');
}

// Inicializar a lista de slots para salvamento na pedaleira
function initSlotSelect() {
    const select = document.getElementById('saveSlotSelect');
    if (!select) return;
    select.innerHTML = '';
    
    // U01-1 a U10-3 (Slots 1 a 30)
    for (let bank = 1; bank <= 10; bank++) {
        for (let patch = 1; patch <= 3; patch++) {
            const idx = (bank - 1) * 3 + (patch - 1);
            const opt = document.createElement('option');
            opt.value = idx;
            // Formatar com zeros à esquerda
            const bankStr = bank.toString().padStart(2, '0');
            opt.textContent = `User U${bankStr}-${patch} (Slot ${idx + 1})`;
            select.appendChild(opt);
        }
    }
}

// Gravar o patch atual diretamente em um slot de usuário da pedaleira
function writePatchToSlot() {
    if (!state.midiOutput) {
        logConsole("Erro: Conecte um dispositivo MIDI primeiro!", "error");
        alert("Erro: Conecte um dispositivo MIDI primeiro!");
        return;
    }

    const select = document.getElementById('saveSlotSelect');
    if (!select) return;

    const slotIdx = parseInt(select.value, 10);
    if (isNaN(slotIdx) || slotIdx < 0 || slotIdx >= 30) {
        logConsole("Erro: Slot de usuário inválido.", "error");
        return;
    }

    const slotName = select.options[select.selectedIndex].text;
    if (!confirm(`Confirmar gravação no slot ${slotName}? Isso irá sobrescrever o som atual correspondente na pedaleira.`)) {
        return;
    }

    // Endereço do slot: 7f 00 [slotIdx] 00
    const targetAddress = [0x7F, 0x00, slotIdx, 0x00];

    // Montar os 128 bytes de payload
    const payload = new Uint8Array(128);
    for (let i = 0; i < 48; i++) {
        payload[2 * i] = 0x00;
        payload[2 * i + 1] = state.currentPatch.params[i] & 0x7F;
    }
    const nameStr = state.currentPatch.name.padEnd(16, ' ');
    for (let i = 0; i < 16; i++) {
        payload[96 + 2 * i] = 0x00;
        payload[96 + 2 * i + 1] = nameStr.charCodeAt(i) & 0x7F;
    }

    // Enviar mensagem de transferência de dados (DT1) para o endereço do slot
    sendRolandSysEx(0x12, targetAddress, Array.from(payload));
    logConsole(`GRAVAÇÃO: Patch gravado com sucesso no slot ${slotName}!`, 'info');
    
    const badge = document.getElementById('patchStatusBadge');
    if (badge) {
        badge.textContent = `💾 Salvo: ${slotName.replace('User ', '').split(' (Slot')[0]}`;
        badge.style.color = 'var(--success-color)';
    }

    alert(`Sucesso: Patch gravado na pedaleira no slot ${slotName}!`);

    // Enviar também para o edit buffer para carregar o som modificado imediatamente
    sendPatchToPedal();
}

// ==========================================
// RECURSO 1: CONTROLE DE KNOBS ROTATIVOS DE ESTILO BOSS
// ==========================================
function initializeKnobs() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        // Pular o Delay Time grande (1-6000 ms), manter como slider para melhor usabilidade
        if (input.id === 'delayTimeCombined') return;

        // Pular faders de volume de backing track/stems, o master volume do player e a barra de progresso da música
        if (input.id === 'backingVolume' || 
            input.id === 'backingProgressBar' ||
            input.classList.contains('stem-volume-slider') || 
            input.classList.contains('bp3-volume-slider')) {
            return;
        }

        // Ocultar slider padrão
        input.style.display = 'none';

        // Criar contêiner do knob
        const knobControl = document.createElement('div');
        knobControl.className = 'knob-control';
        knobControl.dataset.target = input.id;

        const knobDial = document.createElement('div');
        knobDial.className = 'knob-dial';

        const knobPointer = document.createElement('div');
        knobPointer.className = 'knob-pointer';

        knobDial.appendChild(knobPointer);
        knobControl.appendChild(knobDial);

        // Inserir após o input ocultado
        input.parentNode.insertBefore(knobControl, input.nextSibling);

        // Atualizar rotação com base no valor atual do input
        const updateKnobRotation = () => {
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            const val = parseFloat(input.value) || 0;
            const percent = (val - min) / (max - min);
            const angle = -135 + percent * 270; // -135deg (min) a +135deg (max)
            knobDial.style.transform = `rotate(${angle}deg)`;
        };

        updateKnobRotation();

        // Escutar alterações de valor para manter sincronizado (ao carregar patches externos)
        input.addEventListener('input', updateKnobRotation);
        input.addEventListener('change', updateKnobRotation);

        // Lógica de arrasto do mouse
        let isDragging = false;
        let startY = 0;
        let startVal = 0;
        const sensitivity = 0.55;

        knobDial.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startVal = parseFloat(input.value) || 0;
            document.body.classList.add('knob-dragging');

            const handleMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const deltaY = startY - moveEvent.clientY;
                const min = parseFloat(input.min) || 0;
                const max = parseFloat(input.max) || 100;
                const range = max - min;

                // 150px de arrasto vertical cobre todo o alcance
                const deltaVal = (deltaY / 150) * range * sensitivity;
                let newVal = startVal + deltaVal;
                newVal = Math.max(min, Math.min(max, newVal));

                if (input.step === '1' || !input.step) {
                    newVal = Math.round(newVal);
                }

                input.value = newVal;
                // Disparar eventos para a sincronização reativa nativa do app.js
                input.dispatchEvent(new Event('input'));
                input.dispatchEvent(new Event('change'));
            };

            const handleMouseUp = () => {
                isDragging = false;
                document.body.classList.remove('knob-dragging');
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        });

        // Suporte a toque/mobile
        knobDial.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            isDragging = true;
            startY = e.touches[0].clientY;
            startVal = parseFloat(input.value) || 0;

            const handleTouchMove = (moveEvent) => {
                if (!isDragging || moveEvent.touches.length !== 1) return;
                const deltaY = startY - moveEvent.touches[0].clientY;
                const min = parseFloat(input.min) || 0;
                const max = parseFloat(input.max) || 100;
                const range = max - min;
                const deltaVal = (deltaY / 150) * range * sensitivity;
                let newVal = startVal + deltaVal;
                newVal = Math.max(min, Math.min(max, newVal));

                if (input.step === '1' || !input.step) newVal = Math.round(newVal);

                input.value = newVal;
                input.dispatchEvent(new Event('input'));
                input.dispatchEvent(new Event('change'));
                moveEvent.preventDefault();
            };

            const handleTouchEnd = () => {
                isDragging = false;
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
            };

            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
        });
    });
}

// ==========================================
// RECURSO 2: CONTROLE E EVENTOS DO SIGNAL FLOW
// ==========================================
function initSignalFlowEvents() {
    document.querySelectorAll('.flow-node[data-card]').forEach(node => {
        node.addEventListener('click', () => {
            const cardId = node.dataset.card;
            const card = document.getElementById(cardId);
            if (card) {
                // Ativar a aba do Pedalboard se ela não estiver ativa
                const effectsViewTab = document.getElementById('effectsView');
                if (effectsViewTab && !effectsViewTab.classList.contains('active')) {
                    const tabBtn = document.querySelector('.main-tab-btn[data-main-tab="effectsView"]');
                    if (tabBtn) {
                        tabBtn.click();
                    }
                }
                setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('flash-highlight');
                    setTimeout(() => card.classList.remove('flash-highlight'), 1000);
                }, 50);
            }
        });
    });
}

function updateSignalFlowUI() {
    const syncNode = (switchId, nodeId) => {
        const sw = document.getElementById(switchId);
        const node = document.getElementById(nodeId);
        if (sw && node) {
            if (sw.checked) node.classList.add('active');
            else node.classList.remove('active');
        }
    };

    syncNode('compSwitch', 'flowComp');
    syncNode('oddsSwitch', 'flowOdds');
    syncNode('preSwitch', 'flowPreamp');
    syncNode('modSwitch', 'flowModulation');
    syncNode('delaySwitch', 'flowDelay');

    // O Reverb é ativado se o seu slider de volume for maior que 0
    const revLevelInput = document.getElementById('reverbLevel');
    const revNode = document.getElementById('flowReverb');
    if (revLevelInput && revNode) {
        const val = parseInt(revLevelInput.value, 10) || 0;
        if (val > 0) revNode.classList.add('active');
        else revNode.classList.remove('active');
    }
}

// ==========================================
// RECURSO 3: TIMBRES CLÁSSICOS (CLOUD PRESETS)
// ==========================================
const CLOUD_PRESETS = [
    {
        name: "Gilmour Lead",
        description: "Pink Floyd - Comfortably Numb Solo Tone",
        params: [
            1, 0, 45, 60, 80, // COMP: ON, COMP, Sustain=45, Attack=60, Level=80
            1, 7, 78, 48, 55, // OD/DS: ON, METAL, Drive=78, Tone=48, Level=55
            1, 1, 35, 45, 40, 55, // MODULATION: ON, FLANGER, Rate=35, Depth=45, Level=40, Res=55
            1, 1, 2, 94, 45, 110, // DELAY: ON, TimeMSB=2, TimeLSB=94 (approx 350ms), FB=45, Level=110
            1, 1, 60, 50, 45, 55, 50, 60, // PREAMP: ON, TWIN, Gain=60, Bass=50, Mid=45, Treble=55, Pres=50, Level=60
            0, 10, 0, 0, 0, 99, 90, 0, 1, 50, 10, 45, 1, 45, 0, 4, 0, 0
        ]
    },
    {
        name: "Slash Sweet Child",
        description: "Guns N' Roses - Warm Neck PickUp Solo",
        params: [
            0, 0, 40, 50, 50, // COMP: OFF
            1, 4, 62, 52, 60, // OD/DS: ON, DIST, Drive=62, Tone=52, Level=60
            0, 0, 40, 50, 50, 55, // MODULATION: OFF
            1, 1, 2, 22, 40, 80, // DELAY: ON, TimeMSB=2, TimeLSB=22 (approx 278ms), FB=40, Level=80
            1, 5, 70, 55, 65, 60, 48, 65, // PREAMP: ON, DRIVE, Gain=70, Bass=55, Mid=65, Treble=60, Pres=48, Level=65
            0, 8, 0, 0, 0, 99, 90, 0, 1, 50, 10, 35, 1, 35, 0, 4, 0, 0
        ]
    },
    {
        name: "Jimi Purple Haze",
        description: "Jimi Hendrix - Fuzz & Octave Classic Vibe",
        params: [
            1, 1, 30, 40, 60, // COMP/FX: ON, T.WAH UP, Sens=30, Tone=40, Level=60
            1, 9, 85, 30, 65, // OD/DS: ON, FUZZ, Drive=85, Tone=30, Level=65
            0, 0, 40, 50, 50, 55, // MODULATION: OFF
            0, 1, 1, 110, 30, 0, // DELAY: OFF
            1, 2, 50, 60, 50, 70, 60, 55, // PREAMP: ON, TWEED, Gain=50, Bass=60, Mid=50, Treble=70, Pres=60, Level=55
            0, 5, 0, 0, 0, 99, 90, 0, 1, 50, 10, 20, 0, 0, 0, 4, 0, 0
        ]
    },
    {
        name: "Hetfield Metal",
        description: "Metallica - Heavy scooped metal riffing",
        params: [
            0, 0, 40, 50, 50, // COMP: OFF
            1, 6, 88, 35, 65, // OD/DS: ON, MODERN, Drive=88, Tone=35, Level=65
            0, 0, 40, 50, 50, 55, // MODULATION: OFF
            0, 1, 1, 110, 30, 0, // DELAY: OFF
            1, 7, 75, 70, 25, 80, 65, 60, // PREAMP: ON, METAL, Gain=75, Bass=70, Mid=25 (Scooped!), Treble=80, Pres=65, Level=60
            0, 12, 0, 0, 0, 99, 90, 0, 1, 50, 10, 25, 0, 0, 0, 4, 0, 0
        ]
    },
    {
        name: "Vai Love of God",
        description: "Steve Vai - Fluid High Gain Lead with Reverb",
        params: [
            1, 0, 50, 55, 75, // COMP/FX: ON, COMP, Sustain=50, Attack=55, Level=75
            1, 6, 70, 50, 60, // OD/DS: ON, MODERN, Drive=70, Tone=50, Level=60
            0, 0, 40, 50, 50, 55, // MODULATION: OFF
            1, 1, 3, 26, 48, 95, // DELAY: ON, Time=approx 410ms, FB=48, Level=95
            1, 8, 80, 55, 60, 65, 50, 60, // PREAMP: ON, LEAD, Gain=80, Bass=55, Mid=60, Treble=65, Pres=50, Level=60
            0, 10, 0, 0, 0, 99, 90, 0, 1, 50, 10, 55, 1, 50, 0, 4, 0, 0
        ]
    },
    {
        name: "Angus Back In Black",
        description: "AC/DC - Pure High Voltage Crunch",
        params: [
            0, 0, 40, 50, 50, // COMP: OFF
            0, 0, 50, 50, 50, // OD/DS: OFF
            0, 0, 40, 50, 50, 55, // MODULATION: OFF
            0, 1, 1, 110, 30, 0, // DELAY: OFF
            1, 5, 58, 62, 70, 75, 50, 65, // PREAMP: ON, DRIVE, Gain=58, Bass=62, Mid=70, Treble=75, Pres=50, Level=65
            0, 6, 0, 0, 0, 99, 90, 0, 1, 50, 10, 30, 0, 0, 0, 4, 0, 0
        ]
    },
    {
        name: "The Edge Dotted 8th",
        description: "U2 - Signature rhythmic delay clean",
        params: [
            1, 0, 55, 45, 75, // COMP/FX: ON, COMP, Sustain=55, Attack=45, Level=75
            0, 0, 50, 50, 50, // OD/DS: OFF
            1, 0, 12, 60, 45, 55, // MODULATION: ON, CHORUS, Rate=12, Depth=60, Level=45, Res=55
            1, 1, 2, 94, 52, 105, // DELAY: ON, Time=approx 350ms (dotted eighth), FB=52, Level=105
            1, 0, 40, 50, 60, 65, 55, 60, // PREAMP: ON, CLEAN, Gain=40, Bass=50, Mid=60, Treble=65, Pres=55, Level=60
            0, 5, 0, 0, 0, 99, 90, 0, 1, 50, 10, 40, 0, 0, 0, 4, 0, 0
        ]
    },
    {
        name: "EVH Brown Sound",
        description: "Van Halen - Classic Eruption Lead Tone",
        params: [
            0, 0, 40, 50, 50, // COMP: OFF
            1, 1, 30, 50, 50, // OD/DS: ON, OD-1 (as boost), Drive=30, Tone=50, Level=50
            1, 2, 8, 70, 50, 55, // MODULATION: ON, PHASER, Rate=8, Depth=70, Level=50, Res=55
            1, 1, 1, 56, 32, 70, // DELAY: ON, Slapback (approx 184ms), FB=32, Level=70
            1, 5, 82, 55, 50, 75, 60, 60, // PREAMP: ON, DRIVE, Gain=82, Bass=55, Mid=50, Treble=75, Pres=60, Level=60
            0, 8, 0, 0, 0, 99, 90, 0, 1, 50, 10, 50, 1, 50, 0, 4, 0, 0
        ]
    },
    {
        name: "Clapton Woman Tone",
        description: "Cream - Warm cream distortion",
        params: [
            0, 0, 40, 50, 50, // COMP: OFF
            1, 3, 60, 5, 55, // OD/DS: ON, BLUES, Drive=60, Tone=5 (Rolled off!), Level=55
            0, 0, 40, 50, 50, 55, // MODULATION: OFF
            0, 1, 1, 110, 30, 0, // DELAY: OFF
            1, 3, 55, 65, 75, 45, 30, 60, // PREAMP: ON, CRUNCH, Gain=55, Bass=65, Mid=75, Treble=45, Pres=30, Level=60
            0, 6, 0, 0, 0, 99, 90, 0, 1, 50, 10, 35, 0, 0, 0, 4, 0, 0
        ]
    },
    {
        name: "Satriani Surfing",
        description: "Joe Satriani - Shred liquid lead tone",
        params: [
            1, 0, 40, 50, 70, // COMP/FX: ON, COMP
            1, 2, 75, 48, 55, // OD/DS: ON, T-SCREAM, Drive=75, Tone=48, Level=55
            1, 0, 15, 40, 35, 55, // MODULATION: ON, CHORUS, Rate=15, Depth=40, Level=35
            1, 1, 2, 122, 45, 90, // DELAY: ON, Time=approx 378ms, FB=45, Level=90
            1, 8, 85, 50, 62, 70, 55, 60, // PREAMP: ON, LEAD, Gain=85, Bass=50, Mid=62, Treble=70, Pres=55, Level=60
            0, 10, 0, 0, 0, 99, 90, 0, 1, 50, 10, 40, 1, 45, 0, 4, 0, 0
        ]
    }
];

function initCloudPresetsList() {
    const container = document.getElementById('cloudPatchesList');
    if (!container) return;
    container.innerHTML = '';

    CLOUD_PRESETS.forEach((preset, idx) => {
        const item = document.createElement('div');
        item.className = 'patch-item';
        item.dataset.index = idx;
        item.patchParams = preset.params;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'patch-name';
        nameSpan.textContent = preset.name;
        nameSpan.title = preset.description;

        const descSpan = document.createElement('span');
        descSpan.className = 'patch-addr';
        descSpan.textContent = preset.description.split(' - ')[0]; // descrição curta

        item.appendChild(nameSpan);
        item.appendChild(descSpan);

        item.addEventListener('click', () => {
            document.querySelectorAll('#cloudPatchesList .patch-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            logConsole(`Carregando Cloud Preset: ${preset.name} (${preset.description})`, 'info');
            loadPatchValues(preset.params, preset.name);

            // Sincronizar com a pedaleira
            sendPatchToPedal();
        });

        container.appendChild(item);
    });
}

// ==========================================
// RECURSO 4: PERSISTÊNCIA E AUTOSAVE DE SESSÃO
// ==========================================
function saveSessionToLocalStorage() {
    try {
        localStorage.setItem('boss_me25_session_patch', JSON.stringify(state.currentPatch));
    } catch (e) {
        console.error("Erro ao salvar sessão localmente", e);
    }
}

function loadSessionFromLocalStorage() {
    try {
        const saved = localStorage.getItem('boss_me25_session_patch');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.params && parsed.name) {
                logConsole("Sessão anterior restaurada automaticamente!", "info");
                loadPatchValues(parsed.params, parsed.name);
            }
        }
    } catch (e) {
        console.error("Erro ao carregar sessão anterior", e);
    }
}

// ==========================================
// RECURSO 5: LIBRARIAN TOTAL (BACKUP & RESTORE DE 60 SLOTS)
// ==========================================
let backupTimeout = null;

function initLibrarianEvents() {
    const btnBackup = document.getElementById('btnBackupAll');
    const btnRestore = document.getElementById('btnRestoreAll');

    if (btnBackup) btnBackup.addEventListener('click', backupAllPatches);
    if (btnRestore) btnRestore.addEventListener('click', restoreAllPatches);
}

function backupAllPatches() {
    if (!state.midiOutput) {
        logConsole("Erro: Conecte um dispositivo MIDI primeiro!", "error");
        alert("Erro: Conecte um dispositivo MIDI primeiro!");
        return;
    }

    if (state.backupInProgress || state.restoreInProgress) return;

    if (!confirm("Confirmar Backup Total? O editor irá ler os 60 slots de usuário (U01-1 a U20-3) da sua pedaleira BOSS ME-25 sequencialmente. Isso levará cerca de 15 a 20 segundos.")) {
        return;
    }

    logConsole("Iniciando Backup de 60 slots da pedaleira...", "info");
    state.backupInProgress = true;
    state.backupCurrentSlot = 0;
    state.backupData = Array(60).fill(null);

    const statusEl = document.getElementById('backupStatus');
    if (statusEl) statusEl.textContent = "Lendo: U01-1 (1/60)";

    requestSlotFromPedal(0);
}

function requestSlotFromPedal(slotIdx) {
    if (!state.backupInProgress) return;

    // Endereço de slot: 7f 00 [slotIdx] 00
    // Tamanho do dump: 00 00 01 0D (141 bytes)
    sendRolandSysEx(0x11, [0x7F, 0x00, slotIdx, 0x00], [0x00, 0x00, 0x01, 0x0D]);

    // Timeout para retry se a pedaleira engasgar
    if (backupTimeout) clearTimeout(backupTimeout);
    backupTimeout = setTimeout(() => {
        logConsole(`Timeout ao ler slot ${slotIdx + 1}. Tentando novamente...`, 'warn');
        requestSlotFromPedal(slotIdx);
    }, 450);
}

function continueBackupProcess() {
    if (!state.backupInProgress) return;

    const nextSlot = state.backupCurrentSlot + 1;
    const statusEl = document.getElementById('backupStatus');

    if (nextSlot < 60) {
        state.backupCurrentSlot = nextSlot;

        const bank = Math.floor(nextSlot / 3) + 1;
        const patchNum = (nextSlot % 3) + 1;
        const bankStr = bank.toString().padStart(2, '0');

        if (statusEl) {
            statusEl.textContent = `Lendo: U${bankStr}-${patchNum} (${nextSlot + 1}/60)`;
        }

        // Aguardar 50ms antes de ler o próximo para dar tempo ao barramento MIDI
        setTimeout(() => requestSlotFromPedal(nextSlot), 50);
    } else {
        state.backupInProgress = false;
        if (backupTimeout) {
            clearTimeout(backupTimeout);
            backupTimeout = null;
        }

        if (statusEl) statusEl.textContent = "Backup Concluído!";
        logConsole("Backup de 60 slots concluído com sucesso!", "info");

        // Gerar e disparar download do arquivo
        downloadBackupFile();
    }
}

function downloadBackupFile() {
    const backupJson = JSON.stringify(state.backupData, null, 2);
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOSS_ME25_Backup_${dateStr}.me25backup`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Backup concluído com sucesso! O arquivo .me25backup foi gerado e baixado.");
}

function restoreAllPatches() {
    if (!state.midiOutput) {
        logConsole("Erro: Conecte um dispositivo MIDI primeiro!", "error");
        alert("Erro: Conecte um dispositivo MIDI primeiro!");
        return;
    }

    if (state.backupInProgress || state.restoreInProgress) return;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.me25backup';

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!Array.isArray(data) || data.length !== 60) {
                    alert("Erro: Arquivo de backup inválido. Ele deve conter exatamente 60 presets.");
                    return;
                }

                if (!confirm("AVISO: Isso irá gravar e sobrescrever todos os 60 slots de usuário (U01-1 a U20-3) na sua pedaleira BOSS ME-25 com os dados deste arquivo. Confirmar restauração total?")) {
                    return;
                }

                logConsole("Iniciando restauração de 60 slots na pedaleira...", "info");
                state.restoreInProgress = true;
                state.restoreCurrentSlot = 0;
                state.restoreData = data;

                writeSlotToPedal(0);
            } catch (err) {
                alert("Erro ao ler o arquivo de backup: " + err.message);
            }
        };
        reader.readAsText(file);
    });

    fileInput.click();
}

function writeSlotToPedal(slotIdx) {
    if (!state.restoreInProgress) return;

    const statusEl = document.getElementById('backupStatus');
    const patch = state.restoreData[slotIdx];

    if (slotIdx < 60 && patch) {
        const bank = Math.floor(slotIdx / 3) + 1;
        const patchNum = (slotIdx % 3) + 1;
        const bankStr = bank.toString().padStart(2, '0');

        if (statusEl) {
            statusEl.textContent = `Gravando: U${bankStr}-${patchNum} (${slotIdx + 1}/60)`;
        }

        // Montar os 128 bytes de payload do patch
        const payload = new Uint8Array(128);
        for (let i = 0; i < 48; i++) {
            payload[2 * i] = 0x00;
            payload[2 * i + 1] = patch.params[i] & 0x7F;
        }
        const nameStr = patch.name.padEnd(16, ' ');
        for (let i = 0; i < 16; i++) {
            payload[96 + 2 * i] = 0x00;
            payload[96 + 2 * i + 1] = nameStr.charCodeAt(i) & 0x7F;
        }

        // Endereço de gravação do slot: 7F 00 [slotIdx] 00
        const targetAddress = [0x7F, 0x00, slotIdx, 0x00];

        // Enviar dump
        sendRolandSysEx(0x12, targetAddress, Array.from(payload));

        // Espera 100ms antes do próximo slot (essencial para que a pedaleira grave na memória flash)
        setTimeout(() => {
            state.restoreCurrentSlot = slotIdx + 1;
            writeSlotToPedal(slotIdx + 1);
        }, 100);
    } else {
        state.restoreInProgress = false;
        if (statusEl) statusEl.textContent = "Restauração Concluída!";
        logConsole("Restauração de 60 slots concluída com sucesso!", "info");
        alert("Restauração de 60 slots concluída com sucesso! Os patches da pedaleira foram atualizados.");

        // Sincronizar UI ativa com o edit buffer
        sendPatchToPedal();
    }
}

function resetPatchStatusBadge() {
    const badge = document.getElementById('patchStatusBadge');
    if (badge) {
        badge.textContent = '⚡ Modo Audição (Temp)';
        badge.style.color = '#f1c40f';
    }
}

// ==========================================
// RECURSO 6: SIMULADOR DE ÁUDIO WEB (WEB AUDIO API)
// ==========================================
function initAudioContext() {
    if (state.audioCtx) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    state.audioCtx = ctx;

    // Criar nós de processamento
    const input = ctx.createGain();
    const distortion = ctx.createWaveShaper();

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'peaking';
    bassFilter.frequency.value = 100;

    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 800;

    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = 'peaking';
    trebleFilter.frequency.value = 4000;

    // Nós de Delay
    const delayNode = ctx.createDelay(2.0);
    const delayFeedback = ctx.createGain();
    const delayWet = ctx.createGain();
    const delayDry = ctx.createGain();

    // Nós de Reverb (simulando eco de sala metálico curto)
    const reverbNode = ctx.createDelay(0.1);
    const reverbFeedback = ctx.createGain();
    const reverbWet = ctx.createGain();
    const reverbDry = ctx.createGain();

    const masterGain = ctx.createGain();

    // Conexões de Efeitos:
    // Input -> Distorção -> EQ (Bass -> Mid -> Treble)
    input.connect(distortion);
    distortion.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);

    // Conexão da Cadeia de Delay (Roteamento Dry/Wet)
    trebleFilter.connect(delayDry);
    trebleFilter.connect(delayNode);
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode); // loop de feedback
    delayNode.connect(delayWet);

    const delayOut = ctx.createGain();
    delayDry.connect(delayOut);
    delayWet.connect(delayOut);

    // Conexão do Reverb
    delayOut.connect(reverbDry);
    delayOut.connect(reverbNode);
    reverbNode.connect(reverbFeedback);
    reverbFeedback.connect(reverbNode); // loop de reverb
    reverbNode.connect(reverbWet);

    const reverbOut = ctx.createGain();
    reverbDry.connect(reverbOut);
    reverbWet.connect(reverbOut);

    // ReverbOut -> Master Gain -> Analisador -> Auto-falantes do PC
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    reverbOut.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // Salvar as referências dos nós no estado global
    state.nodes = {
        input,
        distortion,
        bassFilter,
        midFilter,
        trebleFilter,
        delayNode,
        delayFeedback,
        delayWet,
        reverbNode,
        reverbFeedback,
        reverbWet,
        masterGain,
        analyser
    };

    updateAudioSimParameters();
}

function updateAudioSimParameters() {
    if (!state.audioCtx || !state.nodes.input) return;

    const params = state.currentPatch.params;
    const nodes = state.nodes;

    // 1. OD/DS (Distorção)
    const oddsOn = params[5] === 1;
    const oddsDrive = params[7]; // 0 a 99
    if (oddsOn) {
        // Aumenta a distorção no waveshaper
        nodes.distortion.curve = makeDistortionCurve(oddsDrive * 1.6);
    } else {
        nodes.distortion.curve = null; // Bypass limpo
    }

    // 2. Preamp / Equalizador (Bass, Middle, Treble)
    const preOn = params[22] === 1;
    if (preOn) {
        // Mapear 0-99 para -12dB a +12dB
        nodes.bassFilter.gain.setValueAtTime(((params[25] / 99) * 24) - 12, state.audioCtx.currentTime);
        nodes.midFilter.gain.setValueAtTime(((params[26] / 99) * 24) - 12, state.audioCtx.currentTime);
        nodes.trebleFilter.gain.setValueAtTime(((params[27] / 99) * 24) - 12, state.audioCtx.currentTime);
    } else {
        nodes.bassFilter.gain.setValueAtTime(0, state.audioCtx.currentTime);
        nodes.midFilter.gain.setValueAtTime(0, state.audioCtx.currentTime);
        nodes.trebleFilter.gain.setValueAtTime(0, state.audioCtx.currentTime);
    }

    // 3. Delay
    const delayOn = params[16] === 1;
    if (delayOn) {
        const msb = params[18];
        const lsb = params[19];
        const timeMs = (msb * 128) + lsb;
        
        nodes.delayNode.delayTime.setValueAtTime(Math.max(0.01, Math.min(2.0, timeMs / 1000)), state.audioCtx.currentTime);
        // Feedback mapeado de 0-99 para 0.0 a 0.75
        nodes.delayFeedback.gain.setValueAtTime((params[20] / 99) * 0.75, state.audioCtx.currentTime);
        // Mix molhado mapeado de 0-120 para 0.0 a 0.8
        nodes.delayWet.gain.setValueAtTime((params[21] / 120) * 0.8, state.audioCtx.currentTime);
    } else {
        nodes.delayWet.gain.setValueAtTime(0, state.audioCtx.currentTime);
    }

    // 4. Reverb
    const reverbLevel = params[43]; // 0-99
    if (reverbLevel > 0) {
        nodes.reverbNode.delayTime.setValueAtTime(0.035, state.audioCtx.currentTime); // 35ms reflexões curtas
        // Decay mapeado de 0-99 para 0.0 a 0.75
        nodes.reverbFeedback.gain.setValueAtTime((params[41] / 99) * 0.75, state.audioCtx.currentTime);
        // Mix de volume mapeado de 0-99 para 0.0 a 0.6
        nodes.reverbWet.gain.setValueAtTime((reverbLevel / 99) * 0.6, state.audioCtx.currentTime);
    } else {
        nodes.reverbWet.gain.setValueAtTime(0, state.audioCtx.currentTime);
    }

    // 5. Master Volume
    const masterVol = params[35]; // 0-99
    nodes.masterGain.gain.setValueAtTime((masterVol / 99) * 0.8, state.audioCtx.currentTime);
}

function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function toggleAudioSimulation() {
    const btn = document.getElementById('btnToggleAudioSim');
    if (!btn) return;

    if (state.simPlaying) {
        state.simPlaying = false;
        clearInterval(state.simInterval);
        state.simInterval = null;
        btn.textContent = "🔊 Ouvir Áudio no PC: OFF";
        btn.style.background = "rgba(0, 210, 255, 0.1)";
        btn.style.color = "var(--primary-color)";

        if (state.audioCtx) {
            state.audioCtx.suspend();
        }
    } else {
        // Desligar entrada de guitarra em tempo real se estiver ativa para evitar sobreposição
        const liveSwitch = document.getElementById('dawAudioLiveInputSwitch');
        if (liveSwitch && liveSwitch.checked) {
            setLiveGuitarAudio(false);
        }

        state.simPlaying = true;
        btn.textContent = "🔊 Ouvir Áudio no PC: ON";
        btn.style.background = "var(--success-color)";
        btn.style.color = "white";

        initAudioContext();
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }

        playArpeggioLoop();
        state.simInterval = setInterval(playArpeggioLoop, 3000);
    }
}

function playArpeggioLoop() {
    if (!state.simPlaying || !state.audioCtx) return;

    const ctx = state.audioCtx;
    const now = ctx.currentTime;

    // Tocar um arpejo clássico de Lá menor (A, C, E, A)
    const notes = [220.00, 261.63, 329.63, 440.00];
    notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.35;
        const duration = 1.6;
        playPluck(freq, startTime, duration);
    });
}

function playPluck(frequency, startTime, duration) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);
    
    // Pequeno envelope de pitch para imitar o ataque de uma corda dedilhada
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.025, startTime);
    osc.frequency.exponentialRampToValueAtTime(frequency, startTime + 0.08);

    // Envelope de ganho: ataque rápido e decaimento exponencial suave
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.35, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(state.nodes.input);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Helper para tornar elementos arrastáveis pelo cabeçalho (ex: janela de logs flutuante)
function makeElementDraggable(elmnt, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (header) {
        header.onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        // Evitar seleção de texto durante o arrasto
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Calcular nova posição
        let newTop = elmnt.offsetTop - pos2;
        let newLeft = elmnt.offsetLeft - pos1;

        // Limites da viewport
        const minVisible = 40; // Pixels mínimos visíveis
        const maxTop = window.innerHeight - minVisible;
        const minTop = 0;
        const maxLeft = window.innerWidth - minVisible;
        const minLeft = -elmnt.offsetWidth + minVisible;

        // Aplicar restrições de limites
        newTop = Math.max(minTop, Math.min(newTop, maxTop));
        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

        elmnt.style.top = newTop + "px";
        elmnt.style.left = newLeft + "px";
        elmnt.style.bottom = 'auto';
        elmnt.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// ==========================================
// RECURSO 7: IMPORTAÇÃO DINÂMICA DE TIMBRES DO FXFLOORBOARD
// ==========================================
async function initFxFloorBoardPatches() {
    const tabFxBtn = document.getElementById('tabFxBtn');
    const listContainer = document.getElementById('fxPatchesList');
    
    if (!listContainer) return;
    
    // Verificar se a API do Electron está disponível (se estamos rodando sob Electron)
    if (!window.electronAPI || !window.electronAPI.loadFxFloorBoardPatches) {
        console.log("API do Electron não encontrada. Pulando carregamento do FxFloorBoard.");
        return;
    }
    
    try {
        const libraries = await window.electronAPI.loadFxFloorBoardPatches();
        if (!libraries || libraries.length === 0) {
            console.log("Nenhuma biblioteca do FxFloorBoard encontrada ou carregada.");
            return;
        }
        
        // Exibir o botão da aba na barra lateral
        if (tabFxBtn) tabFxBtn.style.display = 'flex';
        listContainer.innerHTML = '';
        
        libraries.forEach((lib, libIdx) => {
            const folderItem = document.createElement('div');
            folderItem.className = 'folder-item';
            
            const isTSL = !!lib.isTSL;
            folderItem.dataset.isTsl = isTSL;
            
            // Por padrão, todas as pastas iniciam fechadas (colapsadas)
            
            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-header';
            
            const folderNameFormatted = lib.fileName.replace(/_/g, ' ');
            let folderIcon = '📁';
            if (isTSL) {
                folderIcon = '⭐';
            }

            let badge = '';
            if (isTSL) {
                badge = '<span class="bts-badge" style="font-size: 0.58rem; background: #3498db; color: white; padding: 1px 4px; border-radius: 3px; margin-left: 5px; font-weight: bold; text-transform: uppercase;">Central</span>';
            }
            
            folderHeader.innerHTML = `
                <div class="folder-header-left">
                    <span class="folder-icon">${folderIcon}</span>
                    <span class="folder-title" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;" title="${folderNameFormatted}">${folderNameFormatted}</span>
                    ${badge}
                </div>
                <span class="folder-arrow">▶</span>
            `;
            
            const folderContent = document.createElement('div');
            folderContent.className = 'folder-content';
            
            // Evento para abrir/fechar pasta (comportamento de acordeão)
            folderHeader.addEventListener('click', () => {
                const isOpen = folderItem.classList.contains('open');
                
                // Fechar todas as outras pastas para economizar altura vertical
                document.querySelectorAll('#fxPatchesList .folder-item').forEach(el => {
                    el.classList.remove('open');
                    const icon = el.querySelector('.folder-icon');
                    if (icon) {
                        if (el.dataset.isTsl === 'true') {
                            icon.textContent = '⭐';
                        } else {
                            icon.textContent = '📁';
                        }
                    }
                });
                
                if (!isOpen) {
                    folderItem.classList.add('open');
                    const icon = folderHeader.querySelector('.folder-icon');
                    if (icon) {
                        if (isTSL) {
                            icon.textContent = '🌟';
                        } else {
                            icon.textContent = '📂';
                        }
                    }
                }
            });
            
            // Popular os timbres (patches) de cada pasta
            lib.patches.forEach((patch, idx) => {
                const item = document.createElement('div');
                item.className = 'patch-item';
                item.patchParams = patch.params;
                item.innerHTML = `
                    <span class="patch-name" title="${patch.name}">${patch.name}</span>
                    <span class="patch-addr">Slot ${idx + 1}</span>
                `;
                
                item.addEventListener('click', (e) => {
                    e.stopPropagation(); // Impede o fechamento acidental da pasta
                    
                    document.querySelectorAll('#fxPatchesList .patch-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    
                    let sourceName = 'FxFloorBoard';
                    if (isTSL) {
                        sourceName = 'Tone Central';
                    }
                    logConsole(`Carregando timbre do ${sourceName} [${lib.fileName}]: ${patch.name}`, 'info');
                    loadPatchValues(patch.params, patch.name);
                    sendPatchToPedal();
                });
                
                folderContent.appendChild(item);
            });
            
            // Garantir que a primeira pasta comece com o ícone aberto correto
            if (folderItem.classList.contains('open')) {
                const icon = folderHeader.querySelector('.folder-icon');
                if (icon) {
                    if (isTSL) {
                        icon.textContent = '🌟';
                    } else {
                        icon.textContent = '📂';
                    }
                }
            }
            
            folderItem.appendChild(folderHeader);
            folderItem.appendChild(folderContent);
            listContainer.appendChild(folderItem);
        });
        
    } catch (err) {
        console.error("Erro ao carregar timbres do FxFloorBoard:", err);
    }
}

// Inicializar abas de bibliotecas na barra lateral
function initSidebarTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover classe ativa de todos os botões e ocultar todos os conteúdos
            buttons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Ativar o botão clicado e exibir o conteúdo correspondente
            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.style.display = 'flex';
            }
        });
    });
}

// Inicializar barra de pesquisa de timbres
function initLibrarySearch() {
    const searchInput = document.getElementById('librarySearchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    const effectFilter = document.getElementById('libraryEffectFilter');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        filterLibrary();
    });
    
    if (effectFilter) {
        effectFilter.addEventListener('change', () => {
            filterLibrary();
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterLibrary();
            searchInput.focus();
        });
    }
}

// Auxiliar para filtrar timbres com base no efeito selecionado
function matchesEffectFilter(params, filterValue) {
    if (!filterValue || filterValue === 'all') return true;
    if (!params) return false;
    
    switch (filterValue) {
        case 'comp':
            return params[0] === 1; // COMP/FX Switch
        case 'odds':
            return params[5] === 1; // OD/DS Switch
        case 'mod':
            return params[10] === 1; // MODULATION Switch
        case 'delay':
            return params[16] === 1; // DELAY Switch
        case 'reverb':
            return params[43] > 0; // REVERB Level > 0
        case 'preamp':
            return params[22] === 1; // PREAMP Switch
        case 'solo':
            return params[30] === 1; // SOLO Switch
        default:
            return true;
    }
}

// Filtrar a biblioteca de timbres com base no input e filtro de efeitos
function filterLibrary() {
    const searchInput = document.getElementById('librarySearchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    const effectFilter = document.getElementById('libraryEffectFilter');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    const filterValue = effectFilter ? effectFilter.value : 'all';
    
    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }
    
    // 1. Filtrar Fábrica
    document.querySelectorAll('#factoryPatchesList .patch-item').forEach(item => {
        const name = item.querySelector('.patch-name').textContent.toLowerCase();
        const textMatch = name.includes(query);
        const effectMatch = matchesEffectFilter(item.patchParams, filterValue);
        item.style.display = (textMatch && effectMatch) ? 'flex' : 'none';
    });
    
    // 2. Filtrar Nuvem
    document.querySelectorAll('#cloudPatchesList .patch-item').forEach(item => {
        const name = item.querySelector('.patch-name').textContent.toLowerCase();
        const textMatch = name.includes(query);
        const effectMatch = matchesEffectFilter(item.patchParams, filterValue);
        item.style.display = (textMatch && effectMatch) ? 'flex' : 'none';
    });
    
    // 3. Filtrar Pastas
    const folders = document.querySelectorAll('#fxPatchesList .folder-item');
    folders.forEach(folder => {
        const folderTitle = folder.querySelector('.folder-title').textContent.toLowerCase();
        const patches = folder.querySelectorAll('.folder-content .patch-item');
        let folderHasMatches = folderTitle.includes(query);
        let patchMatchCount = 0;
        
        patches.forEach(patch => {
            const patchName = patch.querySelector('.patch-name').textContent.toLowerCase();
            const textMatch = patchName.includes(query) || folderTitle.includes(query);
            const effectMatch = matchesEffectFilter(patch.patchParams, filterValue);
            if (textMatch && effectMatch) {
                patch.style.display = 'flex';
                patchMatchCount++;
            } else {
                patch.style.display = 'none';
            }
        });
        
        const isTSL = folder.dataset.isTsl === 'true';
        const isGuitarRig = folder.dataset.isGuitarRig === 'true';
        const isGr5 = folder.dataset.isGr5 === 'true';
        
        if (query.length > 0 || filterValue !== 'all') {
            if (patchMatchCount > 0 || (folderHasMatches && filterValue === 'all')) {
                folder.style.display = 'flex';
                folder.classList.add('open');
                const icon = folder.querySelector('.folder-icon');
                if (icon) {
                    if (isTSL) {
                        icon.textContent = '🌟';
                    } else if (isGuitarRig) {
                        icon.textContent = isGr5 ? '🎛️' : '🎚️';
                    } else {
                        icon.textContent = '📂';
                    }
                }
            } else {
                folder.style.display = 'none';
                folder.classList.remove('open');
            }
        } else {
            // Restaurar todas as pastas para o estado fechado e visível
            folder.style.display = 'flex';
            folder.classList.remove('open');
            const icon = folder.querySelector('.folder-icon');
            if (icon) {
                if (isTSL) {
                    icon.textContent = '⭐';
                } else if (isGuitarRig) {
                    icon.textContent = isGr5 ? '🎛️' : '🎚️';
                } else {
                    icon.textContent = '📁';
                }
            }
            patches.forEach(patch => patch.style.display = 'flex');
        }
    });
}

// List of effects that can be searched
const SEARCHABLE_EFFECTS = [
    // COMP/FX
    { name: "Compressor (COMP)", cardId: "cardComp", selectId: "compType", value: "0", switchId: "compSwitch", category: "COMP / FX" },
    { name: "T.Wah Up", cardId: "cardComp", selectId: "compType", value: "1", switchId: "compSwitch", category: "COMP / FX" },
    { name: "T.Wah Down", cardId: "cardComp", selectId: "compType", value: "2", switchId: "compSwitch", category: "COMP / FX" },
    { name: "Slow Gear", cardId: "cardComp", selectId: "compType", value: "3", switchId: "compSwitch", category: "COMP / FX" },
    { name: "Defretter", cardId: "cardComp", selectId: "compType", value: "4", switchId: "compSwitch", category: "COMP / FX" },
    { name: "Single > Hum", cardId: "cardComp", selectId: "compType", value: "5", switchId: "compSwitch", category: "COMP / FX" },
    { name: "Hum > Single", cardId: "cardComp", selectId: "compType", value: "6", switchId: "compSwitch", category: "COMP / FX" },
    { name: "Solo (COMP BOOST)", cardId: "cardComp", selectId: "compType", value: "7", switchId: "compSwitch", category: "COMP / FX" },

    // OD/DS
    { name: "BOOST", cardId: "cardOdds", selectId: "oddsType", value: "0", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "OD-1 (Overdrive)", cardId: "cardOdds", selectId: "oddsType", value: "1", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "T-SCREAM (Tube Screamer)", cardId: "cardOdds", selectId: "oddsType", value: "2", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "BLUES (Blues Driver)", cardId: "cardOdds", selectId: "oddsType", value: "3", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "DIST (Distortion)", cardId: "cardOdds", selectId: "oddsType", value: "4", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "CLASSIC (Vintage Dist)", cardId: "cardOdds", selectId: "oddsType", value: "5", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "MODERN (High Gain Dist)", cardId: "cardOdds", selectId: "oddsType", value: "6", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "METAL (Metal Zone)", cardId: "cardOdds", selectId: "oddsType", value: "7", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "CORE (Extreme Dist)", cardId: "cardOdds", selectId: "oddsType", value: "8", switchId: "oddsSwitch", category: "OD / DS" },
    { name: "FUZZ", cardId: "cardOdds", selectId: "oddsType", value: "9", switchId: "oddsSwitch", category: "OD / DS" },

    // PREAMP
    { name: "CLEAN Preamp", cardId: "cardPreamp", selectId: "preType", value: "0", switchId: "preSwitch", category: "Preamp" },
    { name: "TWIN (Fender Twin Reverb)", cardId: "cardPreamp", selectId: "preType", value: "1", switchId: "preSwitch", category: "Preamp" },
    { name: "TWEED (Fender Bassman)", cardId: "cardPreamp", selectId: "preType", value: "2", switchId: "preSwitch", category: "Preamp" },
    { name: "CRUNCH (Vox AC30 / Matchless)", cardId: "cardPreamp", selectId: "preType", value: "3", switchId: "preSwitch", category: "Preamp" },
    { name: "COMBO (Marshall Bluesbreaker)", cardId: "cardPreamp", selectId: "preType", value: "4", switchId: "preSwitch", category: "Preamp" },
    { name: "DRIVE (Marshall Stack)", cardId: "cardPreamp", selectId: "preType", value: "5", switchId: "preSwitch", category: "Preamp" },
    { name: "STACK (Mesa/Boogie Rectifier)", cardId: "cardPreamp", selectId: "preType", value: "6", switchId: "preSwitch", category: "Preamp" },
    { name: "METAL Preamp (Peavey 5150)", cardId: "cardPreamp", selectId: "preType", value: "7", switchId: "preSwitch", category: "Preamp" },
    { name: "LEAD (Boss Custom High Gain)", cardId: "cardPreamp", selectId: "preType", value: "8", switchId: "preSwitch", category: "Preamp" },
    { name: "EXTREME (Modern Heavy Lead)", cardId: "cardPreamp", selectId: "preType", value: "9", switchId: "preSwitch", category: "Preamp" },

    // MODULATION
    { name: "CHORUS", cardId: "cardModulation", selectId: "modType", value: "0", switchId: "modSwitch", category: "Modulation" },
    { name: "FLANGER", cardId: "cardModulation", selectId: "modType", value: "1", switchId: "modSwitch", category: "Modulation" },
    { name: "PHASER", cardId: "cardModulation", selectId: "modType", value: "2", switchId: "modSwitch", category: "Modulation" },
    { name: "TREMOLO", cardId: "cardModulation", selectId: "modType", value: "3", switchId: "modSwitch", category: "Modulation" },
    { name: "ROTARY", cardId: "cardModulation", selectId: "modType", value: "4", switchId: "modSwitch", category: "Modulation" },
    { name: "UNI-V", cardId: "cardModulation", selectId: "modType", value: "5", switchId: "modSwitch", category: "Modulation" },
    { name: "HARMONIST", cardId: "cardModulation", selectId: "modType", value: "6", switchId: "modSwitch", category: "Modulation" },
    { name: "DELAY (Modulation Delay)", cardId: "cardModulation", selectId: "modType", value: "7", switchId: "modSwitch", category: "Modulation" },

    // DELAY
    { name: "DELAY", cardId: "cardDelay", selectId: null, value: null, switchId: "delaySwitch", category: "Delay" },

    // REVERB
    { name: "ROOM Reverb", cardId: "cardReverb", selectId: "reverbType", value: "0", switchId: null, category: "Reverb" },
    { name: "HALL Reverb", cardId: "cardReverb", selectId: "reverbType", value: "1", switchId: null, category: "Reverb" },

    // PEDAL FX
    { name: "Volume (Pedal FX OFF)", cardId: "cardGlobals", selectId: "pedalFxType", value: "0", switchId: null, category: "Pedal FX" },
    { name: "WAH (Wah-Wah)", cardId: "cardGlobals", selectId: "pedalFxType", value: "1", switchId: null, category: "Pedal FX" },
    { name: "+1 OCTAVE (Pitch Bend Up)", cardId: "cardGlobals", selectId: "pedalFxType", value: "2", switchId: null, category: "Pedal FX" },
    { name: "-1 OCTAVE (Pitch Bend Down)", cardId: "cardGlobals", selectId: "pedalFxType", value: "3", switchId: null, category: "Pedal FX" },
    { name: "FREEZE (Pedal Hold)", cardId: "cardGlobals", selectId: "pedalFxType", value: "4", switchId: null, category: "Pedal FX" },

    // GLOBAL CONTROLS
    { name: "Solo Boost", cardId: "cardGlobals", selectId: null, value: null, switchId: "soloSwitch", category: "Pedal / Solo / EQ" },
    { name: "Super Stack", cardId: "cardGlobals", selectId: null, value: null, switchId: "superStack", category: "Pedal / Solo / EQ" },
    { name: "Noise Gate", cardId: "cardGlobals", selectId: null, value: null, switchId: null, category: "Pedal / Solo / EQ" },
    { name: "Master Volume", cardId: "cardGlobals", selectId: null, value: null, switchId: null, category: "Pedal / Solo / EQ" }
];

function initEffectsSearch() {
    const searchInput = document.getElementById('effectSearchInput');
    const clearBtn = document.getElementById('btnClearEffectSearch');
    const resultsContainer = document.getElementById('effectsSearchResults');
    
    if (!searchInput || !resultsContainer) return;
    
    // Hide results if clicked outside the search container
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#effectsSearchContainer')) {
            resultsContainer.style.display = 'none';
        }
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length > 0) {
            resultsContainer.style.display = 'flex';
        }
    });
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        
        if (clearBtn) {
            clearBtn.style.display = query ? 'block' : 'none';
        }
        
        if (!query) {
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
            return;
        }
        
        const matches = SEARCHABLE_EFFECTS.filter(effect => 
            effect.name.toLowerCase().includes(query) || 
            effect.category.toLowerCase().includes(query)
        );
        
        renderEffectsSearchResults(matches);
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            resultsContainer.style.display = 'none';
            resultsContainer.innerHTML = '';
            searchInput.focus();
        });
    }
}

function renderEffectsSearchResults(matches) {
    const resultsContainer = document.getElementById('effectsSearchResults');
    const searchInput = document.getElementById('effectSearchInput');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (matches.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'effect-search-no-results';
        noResults.textContent = 'Nenhum efeito encontrado';
        resultsContainer.appendChild(noResults);
        resultsContainer.style.display = 'flex';
        return;
    }
    
    matches.forEach(effect => {
        const item = document.createElement('div');
        item.className = 'effect-search-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'effect-name';
        nameSpan.textContent = effect.name;
        
        const catSpan = document.createElement('span');
        catSpan.className = 'effect-category';
        catSpan.textContent = effect.category;
        
        item.appendChild(nameSpan);
        item.appendChild(catSpan);
        
        item.addEventListener('click', () => {
            selectAndHighlightEffect(effect);
            resultsContainer.style.display = 'none';
            searchInput.value = '';
            const clearBtn = document.getElementById('btnClearEffectSearch');
            if (clearBtn) clearBtn.style.display = 'none';
        });
        
        resultsContainer.appendChild(item);
    });
    
    resultsContainer.style.display = 'flex';
}

function selectAndHighlightEffect(effect) {
    // 1. Turn on switch if it exists and is off
    if (effect.switchId) {
        const sw = document.getElementById(effect.switchId);
        if (sw && !sw.checked) {
            sw.checked = true;
            sw.dispatchEvent(new Event('change'));
        }
    }
    
    // 2. Select option in dropdown if selectId and value exist
    if (effect.selectId && effect.value !== null) {
        const sel = document.getElementById(effect.selectId);
        if (sel) {
            sel.value = effect.value;
            sel.dispatchEvent(new Event('input'));
            sel.dispatchEvent(new Event('change'));
        }
    }
    
    // 3. Scroll to the card
    const card = document.getElementById(effect.cardId);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remove previous highlight class if any
        card.classList.remove('glow-highlight');
        
        // Trigger reflow to restart animation
        void card.offsetWidth;
        
        // Add highlight class
        card.classList.add('glow-highlight');
        
        // Remove the highlight class after animation finishes (1.5s)
        setTimeout(() => {
            card.classList.remove('glow-highlight');
        }, 1500);
    }
}

// Inicializar janela flutuante da Biblioteca (Modo Multi-Tela Nativo)
function initPopupLibrary() {
    const btnPopup = document.getElementById('btnPopupLibrary');
    if (!btnPopup) return;

    btnPopup.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.openLibraryWindow) {
            window.electronAPI.openLibraryWindow();
            btnPopup.style.display = 'none'; // Ocultar botão popup no sidebar
        }
    });
}

// Inicializar janela flutuante do Player de Stems (Modo PIP)
function initPopupPlayer() {
    const btnPopup = document.getElementById('btnPopupPlayer');
    if (!btnPopup) return;

    btnPopup.addEventListener('click', () => {
        if (window.electronAPI && window.electronAPI.openPlayerWindow) {
            window.electronAPI.openPlayerWindow();
        }
    });
}

// Inicializar a lógica do Modo DAW (Bypass)
function initDawMode() {
    const dawSwitch = document.getElementById('dawModeSwitch');
    if (dawSwitch) {
        dawSwitch.addEventListener('change', (e) => {
            setDawMode(e.target.checked);
        });
    }

    const liveSwitch = document.getElementById('dawAudioLiveInputSwitch');
    if (liveSwitch) {
        liveSwitch.addEventListener('change', (e) => {
            setLiveGuitarAudio(e.target.checked);
        });
    }
}

function setDawMode(active) {
    const dawSwitch = document.getElementById('dawModeSwitch');
    const statusEl = document.getElementById('dawModeStatus');
    const cardEl = document.getElementById('cardDawMode');
    
    if (dawSwitch) dawSwitch.checked = active;

    if (active) {
        if (state.isDawModeActive) return;
        state.isDawModeActive = true;

        if (statusEl) {
            statusEl.textContent = "Ativo";
            statusEl.className = "status-badge active";
        }
        if (cardEl) cardEl.classList.add('active-mode');

        // Salvar patch atual para poder restaurar depois
        state.savedPatchBeforeDaw = {
            name: state.currentPatch.name,
            params: [...state.currentPatch.params]
        };

        // Criar os parâmetros de bypass (DAW Out): desligar tudo, exceto volume
        const dawParams = [...state.currentPatch.params];
        
        // COMP/FX OFF
        dawParams[0] = 0;
        // OD/DS OFF
        dawParams[5] = 0;
        // MODULATION OFF
        dawParams[10] = 0;
        // DELAY OFF
        dawParams[16] = 0;
        // PREAMP OFF
        dawParams[22] = 0;
        // SOLO OFF
        dawParams[30] = 0;
        // NS Threshold OFF
        dawParams[31] = 0;
        // Reverb Level OFF
        dawParams[43] = 0;
        // Master Volume 99
        dawParams[35] = 99;
        // Super Stack OFF
        dawParams[37] = 0;

        // Desativar envio temporariamente para atualizar a interface sem loops
        state.isMutedMidiSend = true;
        loadPatchValues(dawParams, "DAW Mode (Bypass)");
        state.isMutedMidiSend = false;

        // Enviar os novos parâmetros para a pedaleira
        sendPatchToPedal();

        // Esmaecer todos os outros cartões
        document.querySelectorAll('.effects-grid .effect-card').forEach(card => {
            if (card.id !== 'cardDawMode') {
                card.classList.add('disabled');
            }
        });
        
        logConsole("Modo DAW Ativado: Todos os efeitos físicos desligados (sinal seco enviado para o PC).", "info");
    } else {
        if (!state.isDawModeActive) return;
        state.isDawModeActive = false;

        // Desativar áudio ao vivo local
        setLiveGuitarAudio(false);

        if (statusEl) {
            statusEl.textContent = "Inativo";
            statusEl.className = "status-badge inactive";
        }
        if (cardEl) cardEl.classList.remove('active-mode');

        // Restaurar o patch original salvo antes de ativar o DAW Mode
        if (state.savedPatchBeforeDaw) {
            state.isMutedMidiSend = true;
            loadPatchValues(state.savedPatchBeforeDaw.params, state.savedPatchBeforeDaw.name);
            state.isMutedMidiSend = false;
            
            sendPatchToPedal();
            logConsole(`Modo DAW Desativado: Restaurado patch original "${state.savedPatchBeforeDaw.name}".`, "info");
        } else {
            // Re-sincronizar as classes disabled com base em seus estados reais
            document.querySelectorAll('.effects-grid .effect-card').forEach(card => {
                if (card.id !== 'cardDawMode') {
                    const checkbox = card.querySelector('.switch-container input[type="checkbox"]');
                    const isGlobalSwitch = card.id === 'cardGlobals';
                    if (isGlobalSwitch) {
                        card.classList.remove('disabled');
                    } else if (checkbox) {
                        if (checkbox.checked) card.classList.remove('disabled');
                        else card.classList.add('disabled');
                    }
                }
            });
            updateSignalFlowUI();
            logConsole("Modo DAW Desativado.", "info");
        }
    }
}

function setLiveGuitarAudio(active) {
    const liveSwitch = document.getElementById('dawAudioLiveInputSwitch');
    if (liveSwitch) liveSwitch.checked = active;

    if (active) {
        // Parar simulação de teste (arpejo) para evitar sobreposição
        if (state.simPlaying) {
            toggleAudioSimulation();
        }

        initAudioContext();
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }

        if (state.liveAudioStream) {
            logConsole("Áudio local já está ativo.", "info");
            return;
        }

        logConsole("Solicitando acesso ao dispositivo de entrada de áudio...", "info");

        navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                latency: 0.01
            }
        })
        .then((stream) => {
            state.liveAudioStream = stream;
            state.liveAudioSource = state.audioCtx.createMediaStreamSource(stream);
            state.liveAudioSource.connect(state.nodes.input);
            logConsole("🎸 Áudio Local Ativo! O sinal limpo da guitarra está sendo processado em tempo real pelo software.", "success");

            if (!state.isDawModeActive) {
                setDawMode(true);
            }
        })
        .catch((err) => {
            logConsole(`Erro ao acessar dispositivo de áudio: ${err.message}. Verifique as permissões de gravação do microfone.`, "error");
            if (liveSwitch) liveSwitch.checked = false;
            state.liveAudioStream = null;
            state.liveAudioSource = null;
        });
    } else {
        if (state.liveAudioStream || state.liveAudioSource) {
            if (state.liveAudioStream) {
                state.liveAudioStream.getTracks().forEach(track => track.stop());
                state.liveAudioStream = null;
            }
            if (state.liveAudioSource) {
                try {
                    state.liveAudioSource.disconnect();
                } catch (e) {}
                state.liveAudioSource = null;
            }
            logConsole("🎸 Áudio Local Desativado.", "info");
        }
        if (liveSwitch) liveSwitch.checked = false;
    }
}

// Inicializar e escutar a troca de temas no editor
function initTheme() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect) return;
    
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    themeSelect.value = activeTheme;
    
    themeSelect.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', selectedTheme);
        localStorage.setItem('boss_me25_theme', selectedTheme);
        
        // Refresh slider theme backgrounds
        refreshSliderThemeBackgrounds();
        
        // Notificar via IPC para sincronizar com o popup
        if (window.electronAPI && window.electronAPI.changeTheme) {
            window.electronAPI.changeTheme(selectedTheme);
        }
    });
    
    // Refresh initially
    refreshSliderThemeBackgrounds();
}

// Alinhamento dinâmico do cartão biblioteca com a base do cartão de Delay
function alignLibraryCardWithDelay() {
    if (isLibraryMode) return; // Não alinhar no modo popup
    
    const delayCard = document.getElementById('cardDelay');
    const libraryCard = document.getElementById('libraryCardPanel');
    const activePatchCard = document.querySelector('.sidebar-panel:first-of-type');
    
    if (delayCard && libraryCard && activePatchCard) {
        // Se a tela estiver empilhada (largura <= 900px), deixa a altura automática
        if (window.innerWidth <= 900) {
            libraryCard.style.height = 'auto';
            libraryCard.style.flexGrow = '1';
            return;
        }
        
        const delayRect = delayCard.getBoundingClientRect();
        const activePatchRect = activePatchCard.getBoundingClientRect();
        
        // Se o delay card não estiver renderizado ou visível (ex: em outra aba), não tenta calcular
        if (delayRect.height === 0 || delayRect.bottom === 0) {
            return;
        }
        
        // A altura da biblioteca deve ser a distância do fundo do Delay até o fundo do Active Patch, descontando o gap (20px)
        let targetHeight = delayRect.bottom - activePatchRect.bottom - 20;
        
        // Garantir que a biblioteca não fique menor que 380px
        if (targetHeight < 380) {
            targetHeight = 380;
        }
        
        libraryCard.style.flexGrow = '0';
        libraryCard.style.height = `${targetHeight}px`;
    }
}

// Inicializar e escutar a alteração do tamanho da fonte
function initFontSize() {
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    
    const applyFontSize = (size) => {
        let sizePercent = '100%';
        if (size === 'small') sizePercent = '85%';
        else if (size === 'medium') sizePercent = '115%';
        else if (size === 'large') sizePercent = '130%';
        
        document.documentElement.style.fontSize = sizePercent;
        
        if (typeof alignLibraryCardWithDelay === 'function') {
            alignLibraryCardWithDelay();
            setTimeout(alignLibraryCardWithDelay, 100);
        }
    };
    
    const savedFontSize = localStorage.getItem('boss_me25_fontsize') || 'normal';
    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
        fontSizeSelect.addEventListener('change', (e) => {
            const selectedSize = e.target.value;
            applyFontSize(selectedSize);
            localStorage.setItem('boss_me25_fontsize', selectedSize);
        });
    }
    
    applyFontSize(savedFontSize);
}

// Executar no carregamento, redimensionamento e com pequenos timeouts de segurança
window.addEventListener('load', alignLibraryCardWithDelay);
window.addEventListener('resize', alignLibraryCardWithDelay);
document.addEventListener('DOMContentLoaded', alignLibraryCardWithDelay);
setTimeout(alignLibraryCardWithDelay, 200);
setTimeout(alignLibraryCardWithDelay, 600);
setTimeout(alignLibraryCardWithDelay, 1500);

// ==========================================
// RECURSO 10: PLAYER DE BACKING TRACKS & STEMS COM DSP
// ==========================================
function initBackingPlayer() {
    const btnPlay = document.getElementById('btnPlayBacking');
    const btnStop = document.getElementById('btnStopBacking');
    const btnSeekBack = document.getElementById('btnSeekBack');
    const btnSeekForward = document.getElementById('btnSeekForward');
    const btnMute = document.getElementById('btnPlayerMute');
    const timeCurrentEl = document.getElementById('backingTimeCurrent');
    const timeTotalEl = document.getElementById('backingTimeTotal');
    const progressBar = document.getElementById('backingProgressBar');
    const volInput = document.getElementById('backingVolume');
    const volVal = document.getElementById('backingVolumeVal');
    
    if (!btnPlay || !btnStop) return;

    // Configuração do Seekbar Customizado RealPlayer
    const customBar = document.getElementById('customProgressBar');
    const customFill = document.getElementById('customProgressBarFill');
    const customHandle = document.getElementById('customProgressBarHandle');
    
    const updateCustomProgressBarUI = () => {
        if (!progressBar || !customFill) return;
        
        let val = state.backingTrack.currentElapsed;
        if (val === undefined || val === null) {
            val = parseFloat(progressBar.value);
        }
        
        let max = state.backingTrack.duration;
        if (!max) {
            max = parseFloat(progressBar.max);
        }
        
        const validVal = isNaN(val) || !isFinite(val) ? 0 : val;
        const validMax = isNaN(max) || !isFinite(max) || max <= 0 ? 1 : max;
        
        const pct = Math.max(0, Math.min(100, (validVal / validMax) * 100));
        customFill.style.width = `${pct}%`;
        
        if (customHandle) {
            customHandle.style.left = `${pct}%`;
        }
        
        if (customBar) {
            const isDisabled = progressBar.disabled || progressBar.hasAttribute('disabled');
            if (isDisabled) {
                customBar.classList.add('disabled');
            } else {
                customBar.classList.remove('disabled');
            }
        }
    };
    
    state.backingTrack.updateCustomProgressBarUI = updateCustomProgressBarUI;
    updateCustomProgressBarUI();

    if (customBar && progressBar) {
        const handleSeek = (e) => {
            if (progressBar.disabled) return;
            const rect = customBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width || 1;
            const pct = Math.max(0, Math.min(100, (clickX / width) * 100));
            
            const maxVal = parseFloat(progressBar.max) || 100;
            const targetVal = (pct / 100) * maxVal;
            progressBar.value = targetVal;
            state.backingTrack.currentElapsed = targetVal; // Salvar no estado global
            
            progressBar.dispatchEvent(new Event('input'));
            progressBar.dispatchEvent(new Event('change'));
            updateCustomProgressBarUI();
            
            // Fazer o seek de áudio real
            if (isPlayerMode) {
                if (window.electronAPI && window.electronAPI.sendPlayerAction) {
                    window.electronAPI.sendPlayerAction('control-seek', targetVal);
                }
            } else {
                seekBacking(targetVal);
            }
        };

        let isDragging = false;
        customBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleSeek(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleSeek(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch event support for tablets/monitors
        customBar.addEventListener('touchstart', (e) => {
            isDragging = true;
            if (e.touches && e.touches[0]) {
                handleSeek(e.touches[0]);
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches && e.touches[0]) {
                handleSeek(e.touches[0]);
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
    
    // Play/Pause button
    btnPlay.addEventListener('click', async () => {
        if (isPlayerMode) {
            if (state.backingTrack.isPlaying) {
                window.electronAPI.sendPlayerAction('control-pause');
            } else {
                window.electronAPI.sendPlayerAction('control-play');
            }
            return;
        }
        
        // Se ainda não carregou nenhum buffer de áudio (seja stems ou original), decodifica o original na hora!
        if (state.backingTrack.audioBuffers.length === 0) {
            const filePath = document.getElementById('stemInputFilePath').value;
            if (!filePath || !window.stemAPI) return;
            
            btnPlay.disabled = true;
            const btnStop = document.getElementById('btnStopBacking');
            if (btnStop) btnStop.disabled = true;
            const subtitleEl = document.getElementById('playerTrackSubtitle');
            if (subtitleEl) subtitleEl.textContent = "Carregando canção original...";
            
            try {
                const arrayBuffer = await window.stemAPI.readBuffer(filePath);
                if (!arrayBuffer) throw new Error("Não foi possível carregar o arquivo.");
                
                let rawBuffer = arrayBuffer;
                if (arrayBuffer instanceof Uint8Array || arrayBuffer.buffer) {
                    rawBuffer = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
                }
                
                initAudioContext();
                const decodedBuffer = await new Promise((resolve, reject) => {
                    state.audioCtx.decodeAudioData(rawBuffer, resolve, reject);
                });
                
                state.backingTrack.audioBuffers = [decodedBuffer];
                state.backingTrack.fileNames = ['Canção Original'];
                state.backingTrack.mode = 'original';
                
                renderStemsList();
                
                state.backingTrack.duration = decodedBuffer.duration;
                document.getElementById('backingTimeTotal').textContent = formatBackingTime(state.backingTrack.duration);
                
                const backingProgressBar = document.getElementById('backingProgressBar');
                if (backingProgressBar) {
                    backingProgressBar.value = 0;
                    backingProgressBar.max = Math.floor(state.backingTrack.duration);
                    backingProgressBar.disabled = false;
                    backingProgressBar.removeAttribute('disabled');
                }
                if (state.backingTrack.updateCustomProgressBarUI) {
                    state.backingTrack.updateCustomProgressBarUI();
                }
                
                const backingFileName = document.getElementById('backingFileName');
                const resultPanel = document.getElementById('stemResultPanel');
                if (backingFileName) backingFileName.textContent = "🎵 Tocando Canção Original (Sem IA)";
                if (resultPanel) resultPanel.style.display = 'flex';
                
                // Metadados
                const fileName = filePath.split(/[/\\]/).pop();
                const titleEl = document.getElementById('playerTrackTitle');
                const coverEl = document.getElementById('playerTrackCover');
                const iconEl = document.getElementById('playerTrackIcon');
                if (state.backingTrack.metaTitle) {
                    if (titleEl) titleEl.textContent = state.backingTrack.metaTitle;
                    if (subtitleEl) subtitleEl.textContent = state.backingTrack.metaArtist;
                    if (coverEl && state.backingTrack.metaCoverUrl) {
                        coverEl.src = state.backingTrack.metaCoverUrl;
                        coverEl.style.display = 'block';
                        if (iconEl) iconEl.style.display = 'none';
                    }
                } else {
                    if (titleEl) titleEl.textContent = fileName;
                    if (subtitleEl) subtitleEl.textContent = "Áudio original carregado";
                }
                
                syncStemsToPlayer();
            } catch (err) {
                console.error("Erro ao carregar original sob demanda:", err);
                alert("Erro ao carregar áudio original: " + err.message);
                btnPlay.disabled = false;
                if (btnStop) btnStop.disabled = false;
                return;
            } finally {
                btnPlay.disabled = false;
                if (btnStop) btnStop.disabled = false;
            }
        }
        
        if (state.backingTrack.isPlaying) {
            pauseBacking();
            btnPlay.textContent = "▶";
            btnPlay.classList.remove('playing');
        } else {
            playBacking();
            btnPlay.textContent = "⏸";
            btnPlay.classList.add('playing');
        }
    });
    
    // Stop button
    btnStop.addEventListener('click', () => {
        if (isPlayerMode) {
            window.electronAPI.sendPlayerAction('control-stop');
            return;
        }
        
        stopBacking();
        btnPlay.textContent = "▶";
        btnPlay.classList.remove('playing');
    });

    // Seek Back (-10s)
    if (btnSeekBack) {
        btnSeekBack.addEventListener('click', () => {
            let currentElapsed = 0;
            if (state.backingTrack.isPlaying) {
                currentElapsed = state.audioCtx.currentTime - state.backingTrack.startTime + state.backingTrack.pauseTime;
            } else {
                currentElapsed = state.backingTrack.pauseTime;
            }
            const target = Math.max(0, currentElapsed - 10);
            
            if (isPlayerMode) {
                window.electronAPI.sendPlayerAction('control-seek', target);
                return;
            }
            seekBacking(target);
        });
    }

    // Seek Forward (+10s)
    if (btnSeekForward) {
        btnSeekForward.addEventListener('click', () => {
            let currentElapsed = 0;
            if (state.backingTrack.isPlaying) {
                currentElapsed = state.audioCtx.currentTime - state.backingTrack.startTime + state.backingTrack.pauseTime;
            } else {
                currentElapsed = state.backingTrack.pauseTime;
            }
            const target = Math.min(state.backingTrack.duration || 0, currentElapsed + 10);
            
            if (isPlayerMode) {
                window.electronAPI.sendPlayerAction('control-seek', target);
                return;
            }
            seekBacking(target);
        });
    }

    // Mute/Unmute toggle
    let previousVolume = 80;
    const updateVolBg = (v) => {
        if (volInput) {
            const colors = getThemeColorsForSlider();
            volInput.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${v}%, ${colors.bg} ${v}%, ${colors.bg} 100%)`;
        }
    };
    
    // Configuração inicial do preenchimento de volume e dB
    if (volInput) {
        updateVolBg(parseInt(volInput.value));
        if (volVal) {
            volVal.textContent = volumeToDbString(parseInt(volInput.value));
        }
    }

    if (btnMute) {
        // Inicializar com o texto correto
        if (volInput) {
            const val = parseInt(volInput.value);
            const isMuted = val === 0 || (state.backingTrack.eqSettings[4] && state.backingTrack.eqSettings[4].mute);
            if (isMuted) {
                btnMute.innerHTML = '🔇 Mutado';
                btnMute.style.background = 'rgba(255, 59, 48, 0.15)';
                btnMute.style.color = '#ff3b30';
                btnMute.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                btnMute.classList.add('muted');
            } else {
                btnMute.innerHTML = '🔊 Ativo';
                btnMute.style.background = 'rgba(0, 255, 135, 0.08)';
                btnMute.style.color = '#00ff87';
                btnMute.style.borderColor = 'rgba(0, 255, 135, 0.2)';
                btnMute.classList.remove('muted');
            }
        }

        btnMute.addEventListener('click', () => {
            if (!volInput) return;
            const isMuted = btnMute.classList.toggle('muted');
            
            if (isMuted) {
                previousVolume = parseInt(volInput.value);
                volInput.value = 0;
                if (volVal) volVal.textContent = '-∞ dB';
                btnMute.innerHTML = '🔇 Mutado';
                btnMute.style.background = 'rgba(255, 59, 48, 0.15)';
                btnMute.style.color = '#ff3b30';
                btnMute.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                updateVolBg(0);
                
                if (state.backingTrack.eqSettings[4]) {
                    state.backingTrack.eqSettings[4].mute = true;
                }
                
                if (isPlayerMode) {
                    window.electronAPI.sendPlayerAction('control-volume-master', 0);
                    return;
                }
                
                if (state.backingTrack.masterGain) {
                    state.backingTrack.masterGain.gain.value = 0;
                }
            } else {
                volInput.value = previousVolume;
                if (volVal) volVal.textContent = volumeToDbString(previousVolume);
                btnMute.innerHTML = '🔊 Ativo';
                btnMute.style.background = 'rgba(0, 255, 135, 0.08)';
                btnMute.style.color = '#00ff87';
                btnMute.style.borderColor = 'rgba(0, 255, 135, 0.2)';
                updateVolBg(previousVolume);
                
                if (state.backingTrack.eqSettings[4]) {
                    state.backingTrack.eqSettings[4].mute = false;
                }
                
                if (isPlayerMode) {
                    window.electronAPI.sendPlayerAction('control-volume-master', previousVolume);
                    return;
                }
                
                if (state.backingTrack.masterGain) {
                    const db = valueToDb(previousVolume);
                    state.backingTrack.masterGain.gain.value = (db === -Infinity) ? 0 : Math.pow(10, db / 20);
                }
            }
            syncEqSettingsToPlayer();
        });
    }
    
    // Master Volume
    if (volInput && volVal) {
        volInput.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            volVal.textContent = volumeToDbString(val);
            updateVolBg(val);
            
            if (state.backingTrack.eqSettings[4]) {
                state.backingTrack.eqSettings[4].volume = val;
            }
            
            if (btnMute) {
                if (val === 0) {
                    btnMute.classList.add('muted');
                    btnMute.innerHTML = '🔇 Mutado';
                    btnMute.style.background = 'rgba(255, 59, 48, 0.15)';
                    btnMute.style.color = '#ff3b30';
                    btnMute.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                    if (state.backingTrack.eqSettings[4]) {
                        state.backingTrack.eqSettings[4].mute = true;
                    }
                } else {
                    btnMute.classList.remove('muted');
                    btnMute.innerHTML = '🔊 Ativo';
                    btnMute.style.background = 'rgba(0, 255, 135, 0.08)';
                    btnMute.style.color = '#00ff87';
                    btnMute.style.borderColor = 'rgba(0, 255, 135, 0.2)';
                    if (state.backingTrack.eqSettings[4]) {
                        state.backingTrack.eqSettings[4].mute = false;
                    }
                }
            }
            
            if (isPlayerMode) {
                window.electronAPI.sendPlayerAction('control-volume-master', val);
                return;
            }
            
            if (state.backingTrack.masterGain) {
                const db = valueToDb(val);
                state.backingTrack.masterGain.gain.value = (db === -Infinity) ? 0 : Math.pow(10, db / 20);
            }
            
            syncEqSettingsToPlayer();
        });
        
        // Resetar fader master para 0 dB (valor 80) com clique duplo
        volInput.addEventListener('dblclick', () => {
            volInput.value = 80;
            volInput.dispatchEvent(new Event('input'));
        });
        
        // Também permitir clique duplo na linha inteira do volume master para resetar
        const volumeRow = document.querySelector('.bp3-volume-row');
        if (volumeRow) {
            volumeRow.addEventListener('dblclick', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                volInput.value = 80;
                volInput.dispatchEvent(new Event('input'));
            });
        }
    }
    
    // Progress Bar Seeking
    if (progressBar) {
        progressBar.addEventListener('input', (e) => {
            const targetTime = parseFloat(e.target.value);
            if (timeCurrentEl) timeCurrentEl.textContent = formatBackingTime(targetTime);
            
            const pct = (targetTime / (progressBar.max || 1)) * 100;
            const colors = getThemeColorsForSlider();
            progressBar.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${pct}%, ${colors.bg} ${pct}%, ${colors.bg} 100%)`;
        });
        
        progressBar.addEventListener('change', (e) => {
            const targetTime = parseFloat(e.target.value);
            
            if (isPlayerMode) {
                window.electronAPI.sendPlayerAction('control-seek', targetTime);
                return;
            }
            
            if (state.backingTrack.audioBuffers.length > 0) {
                seekBacking(targetTime);
            }
        });
    }
    
    // Metrônomo de Prática (Inspirado no JBL BandBox Trio)
    const btnMetronome = document.getElementById('btnMetronomeStart');
    const btnTap = document.getElementById('btnMetronomeTap');
    const bpmInput = document.getElementById('metronomeBpm');
    
    let metronomeInterval = null;
    let metronomeIsPlaying = false;
    let metronomeTapTimes = [];
    
    const playMetronomeClick = () => {
        if (!state.audioCtx) {
            initAudioContext();
        }
        const ctx = state.audioCtx;
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    };
    
    if (btnMetronome && bpmInput) {
        btnMetronome.addEventListener('click', () => {
            if (metronomeIsPlaying) {
                clearInterval(metronomeInterval);
                metronomeIsPlaying = false;
                btnMetronome.textContent = "▶ Iniciar";
                btnMetronome.classList.remove('metro-active');
                btnMetronome.style.background = 'rgba(0, 255, 135, 0.08)';
                btnMetronome.style.color = '#00ff87';
                btnMetronome.style.borderColor = 'rgba(0, 255, 135, 0.2)';
            } else {
                initAudioContext();
                const bpm = parseInt(bpmInput.value) || 120;
                const intervalMs = (60 / bpm) * 1000;
                
                playMetronomeClick();
                metronomeInterval = setInterval(playMetronomeClick, intervalMs);
                metronomeIsPlaying = true;
                btnMetronome.textContent = "⏹ Parar";
                btnMetronome.classList.add('metro-active');
                btnMetronome.style.background = 'rgba(255, 59, 48, 0.15)';
                btnMetronome.style.color = '#ff3b30';
                btnMetronome.style.borderColor = 'rgba(255, 59, 48, 0.3)';
            }
        });
        
        bpmInput.addEventListener('change', () => {
            let bpm = parseInt(bpmInput.value) || 120;
            bpm = Math.max(40, Math.min(240, bpm));
            bpmInput.value = bpm;
            
            if (metronomeIsPlaying) {
                clearInterval(metronomeInterval);
                const intervalMs = (60 / bpm) * 1000;
                metronomeInterval = setInterval(playMetronomeClick, intervalMs);
            }
        });
    }
    
    if (btnTap && bpmInput) {
        btnTap.addEventListener('click', () => {
            const now = Date.now();
            metronomeTapTimes.push(now);
            if (metronomeTapTimes.length > 4) {
                metronomeTapTimes.shift();
            }
            if (metronomeTapTimes.length > 1) {
                let diffs = [];
                for (let i = 1; i < metronomeTapTimes.length; i++) {
                    diffs.push(metronomeTapTimes[i] - metronomeTapTimes[i - 1]);
                }
                const avgDiff = diffs.reduce((a, b) => a + b) / diffs.length;
                let bpm = Math.round(60000 / avgDiff);
                bpm = Math.max(40, Math.min(240, bpm));
                bpmInput.value = bpm;
                
                if (metronomeIsPlaying) {
                    clearInterval(metronomeInterval);
                    const intervalMs = (60 / bpm) * 1000;
                    metronomeInterval = setInterval(playMetronomeClick, intervalMs);
                }
            }
        });
    }
    
    // Renderizar faders iniciais (desabilitados) para manter a mesa de som sempre aparente
    renderStemsList();

    // Evento de clique para exportação da mixagem personalizada (Minus-One)
    const btnExportMixdown = document.getElementById('btnExportMixdown');
    if (btnExportMixdown) {
        btnExportMixdown.addEventListener('click', async () => {
            await exportMixdown();
        });
    }
}

// Formatar tempo em MM:SS
function formatBackingTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function cleanFileNameForSearch(fileName) {
    if (!fileName) return '';
    // Remover a extensão
    let clean = fileName.replace(/\.[^/.]+$/, "");
    // Remover numeração inicial (ex: "01. ", "01 - ", "12_")
    clean = clean.replace(/^\d+[\s.\-_]+/, "");
    // Remover termos comuns entre parênteses ou colchetes
    clean = clean.replace(/\([^)]*\)/g, "");
    clean = clean.replace(/\[[^\]]*\]/g, "");
    // Remover termos comuns de áudio/vídeo
    clean = clean.replace(/\b(official|video|audio|lyrics|remastered|remaster|hq|hd|live|backing track|studio|cover)\b/gi, "");
    // Substituir traços, sublinhados e múltiplos espaços por um único espaço
    clean = clean.replace(/[\-_]+/g, " ");
    clean = clean.replace(/\s+/g, " ");
    return clean.trim();
}

async function fetchAudioMetadata(fileName) {
    const searchTerm = cleanFileNameForSearch(fileName);
    if (!searchTerm) return null;
    
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const track = data.results[0];
            // Melhorar a resolução da imagem da capa de 100x100 para 400x400
            let coverUrl = track.artworkUrl100 || '';
            if (coverUrl) {
                coverUrl = coverUrl.replace('100x100', '400x400');
            }
            return {
                title: track.trackName || '',
                artist: track.artistName || '',
                album: track.collectionName || '',
                coverUrl: coverUrl
            };
        }
    } catch (e) {
        console.error("Erro ao buscar metadados:", e);
    }
    return null;
}

// Atualizar nó de áudio de um stem em tempo real
function updateStemAudioNode(stemIdx) {
    const settings = state.backingTrack.eqSettings[stemIdx];
    
    // Se estiver no modo Player PIP, encaminhar alterações via IPC e retornar
    if (isPlayerMode) {
        if (window.electronAPI && window.electronAPI.sendPlayerAction) {
            window.electronAPI.sendPlayerAction('control-eq-change', {
                stemIdx: stemIdx,
                settings: settings
            });
        }
        return;
    }
    
    const nodes = state.backingTrack.stemNodes[stemIdx];
    if (!nodes) return;
    
    // Volume & Mute (Ignorar ganho do stem no índice 4, pois a Canção Original é controlada diretamente pelo ganho mestre)
    if (nodes.gainNode && stemIdx !== 4) {
        const db = valueToDb(settings.volume);
        const gainVal = settings.mute ? 0 : (db === -Infinity ? 0 : Math.pow(10, db / 20));
        nodes.gainNode.gain.value = gainVal;
    }

    // EQ de 3 bandas (Graves, Médios, Agudos)
    if (nodes.lowFilter) {
        nodes.lowFilter.gain.value = settings.low || 0;
    }
    if (nodes.midFilter) {
        nodes.midFilter.gain.value = settings.mid || 0;
    }
    if (nodes.highFilter) {
        nodes.highFilter.gain.value = settings.high || 0;
    }
    
    // Sincronizar estado com o Player PIP
    syncEqSettingsToPlayer();
}

// Funções de sincronização para o modo Player PIP (Multi-tela)
function syncEqSettingsToPlayer() {
    if (!isPlayerMode && window.electronAPI && window.electronAPI.sendPlayerAction) {
        window.electronAPI.sendPlayerAction('eq-settings-sync', state.backingTrack.eqSettings);
    }
}

function syncStemsToPlayer() {
    if (window.electronAPI && window.electronAPI.sendPlayerAction) {
        window.electronAPI.sendPlayerAction('stems-loaded', {
            eqSettings: state.backingTrack.eqSettings,
            fileNames: state.backingTrack.fileNames,
            bypassEq: state.backingTrack.bypassEq,
            fileName: state.backingTrack.fileName || '',
            metaTitle: state.backingTrack.metaTitle || '',
            metaArtist: state.backingTrack.metaArtist || '',
            metaCoverUrl: state.backingTrack.metaCoverUrl || '',
            mode: state.backingTrack.mode || 'original'
        });
        sendPlaybackSync();
    }
}

function setEqBypass(bypass) {
    state.backingTrack.bypassEq = bypass;
    
    // Atualizar UI do switch global
    const globalSwitch = document.getElementById('globalBypassSwitch');
    if (globalSwitch) globalSwitch.checked = bypass;
    
    // Sincronizar com a outra janela
    if (window.electronAPI && window.electronAPI.sendPlayerAction) {
        window.electronAPI.sendPlayerAction('bypass-global-sync', bypass);
    }
}

function setChannelBypass(stemIdx, bypass) {
    state.backingTrack.eqSettings[stemIdx].bypass = bypass;
    
    // Atualizar UI do checkbox individual
    const chSwitch = document.getElementById(`chBypass-${stemIdx}`);
    if (chSwitch) chSwitch.checked = bypass;
    
    // Sincronizar com a outra janela
    if (window.electronAPI && window.electronAPI.sendPlayerAction) {
        window.electronAPI.sendPlayerAction('bypass-channel-sync', { stemIdx, bypass });
    }
}

function sendPlaybackSync() {
    if (window.electronAPI && window.electronAPI.sendPlayerAction) {
        let currentElapsed = 0;
        if (state.backingTrack.isPlaying && state.audioCtx) {
            currentElapsed = state.audioCtx.currentTime - state.backingTrack.startTime + state.backingTrack.pauseTime;
        } else {
            currentElapsed = state.backingTrack.pauseTime;
        }
        window.electronAPI.sendPlayerAction('playback-sync', {
            isPlaying: state.backingTrack.isPlaying,
            pauseTime: state.backingTrack.pauseTime,
            duration: state.backingTrack.duration,
            currentElapsed: currentElapsed
        });
    }
}

// ==========================================
// RECURSO 1.5: CONTROLE DE KNOBS ROTATIVOS DO MIXER
// ==========================================
function initializeMixerKnobs(container) {
    const rangeInputs = container.querySelectorAll('.eq-knob-input');
    rangeInputs.forEach(input => {
        // Ocultar slider padrão
        input.style.display = 'none';

        // Criar contêiner do knob
        const knobControl = document.createElement('div');
        knobControl.className = 'knob-control eq-knob-control';
        knobControl.dataset.target = `${input.dataset.idx}-${input.className}`;

        const knobDial = document.createElement('div');
        knobDial.className = 'knob-dial eq-knob-dial';

        const knobPointer = document.createElement('div');
        knobPointer.className = 'knob-pointer';

        knobDial.appendChild(knobPointer);
        knobControl.appendChild(knobDial);

        // Inserir após o input ocultado
        input.parentNode.insertBefore(knobControl, input.nextSibling);

        // Atualizar rotação com base no valor atual do input
        const updateKnobRotation = () => {
            const min = parseFloat(input.min) || -15;
            const max = parseFloat(input.max) || 15;
            const val = parseFloat(input.value) || 0;
            const percent = (val - min) / (max - min);
            const angle = -135 + percent * 270; // -135deg (min) a +135deg (max)
            knobDial.style.transform = `rotate(${angle}deg)`;
            
            // Atualizar o valor em texto
            const valueSpan = input.parentNode.querySelector('.eq-value');
            if (valueSpan) {
                valueSpan.textContent = `${val > 0 ? '+' : ''}${val} dB`;
            }
        };

        updateKnobRotation();

        // Escutar alterações de valor
        input.addEventListener('input', updateKnobRotation);
        input.addEventListener('change', updateKnobRotation);

        // Lógica de arrasto do mouse
        let isDragging = false;
        let startY = 0;
        let startVal = 0;
        const sensitivity = 0.4;

        knobDial.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startVal = parseFloat(input.value) || 0;
            document.body.classList.add('knob-dragging');

            const handleMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const deltaY = startY - moveEvent.clientY;
                const min = parseFloat(input.min) || -15;
                const max = parseFloat(input.max) || 15;
                const range = max - min;

                const deltaVal = (deltaY / 100) * range * sensitivity;
                let newVal = startVal + deltaVal;
                newVal = Math.max(min, Math.min(max, newVal));
                newVal = Math.round(newVal);

                input.value = newVal;
                input.dispatchEvent(new Event('input'));
                input.dispatchEvent(new Event('change'));
            };

            const handleMouseUp = () => {
                isDragging = false;
                document.body.classList.remove('knob-dragging');
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        });

        // Suporte a toque/mobile
        knobDial.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            isDragging = true;
            startY = e.touches[0].clientY;
            startVal = parseFloat(input.value) || 0;

            const handleTouchMove = (moveEvent) => {
                if (!isDragging || moveEvent.touches.length !== 1) return;
                const deltaY = startY - moveEvent.touches[0].clientY;
                const min = parseFloat(input.min) || -15;
                const max = parseFloat(input.max) || 15;
                const range = max - min;
                const deltaVal = (deltaY / 100) * range * sensitivity;
                let newVal = startVal + deltaVal;
                newVal = Math.max(min, Math.min(max, newVal));
                newVal = Math.round(newVal);

                input.value = newVal;
                input.dispatchEvent(new Event('input'));
                input.dispatchEvent(new Event('change'));
            };

            const handleTouchEnd = () => {
                isDragging = false;
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
            };

            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        });
    });
}

// Inicializar Faders verticais customizados (estilo mesa.png) que funcionam por arrasto vertical e clique direto na pista
function initializeMixerFaders(container) {
    const customTracks = container.querySelectorAll('.custom-fader-track');
    customTracks.forEach(track => {
        const idx = parseInt(track.dataset.idx);
        const handle = track.querySelector('.custom-fader-handle');
        const hiddenInput = track.parentNode.querySelector('.stem-volume-slider');
        if (!handle || !hiddenInput) return;

        // Atualizar posição do handle visual baseado no valor atual do input oculto
        const updateHandlePosition = () => {
            const val = parseFloat(hiddenInput.value) || 0;
            // A posição é baseada no bottom (de 0% a 100%)
            handle.style.bottom = `calc(${val}% - (18px * ${val} / 100))`;
        };

        // Escutar eventos de input no slider invisível para mover o fader visual (ex: duplo clique ou sync)
        hiddenInput.addEventListener('input', updateHandlePosition);
        hiddenInput.addEventListener('change', updateHandlePosition);

        // Lógica de arrastar/clicar
        let isDragging = false;

        const handleDrag = (clientY) => {
            const trackRect = track.getBoundingClientRect();
            const trackHeight = trackRect.height;
            
            // Posição Y relativa ao fundo da pista do fader
            let offsetY = trackRect.bottom - clientY;
            
            // Percentagem de 0 a 100
            let pct = (offsetY / trackHeight) * 100;
            pct = Math.max(0, Math.min(100, pct));
            
            hiddenInput.value = Math.round(pct);
            hiddenInput.dispatchEvent(new Event('input'));
            hiddenInput.dispatchEvent(new Event('change'));
        };

        const onMouseDown = (e) => {
            isDragging = true;
            document.body.classList.add('knob-dragging'); // Reutiliza estilo de cursor de arrasto
            
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            handleDrag(clientY);

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                moveEvent.preventDefault();
                const currentY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
                handleDrag(currentY);
            };

            const onMouseUp = () => {
                isDragging = false;
                document.body.classList.remove('knob-dragging');
                if (e.type === 'touchstart') {
                    window.removeEventListener('touchmove', onMouseMove);
                    window.removeEventListener('touchend', onMouseUp);
                } else {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                }
            };

            if (e.type === 'touchstart') {
                window.addEventListener('touchmove', onMouseMove, { passive: false });
                window.addEventListener('touchend', onMouseUp);
            } else {
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            }
        };

        // Eventos no botão/cap do fader
        handle.addEventListener('mousedown', onMouseDown);
        handle.addEventListener('touchstart', onMouseDown, { passive: false });

        // Eventos ao clicar diretamente na pista para pular o fader para aquela altura
        track.addEventListener('mousedown', (e) => {
            if (e.target.closest('.custom-fader-handle')) return;
            onMouseDown(e);
        });
        track.addEventListener('touchstart', (e) => {
            if (e.target.closest('.custom-fader-handle')) return;
            onMouseDown(e);
        }, { passive: false });
    });
}

// Renderizar painel de stems estilo console físico de som com faders verticais e EQ de 3 bandas (mesa.png)
function renderStemsList() {
    const stemsContainer = document.getElementById('stemsVolumeContainer');
    const stemsList = document.getElementById('stemsList');
    const mixerPanel = document.getElementById('mixerPanel');
    
    if (!stemsList) return;
    stemsList.innerHTML = '';
    
    // Ocultar completamente a antiga área do Mixer
    if (mixerPanel) {
        mixerPanel.style.setProperty('display', 'none', 'important');
    }
    
    const hasBuffers = (state.backingTrack.audioBuffers && state.backingTrack.audioBuffers.length > 0) || isPlayerMode;
    const isOriginal = state.backingTrack.mode === 'original' && hasBuffers;
    const isSeparated = state.backingTrack.mode === 'stems' && hasBuffers;
    
    const listItems = [];
    
    const stemNames = ['Voz', 'Bateria', 'Baixo', 'Guitarra'];
    const stemIcons = ['🎤', '🥁', '🎻', '🎸'];
    
    stemNames.forEach((name, i) => {
        listItems.push({
            name: name,
            idx: i,
            icon: stemIcons[i],
            disabled: !isSeparated
        });
    });
    
    listItems.forEach(item => {
        const idx = item.idx;
        const settings = state.backingTrack.eqSettings[idx] || { volume: 80, mute: false, low: 0, mid: 0, high: 0 };
        
        const card = document.createElement('div');
        card.className = 'stem-rack-card';
        card.dataset.idx = idx;
        
        // Estilo especial se inativo
        const opacity = item.disabled ? '0.45' : '1.0';
        const pointerEvents = item.disabled ? 'none' : 'auto';
        
        card.style.opacity = opacity;
        card.style.pointerEvents = pointerEvents;
        
        card.innerHTML = `
            <!-- Channel Header -->
            <div class="channel-header">
                <span class="channel-icon">${item.icon}</span>
                <span class="channel-name">${item.name}</span>
            </div>

            <!-- EQ Section -->
            <div class="channel-eq-section">
                <!-- High EQ -->
                <div class="eq-knob-container">
                    <span class="eq-label">AGUDO (12K)</span>
                    <input type="range" class="eq-knob-input stem-eq-high" data-idx="${idx}" min="-15" max="15" value="${settings.high || 0}" ${item.disabled ? 'disabled' : ''}>
                    <span class="eq-value">${(settings.high || 0) > 0 ? '+' : ''}${settings.high || 0} dB</span>
                </div>
                
                <!-- Mid EQ -->
                <div class="eq-knob-container">
                    <span class="eq-label">MÉDIO (1K)</span>
                    <input type="range" class="eq-knob-input stem-eq-mid" data-idx="${idx}" min="-15" max="15" value="${settings.mid || 0}" ${item.disabled ? 'disabled' : ''}>
                    <span class="eq-value">${(settings.mid || 0) > 0 ? '+' : ''}${settings.mid || 0} dB</span>
                </div>
                
                <!-- Low EQ -->
                <div class="eq-knob-container">
                    <span class="eq-label">GRAVE (80Hz)</span>
                    <input type="range" class="eq-knob-input stem-eq-low" data-idx="${idx}" min="-15" max="15" value="${settings.low || 0}" ${item.disabled ? 'disabled' : ''}>
                    <span class="eq-value">${(settings.low || 0) > 0 ? '+' : ''}${settings.low || 0} dB</span>
                </div>
            </div>

            <!-- Mute Button -->
            <div class="channel-mute-container">
                <button class="stem-mute-toggle" data-idx="${idx}" style="font-size: 0.65rem; padding: 3px 6px; border-radius: 4px; background: ${settings.mute ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 255, 135, 0.08)'}; color: ${settings.mute ? '#ff3b30' : '#00ff87'}; border: 1px solid ${settings.mute ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0, 255, 135, 0.2)'}; cursor: pointer; outline: none; transition: all 0.2s ease; height: 22px; width: 100%;" ${item.disabled ? 'disabled' : ''}>
                    ${settings.mute ? '🔇 Mutado' : '🔊 Ativo'}
                </button>
            </div>

            <!-- Vertical Fader Section -->
            <div class="channel-fader-section">
                <div class="fader-scale">
                    <span>+10</span>
                    <span>+5</span>
                    <span>0</span>
                    <span>-5</span>
                    <span>-10</span>
                    <span>-20</span>
                    <span>-40</span>
                    <span>-&infin;</span>
                </div>
                <div class="fader-track-wrapper">
                    <div class="custom-fader-track" data-idx="${idx}">
                        <div class="custom-fader-groove"></div>
                        <div class="custom-fader-handle" data-idx="${idx}" style="bottom: calc(${settings.volume}% - (18px * ${settings.volume} / 100));">
                            <div class="custom-fader-handle-line"></div>
                        </div>
                    </div>
                    <input type="range" class="stem-volume-slider" data-idx="${idx}" min="0" max="100" value="${settings.volume}" ${item.disabled ? 'disabled' : ''} style="display: none;">
                </div>
            </div>

            <!-- Footer: Volume text & Download -->
            <div class="channel-footer">
                <span class="stem-vol-text">${volumeToDbString(settings.volume)}</span>
                <button class="stem-save-btn" data-idx="${idx}" style="font-size: 0.65rem; padding: 3px 6px; border-radius: 4px; background: rgba(0, 210, 255, 0.12); color: var(--primary-color); border: 1px solid rgba(0, 210, 255, 0.3); cursor: pointer; outline: none; transition: all 0.2s ease; display: flex; align-items: center; gap: 3px; height: 22px;" ${item.disabled ? 'disabled' : ''} title="Baixar trilha individual (WAV)">
                    📥
                </button>
            </div>
        `;
        
        // Resetar fader para 0 dB (valor 80) com 2 cliques rápidos (duplo clique)
        card.addEventListener('dblclick', (e) => {
            if (e.target.closest('button') || e.target.closest('.knob-dial')) return;
            const slider = card.querySelector('.stem-volume-slider');
            if (slider && !slider.disabled) {
                slider.value = 80;
                slider.dispatchEvent(new Event('input'));
                slider.dispatchEvent(new Event('change'));
            }
        });
        
        stemsList.appendChild(card);
    });
    
    // Inicializar os Knobs customizados no Mixer
    initializeMixerKnobs(stemsList);
    // Inicializar os Faders verticais customizados (mesa.png)
    initializeMixerFaders(stemsList);
    
    // Vincular Eventos de Volume (Sliders verticais)
    stemsList.querySelectorAll('.stem-volume-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const val = parseInt(e.target.value);
            if (state.backingTrack.eqSettings[idx]) {
                state.backingTrack.eqSettings[idx].volume = val;
            }
            const card = e.target.closest('.stem-rack-card');
            if (card) {
                const volText = card.querySelector('.stem-vol-text');
                if (volText) volText.textContent = volumeToDbString(val);
            }
            
            // Se for o volume do fader da Canção Original (idx 4), sincroniza com o volume geral do player
            if (idx === 4) {
                const masterVolSlider = document.getElementById('backingVolume');
                if (masterVolSlider) {
                    masterVolSlider.value = val;
                    masterVolSlider.dispatchEvent(new Event('input'));
                }
            } else {
                updateStemAudioNode(idx);
            }
        });
    });

    // Vincular Eventos de EQ (Knobs)
    stemsList.querySelectorAll('.stem-eq-high, .stem-eq-mid, .stem-eq-low').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx);
            const val = parseInt(e.target.value);
            if (state.backingTrack.eqSettings[idx]) {
                if (e.target.classList.contains('stem-eq-high')) {
                    state.backingTrack.eqSettings[idx].high = val;
                } else if (e.target.classList.contains('stem-eq-mid')) {
                    state.backingTrack.eqSettings[idx].mid = val;
                } else if (e.target.classList.contains('stem-eq-low')) {
                    state.backingTrack.eqSettings[idx].low = val;
                }
                updateStemAudioNode(idx);
            }
        });
    });
    
    // Vincular Eventos de Mute
    stemsList.querySelectorAll('.stem-mute-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.idx);
            const settings = state.backingTrack.eqSettings[idx];
            if (!settings) return;
            settings.mute = !settings.mute;
            
            // Atualizar classes visuais
            e.currentTarget.innerHTML = settings.mute ? '🔇 Mutado' : '🔊 Ativo';
            e.currentTarget.style.background = settings.mute ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 255, 135, 0.08)';
            e.currentTarget.style.color = settings.mute ? '#ff3b30' : '#00ff87';
            e.currentTarget.style.borderColor = settings.mute ? 'rgba(255, 59, 48, 0.3)' : 'rgba(0, 255, 135, 0.2)';
            
            // Se for o mute do fader da Canção Original (idx 4), sincroniza com o botão de mute e volume do player
            if (idx === 4) {
                const masterMuteBtn = document.getElementById('btnPlayerMute');
                if (masterMuteBtn) {
                    if (settings.mute) {
                        masterMuteBtn.classList.add('muted');
                    } else {
                        masterMuteBtn.classList.remove('muted');
                    }
                    const masterVolSlider = document.getElementById('backingVolume');
                    if (masterVolSlider) {
                        masterVolSlider.value = settings.mute ? 0 : settings.volume;
                        masterVolSlider.dispatchEvent(new Event('input'));
                    }
                }
            } else {
                updateStemAudioNode(idx);
            }
        });
    });

    // Vincular Eventos de Exportação Individual de Stems
    stemsList.querySelectorAll('.stem-save-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = parseInt(e.currentTarget.dataset.idx);
            await exportIndividualStem(idx);
        });
    });
    
    if (stemsContainer) {
        stemsContainer.style.display = 'flex';
    }
}

function updateBandInfoText(stemIdx, bandIdx) {
    const band = state.backingTrack.eqSettings[stemIdx].bands[bandIdx];
    const infoEl = document.getElementById(`band-info-${stemIdx}-${bandIdx}`);
    if (infoEl) {
        infoEl.textContent = `Ganho: ${band.gain > 0 ? '+' : ''}${band.gain}dB | Freq: ${band.freq}Hz | Q: ${band.q}`;
    }
}

function makeElementDraggable(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;
    handle.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        // Evitar arrastar se o clique for em controles como sliders, botões, etc
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'BUTTON' || 
            e.target.classList.contains('stem-vol-val') || 
            e.target.closest('.eq-band-selector-tabs') || 
            e.target.closest('.eq-control-slider') || 
            e.target.closest('.stem-slider')) {
            return;
        }
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        pos3 = clientX;
        pos4 = clientY;
        document.onmouseup = closeDragElement;
        document.ontouchend = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;
    }
}

function valueToDb(val) {
    if (val === 0) return -Infinity;
    if (val === 80) return 0;
    if (val > 80) {
        return (val - 80) * 0.5;
    } else {
        return -60 + (val - 1) * (60 / 79);
    }
}

function volumeToDbString(val) {
    const db = valueToDb(val);
    if (db === -Infinity) return "-∞ dB";
    if (Math.abs(db) < 0.05) return "0.0 dB";
    return (db > 0 ? "+" : "") + db.toFixed(1) + " dB";
}

function makeStemCardDraggable(el, handle) {
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    
    handle.onmousedown = dragMouseDown;
    handle.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        // Evitar arrastar se o clique for em controles
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'BUTTON' || 
            e.target.classList.contains('stem-vol-val') || 
            e.target.closest('.eq-band-selector-tabs') || 
            e.target.closest('.eq-control-slider') || 
            e.target.closest('.stem-slider')) {
            return;
        }
        
        // Apenas preventDefault se for mouse (para evitar comportamentos estranhos em touch)
        if (e.type === 'mousedown') {
            e.preventDefault();
        }
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        startX = clientX;
        startY = clientY;
        currentX = 0;
        currentY = 0;
        
        el.style.zIndex = '1000';
        el.style.opacity = '0.85';
        
        document.onmouseup = closeDragElement;
        document.ontouchend = closeDragElement;
        document.onmousemove = elementDrag;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        currentX = clientX - startX;
        currentY = clientY - startY;
        
        el.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    function closeDragElement(e) {
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;
        
        el.style.zIndex = '';
        el.style.opacity = '';
        el.style.transform = '';
        
        let clientX, clientY;
        if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const stemsList = document.getElementById('stemsList');
        if (!stemsList) return;
        
        const containerRect = stemsList.getBoundingClientRect();
        
        // Determinar o slot final baseado nas coordenadas do mouse
        const boundaryX = containerRect.left + containerRect.width / 2;
        const boundaryY = containerRect.top + containerRect.height / 2;
        
        let endSlot = 0;
        if (clientX < boundaryX && clientY < boundaryY) {
            endSlot = 0; // Superior Esquerdo
        } else if (clientX >= boundaryX && clientY < boundaryY) {
            endSlot = 1; // Superior Direito
        } else if (clientX < boundaryX && clientY >= boundaryY) {
            endSlot = 2; // Inferior Esquerdo
        } else {
            endSlot = 3; // Inferior Direito
        }
        
        const startSlot = parseInt(el.dataset.slot);
        if (!isNaN(startSlot) && startSlot !== endSlot) {
            // Encontrar o outro card que estava no slot de destino
            const otherCard = stemsList.querySelector(`.stem-rack-card[data-slot="${endSlot}"]`);
            if (otherCard) {
                // Trocar os atributos data-slot
                el.dataset.slot = endSlot;
                otherCard.dataset.slot = startSlot;
                
                // Trocar as propriedades de ordenação CSS
                el.style.order = endSlot;
                otherCard.style.order = startSlot;
                
                // Atualizar o array de estado cardOrder
                const idx1 = parseInt(el.dataset.idx);
                const idx2 = parseInt(otherCard.dataset.idx);
                if (state.backingTrack.cardOrder) {
                    state.backingTrack.cardOrder[endSlot] = idx1;
                    state.backingTrack.cardOrder[startSlot] = idx2;
                }
                // Cartões reordenados com sucesso
            }
        }
    }
}

// Iniciar a reprodução do áudio
function playBacking() {
    if (state.backingTrack.isPlaying) return;
    
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }
    
    const offset = state.backingTrack.pauseTime;
    startPlayback(offset);
}

// Criar fontes e iniciar playback a partir de um offset específico
function startPlayback(offset) {
    const ctx = state.audioCtx;
    
    // Criar master gain se não existir
    if (!state.backingTrack.masterGain) {
        state.backingTrack.masterGain = ctx.createGain();
        const vol = parseInt(document.getElementById('backingVolume').value);
        state.backingTrack.masterGain.gain.value = vol / 100;
        
        // Conectar masterGain direto à saída final de áudio (speakers)
        state.backingTrack.masterGain.connect(ctx.destination);
    }
    
    // Guardar referências globais contra Garbage Collection (Chromium Bug Workaround)
    window._activeAudioNodes = [];
    window._activeAudioNodes.push(state.backingTrack.masterGain);
    
    state.backingTrack.sources = [];
    state.backingTrack.gains = [];
    
    state.backingTrack.startTime = ctx.currentTime;
    state.backingTrack.pauseTime = offset;
    state.backingTrack.isPlaying = true;

    // Atualizar UI local
    const btnPlay = document.getElementById('btnPlayBacking');
    if (btnPlay) {
        btnPlay.textContent = "⏸";
        btnPlay.classList.add('playing');
    }
    const wave = document.querySelector('.bp3-wave-icon');
    if (wave) wave.classList.add('playing');
    
    // Identificar a trilha mais longa para monitorar o término correto
    let maxDurationIdx = 0;
    let maxDuration = 0;
    state.backingTrack.audioBuffers.forEach((buffer, idx) => {
        if (buffer.duration > maxDuration) {
            maxDuration = buffer.duration;
            maxDurationIdx = idx;
        }
    });
    
    let primarySource = null;
    
    state.backingTrack.audioBuffers.forEach((buffer, idx) => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const stemGain = ctx.createGain();
        const settingsIdx = (state.backingTrack.mode === 'original') ? 4 : idx;
        const settings = state.backingTrack.eqSettings[settingsIdx] || { volume: 80, mute: false };
        const isMuted = settings.mute;
        const volumeVal = settings.volume;
        
        let gainVal = 1.0;
        if (settingsIdx !== 4) {
            const db = valueToDb(volumeVal);
            gainVal = isMuted ? 0 : (db === -Infinity ? 0 : Math.pow(10, db / 20));
        } else {
            if (isMuted) gainVal = 0;
        }
        stemGain.gain.value = gainVal;
        
        // Criar filtros EQ de 3 bandas (Graves, Médios, Agudos)
        const lowFilter = ctx.createBiquadFilter();
        lowFilter.type = 'lowshelf';
        lowFilter.frequency.value = 80;
        lowFilter.gain.value = settings.low || 0;

        const midFilter = ctx.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.Q.value = 1.0;
        midFilter.frequency.value = 1000;
        midFilter.gain.value = settings.mid || 0;

        const highFilter = ctx.createBiquadFilter();
        highFilter.type = 'highshelf';
        highFilter.frequency.value = 12000;
        highFilter.gain.value = settings.high || 0;

        // Conectar na cadeia: source -> lowFilter -> midFilter -> highFilter -> stemGain -> masterGain
        source.connect(lowFilter);
        lowFilter.connect(midFilter);
        midFilter.connect(highFilter);
        highFilter.connect(stemGain);
        stemGain.connect(state.backingTrack.masterGain);

        // Salvar nós no estado local do canal
        state.backingTrack.stemNodes[settingsIdx] = {
            gainNode: stemGain,
            lowFilter: lowFilter,
            midFilter: midFilter,
            highFilter: highFilter
        };

        // Salvar referências no array global do window para evitar Garbage Collection
        window._activeAudioNodes.push(source, lowFilter, midFilter, highFilter, stemGain);
        
        state.backingTrack.sources.push(source);
        state.backingTrack.gains.push(stemGain);
        
        source.start(0, offset);
        
        if (idx === maxDurationIdx) {
            primarySource = source;
        }
    });
    
    // Notificar início de playback para o Player PIP
    sendPlaybackSync();
    
    if (primarySource) {
        primarySource.onended = () => {
            if (state.backingTrack.isPlaying) {
                const elapsed = ctx.currentTime - state.backingTrack.startTime;
                if (elapsed >= (state.backingTrack.duration - offset - 0.5)) {
                    stopBacking();
                }
            }
        };
    }
    
    const progressBar = document.getElementById('backingProgressBar');
    const timeCurrentEl = document.getElementById('backingTimeCurrent');
    
    if (progressBar) {
        progressBar.disabled = false;
        progressBar.removeAttribute('disabled');
        progressBar.max = Math.floor(state.backingTrack.duration) || 100;
    }
    
    if (state.backingTrack.progressBarInterval) {
        clearInterval(state.backingTrack.progressBarInterval);
    }
    
    state.backingTrack.progressBarInterval = setInterval(() => {
        if (!state.backingTrack.isPlaying) return;
        const currentElapsed = ctx.currentTime - state.backingTrack.startTime + offset;
        
        if (currentElapsed <= state.backingTrack.duration) {
            state.backingTrack.currentElapsed = currentElapsed; // Salvar no estado global
            progressBar.value = Math.floor(currentElapsed);
            timeCurrentEl.textContent = formatBackingTime(currentElapsed);
            
            // Preenchimento dinâmico do progresso (RealPlayer Style)
            const pct = (progressBar.value / (progressBar.max || 1)) * 100;
            const colors = getThemeColorsForSlider();
            progressBar.style.background = `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${pct}%, ${colors.bg} ${pct}%, ${colors.bg} 100%)`;
            
            // Sincronizar seekbar customizado RealPlayer
            if (state.backingTrack.updateCustomProgressBarUI) {
                state.backingTrack.updateCustomProgressBarUI();
            }
        }
        
        // Sincronizar progresso com o Player PIP
        sendPlaybackSync();
    }, 250);
}

function pauseBacking() {
    if (!state.backingTrack.isPlaying) return;
    
    state.backingTrack.isPlaying = false;
    clearInterval(state.backingTrack.progressBarInterval);
    
    state.backingTrack.pauseTime += (state.audioCtx.currentTime - state.backingTrack.startTime);
    state.backingTrack.currentElapsed = state.backingTrack.pauseTime; // Salvar no estado global
    stopBackingSources();
    
    // Atualizar UI local
    const btnPlay = document.getElementById('btnPlayBacking');
    if (btnPlay) {
        btnPlay.textContent = "▶";
        btnPlay.classList.remove('playing');
    }
    const wave = document.querySelector('.bp3-wave-icon');
    if (wave) wave.classList.remove('playing');
    
    // Notificar pausa para o Player PIP
    sendPlaybackSync();
}

function stopBacking() {
    state.backingTrack.isPlaying = false;
    clearInterval(state.backingTrack.progressBarInterval);
    state.backingTrack.pauseTime = 0;
    state.backingTrack.currentElapsed = 0; // Reset no estado global
    
    stopBackingSources();
    
    const progressBar = document.getElementById('backingProgressBar');
    const timeCurrentEl = document.getElementById('backingTimeTotal'); // Apenas para contextualizar
    const realTimeCurrentEl = document.getElementById('backingTimeCurrent');
    if (progressBar) {
        progressBar.value = 0;
        progressBar.style.background = '';
    }
    if (realTimeCurrentEl) realTimeCurrentEl.textContent = "00:00";
    
    // Resetar seekbar customizado RealPlayer para posição zero
    if (state.backingTrack.updateCustomProgressBarUI) {
        state.backingTrack.updateCustomProgressBarUI();
    }
    
    // Atualizar UI local
    const btnPlay = document.getElementById('btnPlayBacking');
    if (btnPlay) {
        btnPlay.textContent = "▶";
        btnPlay.classList.remove('playing');
    }
    const wave = document.querySelector('.bp3-wave-icon');
    if (wave) wave.classList.remove('playing');
    
    // Notificar stop para o Player PIP
    sendPlaybackSync();
}

function stopBackingSources() {
    window._activeAudioNodes = [];
    if (state.backingTrack.sources) {
        state.backingTrack.sources.forEach(src => {
            try { src.stop(); } catch (e) {}
            try { src.disconnect(); } catch (e) {}
        });
        state.backingTrack.sources = [];
    }
    
    if (state.backingTrack.stemNodes) {
        state.backingTrack.stemNodes.forEach(nodes => {
            if (nodes) {
                if (nodes.hpfNodes) {
                    nodes.hpfNodes.forEach(n => {
                        try { if (n) n.disconnect(); } catch (e) {}
                    });
                } else {
                    try { if (nodes.hpfNode) nodes.hpfNode.disconnect(); } catch (e) {}
                }
                
                if (nodes.lpfNodes) {
                    nodes.lpfNodes.forEach(n => {
                        try { if (n) n.disconnect(); } catch (e) {}
                    });
                } else {
                    try { if (nodes.lpfNode) nodes.lpfNode.disconnect(); } catch (e) {}
                }
                
                if (nodes.bandNodes) {
                    nodes.bandNodes.forEach(bn => {
                        try { if (bn) bn.disconnect(); } catch (e) {}
                    });
                }
                try { if (nodes.gainNode) nodes.gainNode.disconnect(); } catch (e) {}
            }
        });
        state.backingTrack.stemNodes = Array.from({ length: 5 }, () => ({
            hpfNode: null,
            lpfNode: null,
            hpfNodes: [],
            lpfNodes: [],
            bandNodes: [],
            gainNode: null
        }));
    }
}

function seekBacking(targetTime) {
    const isPlayingBefore = state.backingTrack.isPlaying;
    
    stopBackingSources();
    clearInterval(state.backingTrack.progressBarInterval);
    
    state.backingTrack.pauseTime = targetTime;
    state.backingTrack.currentElapsed = targetTime; // Salvar no estado global
    
    if (isPlayingBefore) {
        state.backingTrack.isPlaying = false;
        startPlayback(targetTime);
    } else {
        const timeCurrentEl = document.getElementById('backingTimeCurrent');
        if (timeCurrentEl) timeCurrentEl.textContent = formatBackingTime(targetTime);
    }
}

// ==========================================
// RECURSO 11: GERENCIAMENTO DE ABAS E VISUALIZADOR DE ÁUDIO
// ==========================================
function initMainTabs() {
    const tabBtns = document.querySelectorAll('.main-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.mainTab;
            
            // Ativar botão selecionado
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Exibir conteúdo da aba correspondente
            document.querySelectorAll('.main-tab-content').forEach(content => {
                if (content.id === targetTab) {
                    content.style.display = 'block';
                    content.classList.add('active');
                } else {
                    content.style.display = 'none';
                    content.classList.remove('active');
                }
            });
            
            // Se entrar no modo estúdio, iniciar visualizador e AudioContext
            if (targetTab === 'studioView') {
                initAudioContext();
                if (state.audioCtx.state === 'suspended') {
                    state.audioCtx.resume();
                }
                startVisualizerDrawing();
            } else if (targetTab === 'effectsView') {
                if (typeof alignLibraryCardWithDelay === 'function') {
                    setTimeout(alignLibraryCardWithDelay, 50);
                }
            }
        });
    });
}

let isVisualizerDrawing = false;
function startVisualizerDrawing() {
    if (isVisualizerDrawing) return;
    
    const canvas = document.getElementById('studioVisualizer');
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    
    // Garantir que o analisador existe
    if (!state.nodes.analyser) {
        initAudioContext();
    }
    
    const analyser = state.nodes.analyser;
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    isVisualizerDrawing = true;
    
    // Ajustar tamanho do canvas
    const resizeCanvas = () => {
        if (!canvas) return;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function draw() {
        if (!isVisualizerDrawing || !document.getElementById('studioView').classList.contains('active')) {
            isVisualizerDrawing = false;
            return;
        }
        
        requestAnimationFrame(draw);
        if (state.backingTrack.playerMode === 'youtube' && state.backingTrack.isPlaying) {
            // Gerar onda senoidal simulada com ruído harmônico para parecer áudio real tocando
            const time = Date.now() * 0.005;
            for (let i = 0; i < bufferLength; i++) {
                const wave1 = Math.sin(i * 0.04 + time * 3) * 35;
                const wave2 = Math.sin(i * 0.09 + time * 4.5) * 15;
                const noise = (Math.random() - 0.5) * 3;
                dataArray[i] = 128 + wave1 + wave2 + noise;
            }
        } else if (analyser) {
            analyser.getByteTimeDomainData(dataArray);
        } else {
            dataArray.fill(128);
        }
        
        // Fundo do visualizador
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
        const isTweedTheme = document.documentElement.getAttribute('data-theme') === 'tweed';
        
        if (isLightTheme) {
            canvasCtx.fillStyle = '#fafafc';
        } else if (isTweedTheme) {
            canvasCtx.fillStyle = '#fcf9f2';
        } else {
            canvasCtx.fillStyle = '#050508';
        }
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar linhas de grade (estilo console de estúdio)
        canvasCtx.strokeStyle = isLightTheme ? 'rgba(0, 0, 0, 0.03)' : (isTweedTheme ? 'rgba(139, 90, 43, 0.04)' : 'rgba(255, 255, 255, 0.02)');
        canvasCtx.lineWidth = 1;
        
        // Linhas de grade horizontais
        for (let y = 15; y < canvas.height; y += 30) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, y);
            canvasCtx.lineTo(canvas.width, y);
            canvasCtx.stroke();
        }
        // Linhas de grade verticais
        for (let x = 40; x < canvas.width; x += 80) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, 0);
            canvasCtx.lineTo(x, canvas.height);
            canvasCtx.stroke();
        }
        
        // Linha central de silêncio
        canvasCtx.strokeStyle = isLightTheme ? 'rgba(0, 0, 0, 0.05)' : (isTweedTheme ? 'rgba(139, 90, 43, 0.06)' : 'rgba(255, 255, 255, 0.04)');
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height / 2);
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        
        // Cores do sinal do osciloscópio baseadas no tema ativo
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#00d2ff';
        
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = primaryColor;
        
        // Adicionar brilho neon apenas em temas escuros para melhor estética
        if (!isLightTheme && !isTweedTheme) {
            canvasCtx.shadowBlur = 6;
            canvasCtx.shadowColor = primaryColor;
        } else {
            canvasCtx.shadowBlur = 0;
        }
        
        canvasCtx.beginPath();
        
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;
            
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        
        // Resetar sombra do canvas para desenhos futuros
        canvasCtx.shadowBlur = 0;
    }
    
    draw();
}

function initStemSeparator() {
    const dropzone = document.getElementById('stemDropzone');
    const fileInput = document.getElementById('stemInputFile');
    const pathDisplay = document.getElementById('stemInputFilePath');
    const btnSeparate = document.getElementById('btnSeparateStems');
    const progressWrap = document.getElementById('stemProgressWrapper');
    const progressBar = document.getElementById('stemProgressBar');
    const progressMsg = document.getElementById('stemProgressMsg');
    const resultPanel = document.getElementById('stemResultPanel');

    if (!dropzone || !btnSeparate) return;

    let isSeparating = false;

    // Abrir seleção de arquivos ao clicar na zona
    dropzone.addEventListener('click', () => {
        if (isSeparating) return;
        fileInput.click();
    });

    // Drag e Drop do mouse
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isSeparating) return;
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        if (isSeparating) return;
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            fileInput.files = files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    }, false);

    // Mudança no arquivo selecionado
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        pathDisplay.value = file.path || file.name;
        btnSeparate.disabled = false;
        const btnPlay = document.getElementById('btnPlayBacking');
        const btnStop = document.getElementById('btnStopBacking');
        if (btnPlay) btnPlay.removeAttribute('disabled');
        if (btnStop) btnStop.removeAttribute('disabled');

        state.backingTrack.fileName = file.name;

        // Atualizar interface do Dropzone
        dropzone.classList.add('has-file');
        const fileNameEl = document.getElementById('dropzoneFileName');
        const dropzoneText = dropzone.querySelector('.dropzone-text');
        const dropzoneSubtext = dropzone.querySelector('.dropzone-subtext');
        const dropzoneIcon = dropzone.querySelector('.dropzone-icon');

        if (fileNameEl) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            fileNameEl.textContent = `${file.name} (${sizeMb} MB)`;
            fileNameEl.setAttribute('title', `${file.name} (${sizeMb} MB)`);
        }

        const fileInfoEl = dropzone.querySelector('.dropzone-file-info');
        if (fileInfoEl) fileInfoEl.style.display = 'flex';

        if (dropzoneText) dropzoneText.textContent = 'Arquivo Selecionado';
        if (dropzoneSubtext) dropzoneSubtext.textContent = 'Clique em "Separar" para processar';
        if (dropzoneIcon) dropzoneIcon.textContent = '🎵';

        const titleEl = document.getElementById('playerTrackTitle');
        const subtitleEl = document.getElementById('playerTrackSubtitle');
        const coverEl = document.getElementById('playerTrackCover');
        const iconEl = document.getElementById('playerTrackIcon');
        
        // Estado inicial de carregamento
        if (titleEl) titleEl.textContent = file.name;
        if (subtitleEl) subtitleEl.textContent = "Buscando metadados e aguardando processamento...";
        if (coverEl) coverEl.style.display = 'none';
        if (iconEl) iconEl.style.display = 'flex';

        // Buscar metadados em paralelo assim que o arquivo subir para o software
        fetchAudioMetadata(file.name).then(metadata => {
            // Se o usuário já tiver mudado de arquivo enquanto a busca ocorria, ignorar
            if (state.backingTrack.fileName !== file.name) return;

            if (metadata) {
                if (titleEl) titleEl.textContent = metadata.title;
                if (subtitleEl) subtitleEl.textContent = `${metadata.artist} — ${metadata.album || 'Stems'} (Aguardando Separação)`;
                if (coverEl) {
                    coverEl.src = metadata.coverUrl;
                    coverEl.style.display = 'block';
                }
                if (iconEl) iconEl.style.display = 'none';

                state.backingTrack.metaTitle = metadata.title;
                state.backingTrack.metaArtist = `${metadata.artist} — ${metadata.album || 'Stems'}`;
                state.backingTrack.metaCoverUrl = metadata.coverUrl;
            } else {
                if (titleEl) titleEl.textContent = file.name;
                if (subtitleEl) subtitleEl.textContent = "Aguardando início da separação por IA...";
                if (coverEl) coverEl.style.display = 'none';
                if (iconEl) iconEl.style.display = 'flex';

                state.backingTrack.metaTitle = file.name;
                state.backingTrack.metaArtist = "Stems prontas para mixagem";
                state.backingTrack.metaCoverUrl = "";
            }
            syncStemsToPlayer();
        }).catch(err => {
            console.error("Erro ao buscar metadados em paralelo:", err);
        });
    });

    // Atualização de progresso da IA
    if (window.stemAPI && window.stemAPI.onProgress) {
        window.stemAPI.onProgress((data) => {
            if (progressBar && progressMsg) {
                progressBar.style.width = `${data.pct}%`;
                progressMsg.textContent = data.msg;
            }
        });
    }

    // Clique no botão Separar
    btnSeparate.addEventListener('click', async () => {
        const filePath = pathDisplay.value;
        if (!filePath || !window.stemAPI) return;

        // Resetar playback anterior e limpar temporários antigos ativos
        stopBacking();
        await cleanupActiveTmpDir();
        state.backingTrack.audioBuffers = [];
        state.backingTrack.fileNames = [];
        initAudioContext();
        
        const stemsList = document.getElementById('stemsList');
        if (stemsList) {
            stemsList.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 35px 15px; text-align: center; border: 1px dashed var(--primary-color); border-radius: 6px; background: var(--primary-glow);">
                    <span style="font-size: 1.5rem; margin-bottom: 8px;">🤖</span>
                    <span style="font-size: 0.72rem; font-weight: bold; color: var(--primary-color); margin-bottom: 4px;">Separando Faixas com IA...</span>
                    <span style="font-size: 0.62rem; color: var(--text-muted); line-height: 1.4; max-width: 230px;">O processador local está decodificando e isolando as trilhas da música. Aguarde a finalização!</span>
                </div>
            `;
        }

        // Alterar estado de processamento
        isSeparating = true;
        btnSeparate.disabled = true;
        dropzone.style.opacity = '0.5';
        dropzone.style.cursor = 'not-allowed';
        
        progressWrap.style.display = 'flex';
        progressBar.style.width = '0%';
        progressMsg.textContent = 'Iniciando IA (carregando pesos)...';
        resultPanel.style.display = 'none';
        
        const subtitleEl = document.getElementById('playerTrackSubtitle');
        if (subtitleEl) subtitleEl.textContent = "Separando trilhas por IA...";

        try {
            const result = await window.stemAPI.separate(filePath);
            if (!result.success) {
                logConsole(`Falha na separação: ${result.error}`, 'error');
                progressWrap.style.display = 'none';
                return;
            }

            // Decodificar canais obtidos
            progressMsg.textContent = 'Decodificando áudio da Voz...';
            progressBar.style.width = '90%';
            
            const stemOrder = ['vocals', 'drums', 'bass', 'other'];
            const displayNames = ['Voz', 'Bateria', 'Baixo', 'Guitarra'];
            const buffers = [];
            
            for (let i = 0; i < stemOrder.length; i++) {
                const name = stemOrder[i];
                const stemPath = result.paths[name];
                progressMsg.textContent = `Decodificando ${displayNames[i]}...`;
                
                // Ler via buffer IPC
                const arrayBuffer = await window.stemAPI.readBuffer(stemPath);
                if (!arrayBuffer) {
                    throw new Error(`Não foi possível carregar o arquivo da stem: ${name}`);
                }
                
                // Converter Uint8Array para ArrayBuffer
                let rawBuffer = arrayBuffer;
                if (arrayBuffer instanceof Uint8Array || arrayBuffer.buffer) {
                    rawBuffer = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
                }
                
                // Decodificação via Web Audio API
                const decodedBuffer = await new Promise((resolve, reject) => {
                    state.audioCtx.decodeAudioData(rawBuffer, resolve, reject);
                });
                
                buffers.push(decodedBuffer);
            }

            // Salvar buffers no estado global
            state.backingTrack.audioBuffers = buffers;
            state.backingTrack.fileNames = displayNames;
            state.backingTrack.mode = 'stems';

            // Salvar referências temporárias ativas no estado global
            state.backingTrack.tmpPaths = result.paths;
            state.backingTrack.tmpDir = result.tmpDir;

            // Renderizar faders e equalizadores
            renderStemsList();

            // Configurar tempos de reprodução
            state.backingTrack.duration = Math.max(...state.backingTrack.audioBuffers.map(b => b.duration));
            document.getElementById('backingTimeTotal').textContent = formatBackingTime(state.backingTrack.duration);
            document.getElementById('backingTimeCurrent').textContent = "00:00";
            
            const backingProgressBar = document.getElementById('backingProgressBar');
            if (backingProgressBar) {
                backingProgressBar.value = 0;
                backingProgressBar.max = Math.floor(state.backingTrack.duration);
                backingProgressBar.disabled = false;
                backingProgressBar.removeAttribute('disabled');
            }
            
            // Ativar seekbar customizado RealPlayer (remover estado disabled)
            if (state.backingTrack.updateCustomProgressBarUI) {
                state.backingTrack.updateCustomProgressBarUI();
            }

            document.getElementById('backingFileName').textContent = "✨ Faixas Separadas: " + displayNames.join(' + ');
            document.getElementById('btnPlayBacking').disabled = false;
            document.getElementById('btnStopBacking').disabled = false;

            // Ativar botões de ação e mixdown
            const btnSave = document.getElementById('btnSaveToLibrary');
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.textContent = "💾 Salvar";
                btnSave.style.background = "rgba(46, 204, 113, 0.15)";
                btnSave.style.color = "#2ecc71";
                btnSave.style.borderColor = "rgba(46, 204, 113, 0.3)";
            }
            const btnExportMixdown = document.getElementById('btnExportMixdown');
            if (btnExportMixdown) btnExportMixdown.removeAttribute('disabled');

            const fileName = filePath.split(/[/\\]/).pop();
            const titleEl = document.getElementById('playerTrackTitle');
            const subtitleEl = document.getElementById('playerTrackSubtitle');
            const coverEl = document.getElementById('playerTrackCover');
            const iconEl = document.getElementById('playerTrackIcon');
            
            // Se já temos metadados pré-carregados para este arquivo, basta usá-los e limpar o status "(Aguardando Separação)"
            if (state.backingTrack.metaTitle && state.backingTrack.fileName === fileName) {
                if (titleEl) titleEl.textContent = state.backingTrack.metaTitle;
                if (subtitleEl) subtitleEl.textContent = state.backingTrack.metaArtist;
                if (coverEl && state.backingTrack.metaCoverUrl) {
                    coverEl.src = state.backingTrack.metaCoverUrl;
                    coverEl.style.display = 'block';
                    if (iconEl) iconEl.style.display = 'none';
                } else {
                    if (coverEl) coverEl.style.display = 'none';
                    if (iconEl) iconEl.style.display = 'flex';
                }
            } else {
                if (subtitleEl) subtitleEl.textContent = "Buscando metadados...";
                const metadata = await fetchAudioMetadata(fileName);
                if (metadata) {
                    if (titleEl) titleEl.textContent = metadata.title;
                    if (subtitleEl) subtitleEl.textContent = `${metadata.artist} — ${metadata.album || 'Stems'}`;
                    if (coverEl) {
                        coverEl.src = metadata.coverUrl;
                        coverEl.style.display = 'block';
                    }
                    if (iconEl) iconEl.style.display = 'none';
                    
                    state.backingTrack.fileName = fileName;
                    state.backingTrack.metaTitle = metadata.title;
                    state.backingTrack.metaArtist = `${metadata.artist} — ${metadata.album || 'Stems'}`;
                    state.backingTrack.metaCoverUrl = metadata.coverUrl;
                } else {
                    if (titleEl) titleEl.textContent = fileName;
                    if (subtitleEl) subtitleEl.textContent = "Stems prontas para mixagem";
                    if (coverEl) coverEl.style.display = 'none';
                    if (iconEl) iconEl.style.display = 'flex';
                    
                    state.backingTrack.fileName = fileName;
                    state.backingTrack.metaTitle = fileName;
                    state.backingTrack.metaArtist = "Stems prontas para mixagem";
                    state.backingTrack.metaCoverUrl = "";
                }
            }

            syncStemsToPlayer();

            // Feedback de sucesso
            logConsole("✅ Separação de faixas concluída com sucesso!", "success");
            resultPanel.style.display = 'flex';

        } catch (error) {
            console.error("Separation pipeline failed:", error);
            logConsole(`Erro no processamento das stems: ${error.message}`, "error");
            alert(`Erro no processamento de áudio: ${error.message}`);
        } finally {
            progressWrap.style.display = 'none';
            isSeparating = false;
            btnSeparate.disabled = false;
            dropzone.style.opacity = '1';
            dropzone.style.cursor = 'pointer';
        }
    });
}

// ==========================================
// BIBLIOTECA DE TRILHAS SEPARADAS (IA LOCAL)
// ==========================================
async function cleanupActiveTmpDir() {
    if (state.backingTrack.tmpDir && window.stemAPI && window.stemAPI.cleanup) {
        try {
            await window.stemAPI.cleanup(state.backingTrack.tmpDir);
            state.backingTrack.tmpDir = null;
            state.backingTrack.tmpPaths = null;
        } catch (e) {
            console.error("Erro ao limpar diretório temporário ativo:", e);
        }
    }
}

async function saveToLibrary() {
    const tmpPaths = state.backingTrack.tmpPaths;
    const name = state.backingTrack.metaTitle || (state.backingTrack.fileName ? state.backingTrack.fileName.replace(/\.[^/.]+$/, "") : "Nova_Musica");
    
    if (!tmpPaths || !window.stemAPI) {
        alert("Nenhuma stem temporária ativa para salvar. Certifique-se de realizar a separação por IA primeiro.");
        return;
    }
    
    const btnSave = document.getElementById('btnSaveToLibrary');
    if (btnSave) btnSave.disabled = true;
    
    try {
        const meta = {
            title: state.backingTrack.metaTitle || name,
            artist: state.backingTrack.metaArtist || "Stems prontas para mixagem",
            coverUrl: state.backingTrack.metaCoverUrl || "",
            duration: state.backingTrack.duration
        };
        
        logConsole(`Salvando "${meta.title}" na biblioteca local...`, 'info');
        const saveResult = await window.stemAPI.saveSeparated(name, tmpPaths, meta);
        
        if (saveResult.success) {
            logConsole(`✅ Música "${meta.title}" salva na biblioteca com sucesso!`, 'success');
            alert(`Música "${meta.title}" foi salva permanentemente na biblioteca local!`);
            
            if (btnSave) {
                btnSave.textContent = "💾 Salvo";
                btnSave.style.background = "rgba(46, 204, 113, 0.08)";
                btnSave.style.color = "#2ecc71";
                btnSave.style.borderColor = "rgba(46, 204, 113, 0.2)";
            }
            
            await renderStemLibraryList();
        } else {
            throw new Error(saveResult.error);
        }
    } catch (e) {
        console.error("Erro ao salvar na biblioteca:", e);
        logConsole(`Erro ao salvar na biblioteca: ${e.message}`, 'error');
        alert(`Erro ao salvar na biblioteca: ${e.message}`);
        if (btnSave) btnSave.disabled = false;
    }
}

async function loadStemsFromLibraryPath(item) {
    stopBacking();
    state.backingTrack.audioBuffers = [];
    state.backingTrack.fileNames = [];
    initAudioContext();
    
    const stemsList = document.getElementById('stemsList');
    if (stemsList) {
        stemsList.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 35px 15px; text-align: center; border: 1px dashed var(--primary-color); border-radius: 6px; background: var(--primary-glow);">
                <span style="font-size: 1.5rem; margin-bottom: 8px;">📁</span>
                <span style="font-size: 0.72rem; font-weight: bold; color: var(--primary-color); margin-bottom: 4px;">Carregando Faixas...</span>
                <span style="font-size: 0.62rem; color: var(--text-muted); line-height: 1.4; max-width: 230px;">Decodificando arquivos de áudio das stems salvas localmente...</span>
            </div>
        `;
    }
    
    const titleEl = document.getElementById('playerTrackTitle');
    const subtitleEl = document.getElementById('playerTrackSubtitle');
    const coverEl = document.getElementById('playerTrackCover');
    const iconEl = document.getElementById('playerTrackIcon');
    
    if (titleEl) titleEl.textContent = item.meta.title || item.name;
    if (subtitleEl) subtitleEl.textContent = item.isFile ? "Decodificando arquivo original..." : "Decodificando stems da biblioteca...";
    
    try {
        const buffers = [];
        let displayNames = [];
        
        if (item.isFile) {
            const filePath = item.paths.original;
            const arrayBuffer = await window.stemAPI.readBuffer(filePath);
            if (!arrayBuffer) {
                throw new Error(`Falha ao ler o arquivo: ${item.name}`);
            }
            
            let rawBuffer = arrayBuffer;
            if (arrayBuffer instanceof Uint8Array || arrayBuffer.buffer) {
                rawBuffer = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
            }
            
            const decodedBuffer = await new Promise((resolve, reject) => {
                state.audioCtx.decodeAudioData(rawBuffer, resolve, reject);
            });
            
            buffers.push(decodedBuffer);
            displayNames = ['Canção Original'];
            
            state.backingTrack.audioBuffers = buffers;
            state.backingTrack.fileNames = displayNames;
            state.backingTrack.mode = 'original';
        } else {
            const stemOrder = ['vocals', 'drums', 'bass', 'other'];
            const stemDisplayNames = ['Voz', 'Bateria', 'Baixo', 'Guitarra'];
            
            for (let i = 0; i < stemOrder.length; i++) {
                const key = stemOrder[i];
                const filePath = item.paths[key];
                
                const arrayBuffer = await window.stemAPI.readBuffer(filePath);
                if (!arrayBuffer) {
                    throw new Error(`Falha ao ler o arquivo: ${key}.wav`);
                }
                
                let rawBuffer = arrayBuffer;
                if (arrayBuffer instanceof Uint8Array || arrayBuffer.buffer) {
                    rawBuffer = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
                }
                
                const decodedBuffer = await new Promise((resolve, reject) => {
                    state.audioCtx.decodeAudioData(rawBuffer, resolve, reject);
                });
                
                buffers.push(decodedBuffer);
            }
            
            displayNames = stemDisplayNames;
            state.backingTrack.audioBuffers = buffers;
            state.backingTrack.fileNames = displayNames;
            state.backingTrack.mode = 'stems';
        }
        
        state.backingTrack.duration = Math.max(...buffers.map(b => b.duration));
        document.getElementById('backingTimeTotal').textContent = formatBackingTime(state.backingTrack.duration);
        document.getElementById('backingTimeCurrent').textContent = "00:00";
        
        const backingProgressBar = document.getElementById('backingProgressBar');
        if (backingProgressBar) {
            backingProgressBar.value = 0;
            backingProgressBar.max = Math.floor(state.backingTrack.duration);
            backingProgressBar.disabled = false;
            backingProgressBar.removeAttribute('disabled');
        }
        
        if (state.backingTrack.updateCustomProgressBarUI) {
            state.backingTrack.updateCustomProgressBarUI();
        }
        
        document.getElementById('btnPlayBacking').disabled = false;
        document.getElementById('btnStopBacking').disabled = false;
        
        state.backingTrack.fileName = item.name;
        state.backingTrack.metaTitle = item.meta.title || item.name;
        state.backingTrack.metaArtist = item.meta.artist || "Stems prontas para mixagem";
        state.backingTrack.metaCoverUrl = item.meta.coverUrl || "";
        
        if (titleEl) titleEl.textContent = state.backingTrack.metaTitle;
        if (subtitleEl) subtitleEl.textContent = state.backingTrack.metaArtist;
        if (coverEl && state.backingTrack.metaCoverUrl) {
            coverEl.src = state.backingTrack.metaCoverUrl;
            coverEl.style.display = 'block';
            if (iconEl) iconEl.style.display = 'none';
        } else {
            if (coverEl) coverEl.style.display = 'none';
            if (iconEl) iconEl.style.display = 'flex';
        }
        
        renderStemsList();
        
        const btnExportMixdown = document.getElementById('btnExportMixdown');
        if (btnExportMixdown) btnExportMixdown.removeAttribute('disabled');
        
        syncStemsToPlayer();
        
        logConsole(`✅ Stems de "${state.backingTrack.metaTitle}" carregados com sucesso!`, 'success');
    } catch (err) {
        console.error("Erro ao carregar stems da biblioteca:", err);
        logConsole(`Erro ao carregar da biblioteca: ${err.message}`, 'error');
        alert(`Erro ao carregar stems da biblioteca: ${err.message}`);
        
        const stemsListPlaceholder = document.getElementById('stemsListPlaceholder');
        if (stemsList && stemsListPlaceholder) {
            stemsList.innerHTML = '';
            stemsList.appendChild(stemsListPlaceholder);
        }
    }
}

async function renderStemLibraryList() {
    const libraryList = document.getElementById('stemLibraryList');
    const emptyEl = document.getElementById('stemLibraryEmpty');
    
    if (!libraryList || !window.stemAPI) return;
    
    const items = libraryList.querySelectorAll('.stem-library-card');
    items.forEach(el => el.remove());
    
    try {
        const savedTracks = await window.stemAPI.listSeparated();
        
        if (!savedTracks || savedTracks.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        savedTracks.forEach(item => {
            const card = document.createElement('div');
            card.className = 'stem-library-card';
            card.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 10px;
                border: 1px solid var(--panel-border);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.02);
                gap: 8px;
                transition: all 0.2s ease;
                box-sizing: border-box;
                width: 100%;
                cursor: pointer;
            `;
            
            card.addEventListener('mouseenter', () => {
                card.style.background = 'rgba(255, 255, 255, 0.05)';
                card.style.borderColor = 'var(--primary-color)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = 'rgba(255, 255, 255, 0.02)';
                card.style.borderColor = 'var(--panel-border)';
            });
            
            const title = item.meta.title || item.name;
            const artist = item.meta.artist || "Trilha Separada";
            
            card.innerHTML = `
                <div style="display: flex; flex-direction: column; overflow: hidden; flex-grow: 1; text-align: left; pointer-events: none;">
                    <span style="font-size: 0.68rem; font-weight: bold; color: var(--text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
                    <span style="font-size: 0.58rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${artist}</span>
                </div>
                <div style="display: flex; align-items: center; flex-shrink: 0;">
                    <button class="lib-delete-btn" style="font-size: 0.65rem; padding: 4px 6px; border-radius: 4px; background: rgba(255, 59, 48, 0.12); color: #ff3b30; border: 1px solid rgba(255, 59, 48, 0.25); cursor: pointer; outline: none; display: flex; align-items: center; justify-content: center; height: 22px; width: 26px;" title="Excluir da Biblioteca Local">
                        🗑️
                    </button>
                </div>
            `;
            
            // Clique no card para carregar e reproduzir imediatamente sem confirmação
            card.addEventListener('click', async (e) => {
                // Se clicou no botão excluir, aborta o carregamento
                if (e.target.closest('.lib-delete-btn')) return;

                if (isPlayerMode) {
                    if (window.electronAPI && window.electronAPI.sendPlayerAction) {
                        window.electronAPI.sendPlayerAction('control-load-library-item', item.name);
                        // Envia o play imediato também
                        window.electronAPI.sendPlayerAction('control-play');
                    }
                } else {
                    await loadStemsFromLibraryPath(item);
                    playBacking(); // Tocar imediatamente
                }
            });
            
            card.querySelector('.lib-delete-btn').addEventListener('click', async (e) => {
                e.stopPropagation(); // Evitar clique no card pai
                if (confirm(`Deseja excluir "${title}" permanentemente da biblioteca?`)) {
                    logConsole(`Excluindo "${title}" da biblioteca...`, 'info');
                    const deleteResult = await window.stemAPI.deleteSeparated(item.name);
                    if (deleteResult.success) {
                        logConsole(`✅ "${title}" excluído com sucesso!`, 'success');
                        await renderStemLibraryList();
                    } else {
                        alert(`Erro ao excluir: ${deleteResult.error}`);
                    }
                }
            });
            
            libraryList.appendChild(card);
        });
    } catch (err) {
        console.error("Erro ao listar biblioteca de stems:", err);
    }
}

function initStemLibrary() {
    const btnSaveToLibrary = document.getElementById('btnSaveToLibrary');
    if (btnSaveToLibrary) {
        btnSaveToLibrary.addEventListener('click', async () => {
            await saveToLibrary();
        });
    }
    
    renderStemLibraryList();
}

// ==========================================
// EXPORTAÇÃO E CODIFICAÇÃO EM WAV PCM 16-BIT
// ==========================================
function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // 1 = Raw PCM (16-bit integers)
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }
    
    return createWavFile(result, numOfChan, sampleRate, format, bitDepth);
}

function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
}

function createWavFile(samples, numOfChan, sampleRate, format, bitDepth) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    floatTo16BitPCM(view, 44, samples);
    
    return buffer;
}

function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

async function ensureSongSavedInLibrary() {
    const safeSongName = (state.backingTrack.metaTitle || state.backingTrack.fileName.replace(/\.[^/.]+$/, "")).replace(/[\\/:*?"<>|]/g, '_').trim();
    
    // Verificar se a música já existe na biblioteca
    const savedTracks = await window.stemAPI.listSeparated();
    const isAlreadySaved = savedTracks.some(t => {
        if (t.isFile) {
            return t.name === state.backingTrack.fileName;
        }
        return t.name === safeSongName;
    });
    
    if (!isAlreadySaved) {
        logConsole(`Música ainda não cadastrada. Salvando na biblioteca local...`, 'info');
        if (state.backingTrack.tmpPaths) {
            const meta = {
                title: state.backingTrack.metaTitle || safeSongName,
                artist: state.backingTrack.metaArtist || "Stems prontas para mixagem",
                coverUrl: state.backingTrack.metaCoverUrl || "",
                duration: state.backingTrack.duration
            };
            const saveResult = await window.stemAPI.saveSeparated(safeSongName, state.backingTrack.tmpPaths, meta);
            if (saveResult.success) {
                logConsole(`✅ Música adicionada à biblioteca automaticamente!`, 'success');
                const btnSave = document.getElementById('btnSaveToLibrary');
                if (btnSave) {
                    btnSave.textContent = "💾 Salvo";
                    btnSave.style.background = "rgba(46, 204, 113, 0.08)";
                    btnSave.style.color = "#2ecc71";
                    btnSave.style.borderColor = "rgba(46, 204, 113, 0.2)";
                    btnSave.disabled = true;
                }
                await renderStemLibraryList();
            } else {
                throw new Error("Falha ao criar diretório na biblioteca: " + saveResult.error);
            }
        } else {
            logConsole(`Criando diretório da biblioteca...`, 'info');
        }
    }
}

async function exportIndividualStem(idx) {
    if (isPlayerMode) {
        if (window.electronAPI && window.electronAPI.sendPlayerAction) {
            window.electronAPI.sendPlayerAction('control-export-stem', idx);
        }
        return;
    }
    
    if (!state.backingTrack.audioBuffers || !state.backingTrack.audioBuffers[idx]) {
        alert("Buffer de áudio não disponível.");
        return;
    }
    
    try {
        // Garantir que a pasta da música exista e esteja cadastrada na biblioteca local
        await ensureSongSavedInLibrary();
        
        const buffer = state.backingTrack.audioBuffers[idx];
        const stemName = ['Voz', 'Bateria', 'Baixo', 'Guitarra_Outros'][idx] || 'Trilha';
        const songName = cleanFileNameForSearch(state.backingTrack.fileName || 'Musica').replace(/\s+/g, '_');
        const safeSongName = (state.backingTrack.metaTitle || state.backingTrack.fileName.replace(/\.[^/.]+$/, "")).replace(/[\\/:*?"<>|]/g, '_').trim();
        
        // Caminho de destino direto na biblioteca
        const separatedDir = await window.stemAPI.getSeparatedDir();
        const destDir = `${separatedDir}\\${safeSongName}`;
        const destFilePath = `${destDir}\\${songName}_${stemName}.wav`;
        
        logConsole(`Codificando trilha ${stemName}...`, 'info');
        const wavBuffer = audioBufferToWav(buffer);
        
        logConsole(`Salvando diretamente em ${destFilePath}...`, 'info');
        const writeResult = await window.stemAPI.writeBuffer(destFilePath, new Uint8Array(wavBuffer));
        
        if (writeResult.success) {
            logConsole(`✅ Trilha ${stemName} baixada diretamente para a biblioteca local!`, 'success');
            alert(`Download concluído!\n\nA trilha individual (${stemName}) foi salva na pasta da biblioteca:\n${destFilePath}`);
        } else {
            throw new Error(writeResult.error);
        }
    } catch (err) {
        console.error("Erro ao salvar trilha individual:", err);
        logConsole(`Erro ao salvar trilha individual: ${err.message}`, 'error');
        alert(`Erro ao salvar trilha individual: ${err.message}`);
    }
}

async function exportMixdown() {
    if (isPlayerMode) {
        if (window.electronAPI && window.electronAPI.sendPlayerAction) {
            window.electronAPI.sendPlayerAction('control-export-mixdown');
        }
        return;
    }
    
    if (!state.backingTrack.audioBuffers || state.backingTrack.audioBuffers.length === 0) {
        alert("Nenhuma trilha carregada para mixagem.");
        return;
    }
    
    try {
        // Garantir que a pasta da música exista e esteja cadastrada na biblioteca local
        await ensureSongSavedInLibrary();
        
        const songName = cleanFileNameForSearch(state.backingTrack.fileName || 'Musica').replace(/\s+/g, '_');
        const safeSongName = (state.backingTrack.metaTitle || state.backingTrack.fileName.replace(/\.[^/.]+$/, "")).replace(/[\\/:*?"<>|]/g, '_').trim();
        
        // Caminho de destino direto na biblioteca
        const separatedDir = await window.stemAPI.getSeparatedDir();
        const destDir = `${separatedDir}\\${safeSongName}`;
        const destFilePath = `${destDir}\\${songName}_Mixagem.wav`;
        
        logConsole(`Iniciando mixagem offline...`, 'info');
        
        const duration = state.backingTrack.duration;
        const sampleRate = state.audioCtx.sampleRate;
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
            2,
            Math.ceil(duration * sampleRate),
            sampleRate
        );
        
        state.backingTrack.audioBuffers.forEach((buffer, idx) => {
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer;
            
            const stemGain = offlineCtx.createGain();
            const settingsIdx = (state.backingTrack.mode === 'original') ? 4 : idx;
            const settings = state.backingTrack.eqSettings[settingsIdx] || { volume: 80, mute: false };
            
            const isMuted = settings.mute;
            const volumeVal = settings.volume;
            
            let gainVal = 1.0;
            if (settingsIdx !== 4) {
                const db = valueToDb(volumeVal);
                gainVal = isMuted ? 0 : (db === -Infinity ? 0 : Math.pow(10, db / 20));
            } else {
                if (isMuted) gainVal = 0;
            }
            
            stemGain.gain.setValueAtTime(gainVal, 0);
            
            // Criar filtros EQ de 3 bandas (Graves, Médios, Agudos) para a mixagem offline
            const lowFilter = offlineCtx.createBiquadFilter();
            lowFilter.type = 'lowshelf';
            lowFilter.frequency.value = 80;
            lowFilter.gain.setValueAtTime(settings.low || 0, 0);

            const midFilter = offlineCtx.createBiquadFilter();
            midFilter.type = 'peaking';
            midFilter.Q.value = 1.0;
            midFilter.frequency.value = 1000;
            midFilter.gain.setValueAtTime(settings.mid || 0, 0);

            const highFilter = offlineCtx.createBiquadFilter();
            highFilter.type = 'highshelf';
            highFilter.frequency.value = 12000;
            highFilter.gain.setValueAtTime(settings.high || 0, 0);

            // Conectar na cadeia: source -> lowFilter -> midFilter -> highFilter -> stemGain -> offlineCtx.destination
            source.connect(lowFilter);
            lowFilter.connect(midFilter);
            midFilter.connect(highFilter);
            highFilter.connect(stemGain);
            stemGain.connect(offlineCtx.destination);
            
            source.start(0);
        });
        
        logConsole(`Processando e renderizando áudio...`, 'info');
        const renderedBuffer = await offlineCtx.startRendering();
        
        logConsole(`Codificando mixagem em WAV 16-bit...`, 'info');
        const wavBuffer = audioBufferToWav(renderedBuffer);
        
        logConsole(`Salvando diretamente em ${destFilePath}...`, 'info');
        const writeResult = await window.stemAPI.writeBuffer(destFilePath, new Uint8Array(wavBuffer));
        
        if (writeResult.success) {
            logConsole(`✅ Mixagem personalizada baixada diretamente para a biblioteca local!`, 'success');
            alert(`Download concluído!\n\nA mixagem personalizada (Minus-One) foi salva na pasta da biblioteca:\n${destFilePath}`);
        } else {
            throw new Error(writeResult.error);
        }
    } catch (err) {
        console.error("Erro ao exportar mixagem:", err);
        logConsole(`Erro ao exportar mixagem: ${err.message}`, 'error');
        alert(`Erro ao exportar mixagem: ${err.message}`);
    }
}

// --- CONTROLE DE DOCUMENTAÇÃO E AJUDA ---
let isDocLoaded = false;

function initDocumentation() {
    const btnDoc = document.getElementById('btnDoc');
    const docModal = document.getElementById('docModal');
    const closeDoc = document.getElementById('closeDoc');
    
    if (btnDoc && docModal && closeDoc) {
        btnDoc.addEventListener('click', async () => {
            docModal.style.display = 'block';
            if (!isDocLoaded) {
                await loadDocumentation();
            }
        });
        
        closeDoc.addEventListener('click', () => {
            docModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === docModal) {
                docModal.style.display = 'none';
            }
        });
    }
}

async function loadDocumentation() {
    const docContent = document.getElementById('docContent');
    if (!docContent) return;
    
    try {
        docContent.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Carregando documentação...</div>`;
        
        // Usar a API readBuffer para ler o arquivo Markdown
        const arrayBuffer = await window.stemAPI.readBuffer('BOSS_ME25_Editor_Documentation.md');
        if (!arrayBuffer) {
            throw new Error("Não foi possível carregar o arquivo da documentação.");
        }
        
        // Decodificar arrayBuffer em string UTF-8
        const decoder = new TextDecoder('utf-8');
        const markdownText = decoder.decode(new Uint8Array(arrayBuffer));
        
        // Renderizar para HTML
        const html = renderMarkdownToHtml(markdownText);
        docContent.innerHTML = html;
        isDocLoaded = true;
    } catch (err) {
        console.error("Erro ao ler documentação:", err);
        docContent.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--danger-color); font-weight: bold;">
            Erro ao carregar documentação: ${err.message}<br>
            Certifique-se de que o arquivo "BOSS_ME25_Editor_Documentation.md" está no diretório correto do app.
        </div>`;
    }
}

function renderMarkdownToHtml(md) {
    if (!md) return '';
    
    const lines = md.split(/\r?\n/);
    let html = '';
    let inList = false;
    let inCodeBlock = false;
    let codeBlockContent = [];
    let inTable = false;
    let tableRows = [];

    function formatInline(text) {
        // Negrito **texto**
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Código em linha `código`
        text = text.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: var(--primary-color);">$1</code>');
        return text;
    }

    function renderTable(rows) {
        let tableHtml = '<div style="overflow-x: auto; margin: 15px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left;"><thead>';
        
        let headerCols = rows[0].split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableHtml += '<tr style="border-bottom: 2px solid var(--panel-border); background: rgba(255, 255, 255, 0.03);">';
        headerCols.forEach(col => {
            tableHtml += `<th style="padding: 8px 12px; font-weight: bold; border: 1px solid var(--panel-border);">${formatInline(col)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        for (let r = 1; r < rows.length; r++) {
            let bodyCols = rows[r].split('|').map(s => s.trim()).filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (bodyCols.length === 0) continue;
            let rowBg = r % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.1)';
            tableHtml += `<tr style="border-bottom: 1px solid var(--panel-border); background: ${rowBg};">`;
            bodyCols.forEach(col => {
                tableHtml += `<td style="padding: 8px 12px; border: 1px solid var(--panel-border);">${formatInline(col)}</td>`;
            });
            tableHtml += '</tr>';
        }
        
        tableHtml += '</tbody></table></div>';
        return tableHtml;
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();

        // 1. Code blocks
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                html += `<pre style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; border: 1px solid var(--panel-border); font-family: monospace; font-size: 0.75rem; overflow-x: auto; white-space: pre-wrap; margin: 10px 0; color: #e6c5e8;"><code class="code-block">${codeBlockContent.join('\n')}</code></pre>`;
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            let escaped = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            codeBlockContent.push(escaped);
            continue;
        }

        // 2. Tables
        if (trimmed.startsWith('|')) {
            if (trimmed.match(/^\|[\s:-|]+$/)) {
                continue;
            }
            inTable = true;
            tableRows.push(line);
            continue;
        } else if (inTable) {
            html += renderTable(tableRows);
            tableRows = [];
            inTable = false;
        }

        // 3. Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (!inList) {
                html += '<ul style="margin: 10px 0; padding-left: 20px; list-style-type: disc;">';
                inList = true;
            }
            let itemText = trimmed.substring(2);
            html += `<li style="margin-bottom: 4px;">${formatInline(itemText)}</li>`;
            continue;
        } else if (inList) {
            html += '</ul>';
            inList = false;
        }

        // 4. Horizontal Rule
        if (trimmed === '---') {
            html += '<hr style="border: 0; border-top: 1px solid var(--panel-border); margin: 20px 0;">';
            continue;
        }

        // 5. Headers
        if (trimmed.startsWith('#')) {
            let level = 0;
            while (trimmed.startsWith('#')) {
                level++;
                trimmed = trimmed.substring(1);
            }
            trimmed = trimmed.trim();
            let fontSize = '1rem';
            let color = 'var(--text-color)';
            let marginTop = '20px';
            if (level === 1) { fontSize = '1.4rem'; color = 'var(--primary-color)'; marginTop = '25px'; }
            else if (level === 2) { fontSize = '1.2rem'; color = 'var(--primary-color)'; marginTop = '22px'; }
            else if (level === 3) { fontSize = '1.05rem'; color = 'var(--text-color)'; marginTop = '18px'; }
            
            html += `<h${level} style="font-weight: 700; margin-top: ${marginTop}; margin-bottom: 10px; color: ${color}; font-size: ${fontSize}; border-bottom: ${level <= 2 ? '1px solid rgba(255,255,255,0.05)' : 'none'}; padding-bottom: ${level <= 2 ? '6px' : '0'};">${formatInline(trimmed)}</h${level}>`;
            continue;
        }

        // 6. Blank lines
        if (trimmed === '') {
            continue;
        }

        // 7. Regular paragraphs
        html += `<p style="margin: 10px 0; font-size: 0.82rem; line-height: 1.6; color: var(--text-color);">${formatInline(line)}</p>`;
    }

    if (inList) html += '</ul>';
    if (inTable) html += renderTable(tableRows);

    return html;
}



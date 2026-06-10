// app.js - Logic for the BOSS ME-25 Web Editor

// Verificar se a janela está rodando em modo biblioteca (multi-tela)
const urlParams = new URLSearchParams(window.location.search);
const isLibraryMode = urlParams.get('mode') === 'library';

if (isLibraryMode) {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('library-window-mode');
    });
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
    liveAudioSource: null
};

// Inicializar tudo ao carregar
window.addEventListener('DOMContentLoaded', () => {
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
    initDawMode();

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
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('flash-highlight');
                setTimeout(() => card.classList.remove('flash-highlight'), 1000);
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

    // ReverbOut -> Master Gain -> Auto-falantes do PC
    reverbOut.connect(masterGain);
    masterGain.connect(ctx.destination);

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
        masterGain
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
            // folderItem não recebe a classe 'open' automaticamente
            
            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-header';
            
            const folderNameFormatted = lib.fileName.replace(/_/g, ' ');
            const folderIcon = isTSL ? '⭐' : '📁';
            const badge = isTSL ? '<span class="bts-badge" style="font-size: 0.58rem; background: #3498db; color: white; padding: 1px 4px; border-radius: 3px; margin-left: 5px; font-weight: bold; text-transform: uppercase;">Central</span>' : '';
            
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
                        icon.textContent = el.dataset.isTsl === 'true' ? '⭐' : '📁';
                    }
                });
                
                if (!isOpen) {
                    folderItem.classList.add('open');
                    const icon = folderHeader.querySelector('.folder-icon');
                    if (icon) {
                        icon.textContent = isTSL ? '🌟' : '📂';
                    }
                }
            });
            
            // Popular os timbres (patches) de cada pasta
            lib.patches.forEach((patch, idx) => {
                const item = document.createElement('div');
                item.className = 'patch-item';
                item.innerHTML = `
                    <span class="patch-name" title="${patch.name}">${patch.name}</span>
                    <span class="patch-addr">Slot ${idx + 1}</span>
                `;
                
                item.addEventListener('click', (e) => {
                    e.stopPropagation(); // Impede o fechamento acidental da pasta
                    
                    document.querySelectorAll('#fxPatchesList .patch-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    
                    const sourceName = isTSL ? 'Tone Central' : 'FxFloorBoard';
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
                    icon.textContent = isTSL ? '🌟' : '📂';
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
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        filterLibrary();
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterLibrary();
            searchInput.focus();
        });
    }
}

// Filtrar a biblioteca de timbres com base no input
function filterLibrary() {
    const searchInput = document.getElementById('librarySearchInput');
    const clearBtn = document.getElementById('btnClearSearch');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
    }
    
    // 1. Filtrar Fábrica
    document.querySelectorAll('#factoryPatchesList .patch-item').forEach(item => {
        const name = item.querySelector('.patch-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
    });
    
    // 2. Filtrar Nuvem
    document.querySelectorAll('#cloudPatchesList .patch-item').forEach(item => {
        const name = item.querySelector('.patch-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
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
            if (patchName.includes(query) || folderTitle.includes(query)) {
                patch.style.display = 'flex';
                patchMatchCount++;
            } else {
                patch.style.display = 'none';
            }
        });
        
        const isTSL = folder.dataset.isTsl === 'true';
        
        if (query.length > 0) {
            if (patchMatchCount > 0 || folderHasMatches) {
                folder.style.display = 'flex';
                folder.classList.add('open');
                const icon = folder.querySelector('.folder-icon');
                if (icon) {
                    icon.textContent = isTSL ? '🌟' : '📂';
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
                icon.textContent = isTSL ? '⭐' : '📁';
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



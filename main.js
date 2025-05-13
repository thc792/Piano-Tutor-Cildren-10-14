/**
 * js/main.js
 * Logica principale dell'applicazione Piano App per Bambini.
 */

// Import VexFlow Renderer
import { renderExercise, renderEmptyStaff } from './vexflow_renderer.js';
// Import MIDI Handler
import { initializeMIDI } from './midi_handler.js';

// Import moduli Teoria
import { setupTheoryUI as setupNoteTheoryUI, processTheoryInput, getTheoryNoteNamesHTML, getTheoryInputButtonsId } from './theory_notes_display.js';
import { setupDurationTheoryUI, processDurationInput, getDurationNamesHTML, getDurationInputButtonsId as getDurationTheoryButtonsId } from './teoria/teoriaspiegazionedurate.js';
import { setupIntervalTheoryUI, processIntervalTheoryInput, getIntervalTheoryButtonNames, getIntervalTheoryInputButtonsId } from './teoria/teoriaintervalli.js';
import { setupAlterationTheoryUI, processAlterationTheoryInput, getAlterationTheoryButtonNames, getAlterationTheoryInputButtonsId } from './teoria/teoriaalterazioni.js';
import { setupTriadTheoryUI, processTriadTheoryInput, getTriadTheoryButtonNames, getTriadTheoryInputButtonsId } from './teoria/teoriatriadi.js';

// Import moduli Esercizi
import { setupQuizUI, startQuiz, processQuizInput, getDiatonicC4C5NoteNamesHTML, getExerciseInputButtonsId as getQuizNoteInputButtonsId } from './quiz_exercise.js';
import { setupDurationExerciseUI, startDurationExercise, processDurationExerciseInput, getDurationExerciseButtonNames, getDurationExerciseInputButtonsId } from './exercises/eserciziodurate.js';
import { setupIntervalExerciseUI, startIntervalExercise, processIntervalExerciseInput, getIntervalExerciseButtonNames, getIntervalExerciseInputButtonsId } from './exercises/eserciziointervalli.js';
import { setupAlterationExerciseUI, startAlterationExercise, processAlterationExerciseInput, getAlterationExerciseButtonOptions, getAlterationExerciseInputButtonsId } from './exercises/esercizioalterazioni.js';
// CORREZIONE IMPORT: Rimosso getTriadExerciseButtonOptions se non esportato da eserciziotriadi.js
import { setupTriadExerciseUI, startTriadExercise, processTriadExerciseInput, getTriadExerciseInputButtonsId } from './exercises/eserciziotriadi.js';


// --- Variabili Globali e Riferimenti HTML ---
const pianoKeysContainer = document.getElementById('piano-keys');
const allPianoKeys = document.querySelectorAll('#piano-keys .key');
const toggleStaffNoteNamesBtn = document.getElementById('toggle-staff-note-names-btn');
const toggleExtraKeysBtn = document.getElementById('toggle-keyboard-note-names-btn'); 
const btnClearStaff = document.getElementById('btnClearStaff');
const vexflowStaffOutputId = 'vexflow-staff-output'; 
const midiStatusIndicator = document.getElementById('midi-status-indicator');
const btnTeoriaMusicale = document.getElementById('btn-teoria-musicale');
const btnEserciziTeorici = document.getElementById('btn-esercizi-teorici');
const contentArea = document.getElementById('content-area');
const mainTvScreensContainer = document.getElementById('main-tv-screens-container'); 
const pianoSectionFooter = document.getElementById('piano-section-footer');

// --- Variabili di Stato ---
let userEnteredNotes = [];
let currentClef = 'treble';
let currentTimeSignature = '4/4';
let currentKeySignature = 'C';
let areStaffNoteNamesVisible = false; 
let areExtraKeysEnabled = false; 
const extraKeysNoteValues = ["A3", "B3", "D5", "E5", "F5", "G5", "A5"]; 
let isMidiReady = false;
let currentSection = 'home';
let activeInputHandler = null; 

// --- Funzione Principale di Avvio ---
function initializeApp() {
    console.log(">>> MAIN initializeApp: Inizializzazione...");
    if (!contentArea || !pianoSectionFooter || !btnTeoriaMusicale || !btnEserciziTeorici) {
        console.error("Errore critico: Elementi HTML fondamentali non trovati (contentArea, pianoSectionFooter, nav buttons). Controlla ID in index.html.");
        alert("Errore inizializzazione. Controlla console.");
        return;
    }
    renderUserNotesOnStaff();
    setupVirtualKeyboardListeners();
    setupControlButtons(); 
    setupNavigationButtons();
    initializeMIDI(handleMIDINoteOn, updateMIDIStatusUI);
    showSection('home');
    console.log(">>> MAIN initializeApp: Inizializzazione completata.");
}

// --- Funzioni Setup UI Iniziale ---
function renderUserNotesOnStaff() {
    console.log(`>>> MAIN renderUserNotesOnStaff chiamato. Note: ${userEnteredNotes.length}. Sezione: ${currentSection}`);
    const exerciseDataForVexFlow = { 
        clef: currentClef, 
        timeSignature: currentTimeSignature, 
        keySignature: currentKeySignature, 
        notes: [...userEnteredNotes] 
    };
    
    const vexflowDrawingOptions = { 
        showTextAnnotations: areStaffNoteNamesVisible,
        useFullWidth: true 
    };

    if (currentSection === 'home') {
        vexflowDrawingOptions.customStartY = -10; 
        console.log(">>> MAIN renderUserNotesOnStaff: Opzioni per HOME:", vexflowDrawingOptions);
    }

    try {
        if (userEnteredNotes.length > 0) { 
            renderExercise(vexflowStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions); 
        } else { 
            renderEmptyStaff(
                vexflowStaffOutputId, 
                currentClef, 
                currentTimeSignature, 
                currentKeySignature, 
                0, 
                true, 
                currentSection === 'home' ? -10 : undefined 
            ); 
        }
    } catch (e) { 
        console.error(">>> MAIN renderUserNotesOnStaff: Errore VexFlow:", e); 
        const staffDiv = document.getElementById(vexflowStaffOutputId); 
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore VexFlow.</p>"; 
    }
}

function setupVirtualKeyboardListeners() {
    console.log(">>> MAIN setupVirtualKeyboardListeners chiamato.");
    allPianoKeys.forEach(keyElement => {
        keyElement.addEventListener('mousedown', () => {
            if (keyElement.classList.contains('key-is-hidden')) {
                console.log(">>> MAIN VirtualKey: Tasto nascosto cliccato, ignoro.");
                return;
            }
            const noteDaHTML = keyElement.dataset.note; const midiNumero = keyElement.dataset.midi; let vexFlowKey = noteDaHTML;
            if (noteDaHTML && !noteDaHTML.includes('/') && noteDaHTML.length >= 2) { const notePart = noteDaHTML.slice(0, -1).toLowerCase(); const octavePart = noteDaHTML.slice(-1); vexFlowKey = `${notePart}/${octavePart}`; }
            else if (noteDaHTML && noteDaHTML.includes('/')) { const parts = noteDaHTML.split('/'); if (parts.length === 2) { vexFlowKey = `${parts[0].toLowerCase()}/${parts[1]}`; } else { console.warn(`Formato data-note inatteso "${noteDaHTML}".`); vexFlowKey = noteDaHTML; } }
            else { console.warn(`Formato data-note non valido "${noteDaHTML}". Ignorato.`); return; }
            handleNoteInput(vexFlowKey, parseInt(midiNumero), 100);
            keyElement.classList.add('playing'); setTimeout(() => { keyElement.classList.remove('playing'); }, 200);
        });
    });
    console.log(`>>> MAIN setupVirtualKeyboardListeners: Listener collegati.`);
}

function setupControlButtons() {
    console.log(">>> MAIN setupControlButtons chiamato.");
    if (toggleStaffNoteNamesBtn) { 
        toggleStaffNoteNamesBtn.addEventListener('click', toggleStaffNoteNames); 
        toggleStaffNoteNamesBtn.textContent = areStaffNoteNamesVisible ? "Note Scritte (Pentagramma) ON" : "Note Scritte (Pentagramma) OFF";
    } else { 
        console.warn("Pulsante 'toggle-staff-note-names-btn' non trovato."); 
    }
    if (toggleExtraKeysBtn) { 
        toggleExtraKeysBtn.addEventListener('click', toggleExtraKeysMode);
        toggleExtraKeysBtn.textContent = areExtraKeysEnabled ? "Modalità Tastiera Ridotta" : "Modalità Tastiera Estesa";
        allPianoKeys.forEach(keyElement => {
            const noteValue = keyElement.dataset.note;
            if (extraKeysNoteValues.includes(noteValue)) {
                if (areExtraKeysEnabled) { 
                    keyElement.classList.remove('key-is-hidden');
                } else { 
                    keyElement.classList.add('key-is-hidden');
                }
            }
        });
    } else { 
        console.warn("Pulsante 'toggle-keyboard-note-names-btn' (ora per tasti extra) non trovato."); 
    }
    if (btnClearStaff) { 
        btnClearStaff.addEventListener('click', clearStaff); 
    } else { 
        console.warn("Pulsante 'btnClearStaff' non trovato."); 
    }
}

function setupNavigationButtons() {
    console.log(">>> MAIN setupNavigationButtons chiamato.");
    if (btnTeoriaMusicale) { btnTeoriaMusicale.addEventListener('click', () => showSection('teoria')); }
    else { console.warn("Pulsante 'btn-teoria-musicale' non trovato."); }
    if (btnEserciziTeorici) { btnEserciziTeorici.addEventListener('click', () => showSection('selezione_esercizi')); }
    else { console.warn("Pulsante 'btn-esercizi-teorici' non trovato."); }
}

function handleNoteInput(vexFlowNote, midiNumber, velocity) {
    console.log(`>>> MAIN handleNoteInput: Nota=${vexFlowNote}, MIDI=${midiNumber}, Vel=${velocity}, Sezione=${currentSection}`);
    const isExerciseSection = ['quiz_notes', 'exercise_durations', 'exercise_intervals', 'exercise_alterations', 'exercise_triads'].includes(currentSection);

    if (activeInputHandler && isExerciseSection) {
        const handlerName = activeInputHandler.name || 'handler anonimo';
        console.log(`>>> MAIN handleNoteInput: Input per ESERCIZIO (${currentSection}). Reindirizzando a ${handlerName}.`);
        activeInputHandler(vexFlowNote); 
    }
    else if (currentSection === 'teoria') { 
        console.log(">>> MAIN handleNoteInput: Input MIDI/Tastiera per TEORIA.");
        if (activeInputHandler && typeof activeInputHandler === 'function') {
             activeInputHandler(vexFlowNote); 
        } else if (typeof processTheoryInput === 'function') { 
            processTheoryInput(vexFlowNote);
        }
    }
    else if (currentSection === 'home') {
        console.log(">>> MAIN handleNoteInput: Input per HOME. Aggiungendo nota al pentagramma libero.");
        userEnteredNotes.push({ keys: [vexFlowNote], duration: 'q' });
        renderUserNotesOnStaff();
    }
    else {
        const handlerInfo = activeInputHandler ? activeInputHandler.name : 'null';
        console.log(`>>> MAIN handleNoteInput: Input ignorato (Sezione: ${currentSection}, MIDI: ${midiNumber}, Handler: ${handlerInfo}, Esercizio?: ${isExerciseSection}).`);
    }
}

function handleMIDINoteOn(noteNameMIDI, midiNoteNumber, velocity) {
    console.log(`>>> MAIN handleMIDINoteOn: Nota=${noteNameMIDI}, MIDI=${midiNoteNumber}, Vel=${velocity}`);
    const keyElement = document.querySelector(`.key[data-midi="${midiNoteNumber}"]`);
    if (keyElement) { 
        if (keyElement.classList.contains('key-is-hidden')) {
            console.log(">>> MAIN MIDI: Tasto nascosto ricevuto da MIDI, ignoro visualizzazione e input.");
            return;
        }
        keyElement.classList.add('playing'); 
        setTimeout(() => { keyElement.classList.remove('playing'); }, 200); 
    }
    else { console.warn(`Nessun tasto virtuale per MIDI ${midiNoteNumber}.`); }
    handleNoteInput(noteNameMIDI, midiNoteNumber, velocity);
}

function updateMIDIStatusUI(message, isConnected) {
    console.log(`>>> MAIN updateMIDIStatusUI: Msg="${message}", Connesso=${isConnected}`);
    if (midiStatusIndicator) { midiStatusIndicator.textContent = `MIDI: ${message}`; isMidiReady = isConnected; midiStatusIndicator.classList.remove('connected', 'error'); if (isConnected) { midiStatusIndicator.classList.add('connected'); } else if (message.toLowerCase().includes('errore') || message.toLowerCase().includes('nessun dispositivo')) { midiStatusIndicator.classList.add('error'); } }
}

function toggleExtraKeysMode() {
    areExtraKeysEnabled = !areExtraKeysEnabled;
    console.log(`>>> MAIN toggleExtraKeysMode: Modalità tastiera estesa impostata a ${areExtraKeysEnabled}`);
    allPianoKeys.forEach(keyElement => {
        const noteValue = keyElement.dataset.note;
        if (extraKeysNoteValues.includes(noteValue)) {
            if (areExtraKeysEnabled) {
                keyElement.classList.remove('key-is-hidden');
            } else {
                keyElement.classList.add('key-is-hidden');
            }
        }
    });
    if (toggleExtraKeysBtn) {
        toggleExtraKeysBtn.textContent = areExtraKeysEnabled ? "Modalità Tastiera Ridotta" : "Modalità Tastiera Estesa";
    }
}

function toggleStaffNoteNames() { 
    console.log(">>> MAIN toggleStaffNoteNames"); 
    areStaffNoteNamesVisible = !areStaffNoteNamesVisible; 
    renderUserNotesOnStaff(); 
    if (toggleStaffNoteNamesBtn) {
        toggleStaffNoteNamesBtn.textContent = areStaffNoteNamesVisible ? "Note Scritte (Pentagramma) ON" : "Note Scritte (Pentagramma) OFF"; 
    }
}

function clearStaff() { console.log(">>> MAIN clearStaff"); userEnteredNotes = []; renderUserNotesOnStaff(); }

function showSection(sectionName) {
    console.log(`>>> MAIN showSection: Tentativo di mostrare "${sectionName}"`);
    currentSection = sectionName; 
    activeInputHandler = null; 
    document.querySelectorAll('#top-navigation .nav-button').forEach(btn => btn.classList.remove('active'));
    if (sectionName === 'teoria' && btnTeoriaMusicale) btnTeoriaMusicale.classList.add('active');
    const isExerciseRelated = ['selezione_esercizi', 'quiz_notes', 'exercise_durations', 'exercise_intervals', 'exercise_alterations', 'exercise_triads'].includes(sectionName);
    if (isExerciseRelated && btnEserciziTeorici) btnEserciziTeorici.classList.add('active');
    
    if (!contentArea) { console.error("FATAL: contentArea non trovato!"); return; }

    // Pulisci contentArea SOLO se non siamo nella sezione home
    // La sezione home gestisce la visibilità del suo contenuto statico (TV)
    if (sectionName !== 'home') {
        contentArea.innerHTML = ''; 
    }
    
    const hideFooter = isExerciseRelated || sectionName === 'teoria';
    if (pianoSectionFooter) { 
        pianoSectionFooter.style.display = hideFooter ? 'none' : 'flex'; 
        if (!hideFooter) { 
            renderUserNotesOnStaff(); 
        }
    }

    if (mainTvScreensContainer) { 
        if (sectionName === 'home') {
            mainTvScreensContainer.style.display = 'flex'; 
            console.log(">>> MAIN showSection: Mostrando mainTvScreensContainer per la home.");
            // Assicurati che il contenuto del TV sia quello di default se necessario
            // Se il contenuto del TV viene modificato da altre sezioni, qui potresti doverlo resettare.
            // Ma se è solo testo statico + sfondo CSS, dovrebbe andare bene.
            const tvContent = mainTvScreensContainer.querySelector('#center-main-tv .main-tv-screen-content');
            if (tvContent && tvContent.children.length === 0) { // Se per caso fosse stato svuotato
                 tvContent.innerHTML = `<h2>Piano Tutor cildren</h2>
                                        <p>Benvenuti su piano tutor cildren seguendo i nostri corsi diventerai il piu grande musicista del mondo! su inniziamo!</p>`;
            }

        } else {
            mainTvScreensContainer.style.display = 'none'; 
            console.log(">>> MAIN showSection: Nascondendo mainTvScreensContainer per sezione:", sectionName);
        }
    } else {
        if (sectionName === 'home') {
            console.warn("Contenitore mainTvScreensContainer non trovato, ma richiesto per la sezione home.");
        }
    }

    switch (sectionName) {
        case 'home':
            console.log(">>> MAIN showSection: Logica specifica per Home eseguita.");
            // contentArea rimane come è (o vuoto se pulito condizionatamente), il TV è gestito sopra.
            break;
        case 'teoria': 
            setupTheoryEnvironment(); // Questa funzione aggiungerà contenuto a contentArea
            activeInputHandler = processTheoryInput; 
            break;
        case 'selezione_esercizi': 
            showExerciseSelectionScreen(); // Questa funzione aggiungerà contenuto a contentArea
            break;
        // ... altri case che aggiungono contenuto a contentArea ...
        case 'quiz_notes': setupQuizEnvironment(); break;
        case 'exercise_durations': setupDurationExerciseEnvironment(); break;
        case 'exercise_intervals': setupIntervalExerciseEnvironment(); break;
        case 'exercise_alterations': setupAlterationExerciseEnvironment(); break;
        case 'exercise_triads': setupTriadExerciseEnvironment(); break;
        default: console.warn(`Sezione sconosciuta: ${sectionName}. Mostrando home.`); showSection('home'); break;
    }
    console.log(`>>> MAIN showSection: Sezione "${currentSection}" caricata.`);
}

function showExerciseSelectionScreen() {
    console.log(">>> MAIN showExerciseSelectionScreen: Creazione UI selezione...");
    const selectionContainer = document.createElement('div');
    selectionContainer.id = 'exercise-selection-container';
    const title = document.createElement('h2'); title.textContent = 'Scegli un Esercizio'; selectionContainer.appendChild(title);
    const exercises = [
        { name: 'Quiz Note (Capitolo 1)', sectionId: 'quiz_notes' },
        { name: 'Esercizio Durate (Capitolo 2)', sectionId: 'exercise_durations' },
        { name: 'Esercizio Intervalli (Capitolo 3)', sectionId: 'exercise_intervals' },
        { name: 'Esercizio Alterazioni (Capitolo 4)', sectionId: 'exercise_alterations' },
        { name: 'Esercizio Triadi (Capitolo 5)', sectionId: 'exercise_triads' }
    ];
    exercises.forEach(exercise => {
        const button = document.createElement('button');
        button.textContent = exercise.name;
        button.classList.add('exercise-selection-button');
        button.addEventListener('click', () => showSection(exercise.sectionId));
        selectionContainer.appendChild(button);
    });
    contentArea.appendChild(selectionContainer);
}

function setupTheoryEnvironment() {
    console.log(">>> MAIN setupTheoryEnvironment: Creazione UI teoria...");
    setupNoteTheoryUI(contentArea); 
    const noteNames = getTheoryNoteNamesHTML(); const noteBtnId = getTheoryInputButtonsId(); 
    if (document.getElementById(noteBtnId)) { addInputButtons(noteBtnId, noteNames, 'note_theory'); }
    else { console.error(`Container #${noteBtnId} non trovato per pulsanti teoria note.`); }

    const titleCap2 = document.createElement('h2'); titleCap2.textContent = 'Capitolo 2'; titleCap2.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap2);
    setupDurationTheoryUI(contentArea); 
    const durationNames = getDurationNamesHTML(); const durationBtnId = getDurationTheoryButtonsId(); 
    if (document.getElementById(durationBtnId)) { addInputButtons(durationBtnId, durationNames, 'duration_theory'); }
    else { console.error(`Container #${durationBtnId} non trovato per pulsanti teoria durate.`); }
    
    const titleCap3 = document.createElement('h2'); titleCap3.textContent = 'Capitolo 3'; titleCap3.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap3);
    setupIntervalTheoryUI(contentArea);
    const intervalNames = getIntervalTheoryButtonNames(); const intervalBtnId = getIntervalTheoryInputButtonsId();
    if (document.getElementById(intervalBtnId)) { addInputButtons(intervalBtnId, intervalNames, 'interval_theory'); }
    else { console.error(`Container #${intervalBtnId} non trovato per pulsanti teoria intervalli.`); }

    const titleCap4 = document.createElement('h2'); titleCap4.textContent = 'Capitolo 4'; titleCap4.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap4);
    setupAlterationTheoryUI(contentArea);
    const alterationButtonNames = getAlterationTheoryButtonNames();
    const alterationBtnId = getAlterationTheoryInputButtonsId();
    if (document.getElementById(alterationBtnId)) { addInputButtons(alterationBtnId, alterationButtonNames, 'alteration_theory'); }
    else { console.error(`Container #${alterationBtnId} non trovato per teoria alterazioni.`); }

    const titleCap5 = document.createElement('h2'); titleCap5.textContent = 'Capitolo 5'; titleCap5.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap5);
    setupTriadTheoryUI(contentArea);
    const triadButtonNames = getTriadTheoryButtonNames();
    const triadBtnId = getTriadTheoryInputButtonsId();
    if (document.getElementById(triadBtnId)) { addInputButtons(triadBtnId, triadButtonNames, 'triad_theory'); }
    else { console.error(`Container #${triadBtnId} non trovato per teoria triadi.`); }
}

function setupQuizEnvironment() {
    console.log(">>> MAIN setupQuizEnvironment: Creazione UI quiz note...");
    setupQuizUI(contentArea.id);
    const noteNames = getDiatonicC4C5NoteNamesHTML(); const btnId = getQuizNoteInputButtonsId();
    if (document.getElementById(btnId)){ addInputButtons(btnId, noteNames, 'note_exercise'); }
    else { console.error(`Container #${btnId} non trovato per pulsanti quiz note.`); }
    startQuiz();
    activeInputHandler = processQuizInput;
}

function setupDurationExerciseEnvironment() {
    console.log(">>> MAIN setupDurationExerciseEnvironment: Creazione UI esercizio durate...");
    setupDurationExerciseUI(contentArea.id);
    const durationNames = getDurationExerciseButtonNames(); const btnId = getDurationExerciseInputButtonsId();
     if (document.getElementById(btnId)){ addInputButtons(btnId, durationNames, 'duration_exercise'); }
     else { console.error(`Container #${btnId} non trovato per pulsanti esercizio durate.`); }
    startDurationExercise();
    activeInputHandler = processDurationExerciseInput;
}

function setupIntervalExerciseEnvironment() {
    console.log(">>> MAIN setupIntervalExerciseEnvironment: Creazione UI esercizio intervalli...");
    setupIntervalExerciseUI(contentArea.id);
    const intervalNames = getIntervalExerciseButtonNames(); const btnId = getIntervalExerciseInputButtonsId();
     if (document.getElementById(btnId)){ addInputButtons(btnId, intervalNames, 'interval_exercise'); }
     else { console.error(`Container #${btnId} non trovato per pulsanti esercizio intervalli.`); }
    startIntervalExercise();
    activeInputHandler = processIntervalExerciseInput;
}

function setupAlterationExerciseEnvironment() {
    console.log(">>> MAIN setupAlterationExerciseEnvironment: Creazione UI esercizio alterazioni...");
    setupAlterationExerciseUI(contentArea.id); 
    startAlterationExercise(); 
    // L'activeInputHandler per le alterazioni è gestito dai click sui pulsanti specifici
    // che vengono creati da esercizioalterazioni.js tramite la chiamata a window.addInputButtons.
}

function setupTriadExerciseEnvironment() {
    console.log(">>> MAIN setupTriadExerciseEnvironment: Creazione UI esercizio triadi...");
    setupTriadExerciseUI(contentArea.id); // Crea la struttura HTML base
    startTriadExercise(); // Avvia la logica dell'esercizio, che dovrebbe gestire la creazione dei suoi pulsanti
    // L'activeInputHandler per le triadi è gestito dai click sui pulsanti specifici
    // generati da eserciziotriadi.js (presumibilmente tramite window.addInputButtons).
}

// Rendi addInputButtons accessibile globalmente
window.addInputButtons = function(buttonsContainerId, itemNamesOrObjects, type) {
    console.log(`>>> MAIN addInputButtons: Aggiungendo pulsanti a #${buttonsContainerId} (tipo: ${type}). Oggetti:`, itemNamesOrObjects);
    const buttonsContainer = document.getElementById(buttonsContainerId);
    if (!buttonsContainer) { console.error(`Contenitore pulsanti "${buttonsContainerId}" non trovato!`); return; }
    buttonsContainer.innerHTML = '';

    itemNamesOrObjects.forEach(itemData => {
        const button = document.createElement('button');
        let buttonText, buttonValue;

        if (typeof itemData === 'object' && itemData.name !== undefined) { 
            buttonText = itemData.name;
            buttonValue = itemData.value !== undefined ? itemData.value : itemData.name;
        } else { 
            buttonText = itemData;
            buttonValue = itemData;
        }
        button.textContent = buttonText;
        button.classList.add('exercise-note-button');

        if (type === 'note_theory' || type === 'note_exercise') { button.dataset.noteNameItalian = buttonText.toLowerCase(); }
        else if (type === 'duration_theory' || type === 'duration_exercise') { button.dataset.durationName = buttonText; }
        else if (type === 'interval_theory') { button.dataset.intervalNameTheory = buttonText; }
        else if (type === 'interval_exercise') { button.dataset.intervalNameExercise = buttonText; }
        else if (type === 'alteration_theory') { button.dataset.alterationSymbol = buttonText.charAt(0); }
        else if (type === 'triad_theory') { button.dataset.triadNameTheory = buttonText; }
        else if (type === 'alteration_exercise_option') { button.dataset.answerOption = buttonValue; } 
        else if (type === 'triad_exercise_option') { button.dataset.triadTypeOption = buttonValue; } 
        
        button.addEventListener('click', () => {
            console.log(`>>> MAIN Button Click: Testo="${buttonText}", Valore="${buttonValue}", Tipo="${type}"`);
            let vexKey = "";
            
            if (type.endsWith('_theory')) {
                if (type === 'note_theory') activeInputHandler = processTheoryInput;
                else if (type === 'duration_theory') activeInputHandler = processDurationInput;
                else if (type === 'interval_theory') activeInputHandler = processIntervalTheoryInput;
                else if (type === 'alteration_theory') activeInputHandler = processAlterationTheoryInput;
                else if (type === 'triad_theory') activeInputHandler = processTriadTheoryInput;
            }

            switch (type) {
                case 'note_theory':
                    if (buttonText && buttonText.length >= 2) {const n=buttonText.slice(0,-1).toLowerCase(),o=buttonText.slice(-1);let b=n.replace(/[#b]/g,''),a='';if(n.includes('#'))a='#';if(n.includes('b'))a='b';const en={'do':'c','re':'d','mi':'e','fa':'f','sol':'g','la':'a','si':'b'};const eb=en[b];if(eb)vexKey=`${eb}${a}/${o}`;else vexKey=buttonText;}else vexKey=buttonText;
                    processTheoryInput(vexKey); break; 
                case 'duration_theory': processDurationInput(buttonValue); break;
                case 'interval_theory': processIntervalTheoryInput(buttonValue); break;
                case 'alteration_theory': processAlterationTheoryInput(button.dataset.alterationSymbol || buttonValue.charAt(0)); break;
                case 'triad_theory': processTriadTheoryInput(buttonValue); break;
                
                case 'note_exercise':
                    if (buttonText && buttonText.length >= 2) {const n=buttonText.slice(0,-1).toLowerCase(),o=buttonText.slice(-1);let b=n.replace(/[#b]/g,''),a='';if(n.includes('#'))a='#';if(n.includes('b'))a='b';const en={'do':'c','re':'d','mi':'e','fa':'f','sol':'g','la':'a','si':'b'};const eb=en[b];if(eb)vexKey=`${eb}${a}/${o}`;else vexKey=buttonText;}else vexKey=buttonText;
                    handleNoteInput(vexKey, -1, 100); break; 
                case 'duration_exercise': processDurationExerciseInput(buttonValue); break;
                case 'interval_exercise': processIntervalExerciseInput(buttonValue); break;
                case 'alteration_exercise_option': processAlterationExerciseInput(buttonValue); break; 
                case 'triad_exercise_option': processTriadExerciseInput(buttonValue); break;
            }
        });
        buttonsContainer.appendChild(button);
    });
    console.log(`>>> MAIN addInputButtons: Aggiunti ${itemNamesOrObjects.length} pulsanti.`);
}

document.addEventListener('DOMContentLoaded', initializeApp);
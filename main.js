/**
 * Piano Tutor cildren 
 * Copyright (c) 2023-2024 Lorenzetti Giuseppe (aggiorna l'anno se necessario)
 *
 * Tutti i diritti riservati.
 *
 * Questo software è proprietario e confidenziale.
 * È concesso in licenza, non venduto. L'uso, la riproduzione, la modifica
 * o la distribuzione non autorizzata di questo software, o di qualsiasi sua parte,
 * sono severamente vietati.
 *
 * Per informazioni sulla licenza e per i termini di utilizzo completi,
 * fare riferimento al file LICENSE.md disponibile nel repository del progetto:
 * https:https://github.com/thc792/Pianotutorcildren/blob/main/LICENSE.md]
 * o contattare [pianothc791@gmail.com].
 */

// Import VexFlow Renderer
import { renderExercise, renderEmptyStaff } from './vexflow_renderer.js';
// Import MIDI Handler
import { initializeMIDI } from './midi_handler.js';
// Import Audio Handler
import { initializeAudio, playNoteSound, vexFlowToMidi, stopAllSounds } from './audio_handler.js';

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
import { setupTriadExerciseUI, startTriadExercise, processTriadExerciseInput, getTriadExerciseInputButtonsId } from './exercises/eserciziotriadi.js';

// Import modulo Esercizi di Verifica
import { setupVerificationExerciseUI, startVerificationExercise, processVerificationInput } from './verification_exercise.js'; // <<<< PERCORSO CORRETTO QUI


// --- Variabili Globali e Riferimenti HTML ---
const pianoKeysContainer = document.getElementById('piano-keys');
const allPianoKeys = document.querySelectorAll('#piano-keys .key');
const toggleStaffNoteNamesBtn = document.getElementById('toggle-staff-note-names-btn');
const toggleExtraKeysBtn = document.getElementById('toggle-keyboard-note-names-btn');
const btnClearStaff = document.getElementById('btnClearStaff');
const vexflowStaffOutputId = 'vexflow-staff-output';
const midiStatusIndicator = document.getElementById('midi-status-indicator');

const btnHome = document.getElementById('btn-home');
const btnTeoriaMusicale = document.getElementById('btn-teoria-musicale');
const btnEserciziTeorici = document.getElementById('btn-esercizi-teorici');
const btnVerifica = document.getElementById('btn-verifica');

const contentArea = document.getElementById('content-area');
const mainTvScreensContainer = document.getElementById('main-tv-screens-container');
const pianoSectionFooter = document.getElementById('piano-section-footer');

const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');

const leftKeyboardControls = document.getElementById('left-keyboard-controls');
const rightKeyboardControls = document.getElementById('right-keyboard-controls');

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
let isPlayingSequence = false;
let playbackTimeoutId = null;
let currentSelectedDuration = 'q';

/*
const DURATION_OPTIONS = [
    // ... (opzioni durata)
];
*/

// --- Funzione Principale di Avvio ---
function initializeApp() {
    console.log(">>> MAIN initializeApp: Inizializzazione...");
    initializeAudio();

    if (!contentArea || !pianoSectionFooter || !btnHome || !btnTeoriaMusicale || !btnEserciziTeorici || !btnVerifica) {
        console.error("Errore critico: Elementi HTML fondamentali non trovati.");
        alert("Errore inizializzazione. Controlla console.");
        return;
    }
    renderUserNotesOnStaff();
    setupVirtualKeyboardListeners();
    setupControlButtons();
    setupNavigationButtons();
    setupPlaybackControls();
    // setupDurationControls(); 
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
        useFullWidth: true,
        customStartY: (currentSection === 'home') ? 28 : undefined
    };
    try {
        if (userEnteredNotes.length > 0) {
            renderExercise(vexflowStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions);
        } else {
            renderEmptyStaff(vexflowStaffOutputId, currentClef, currentTimeSignature, currentKeySignature, 0, true, vexflowDrawingOptions.customStartY);
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
            if (keyElement.classList.contains('key-is-hidden')) return;
            const noteDaHTML = keyElement.dataset.note; const midiNumero = keyElement.dataset.midi; let vexFlowKey = noteDaHTML;
            if (noteDaHTML && !noteDaHTML.includes('/') && noteDaHTML.length >= 2) { const notePart = noteDaHTML.slice(0, -1).toLowerCase(); const octavePart = noteDaHTML.slice(-1); vexFlowKey = `${notePart}/${octavePart}`; }
            else if (noteDaHTML && noteDaHTML.includes('/')) { const parts = noteDaHTML.split('/'); if (parts.length === 2) { vexFlowKey = `${parts[0].toLowerCase()}/${parts[1]}`; } else { vexFlowKey = noteDaHTML; } }
            else return;
            handleNoteInput(vexFlowKey, parseInt(midiNumero), 100);
            keyElement.classList.add('playing'); setTimeout(() => { keyElement.classList.remove('playing'); }, 200);
        });
    });
}

function setupControlButtons() {
    console.log(">>> MAIN setupControlButtons chiamato.");
    if (toggleStaffNoteNamesBtn) {
        toggleStaffNoteNamesBtn.addEventListener('click', toggleStaffNoteNames);
        toggleStaffNoteNamesBtn.textContent = areStaffNoteNamesVisible ? "Note Scritte (Pentagramma) ON" : "Note Scritte (Pentagramma) OFF";
    }
    if (toggleExtraKeysBtn) {
        toggleExtraKeysBtn.addEventListener('click', toggleExtraKeysMode);
        toggleExtraKeysBtn.textContent = areExtraKeysEnabled ? "Modalità Tastiera Ridotta" : "Modalità Tastiera Estesa";
        allPianoKeys.forEach(keyElement => {
            const noteValue = keyElement.dataset.note;
            if (extraKeysNoteValues.includes(noteValue)) {
                keyElement.classList.toggle('key-is-hidden', !areExtraKeysEnabled);
            }
        });
    }
    if (btnClearStaff) {
        btnClearStaff.addEventListener('click', () => {
            if (isPlayingSequence) stopNoteSequence();
            clearStaff();
        });
    }
}

function setupPlaybackControls() {
    console.log(">>> MAIN setupPlaybackControls chiamato.");
    if (btnPlay) btnPlay.addEventListener('click', playNoteSequence);
    if (btnStop) { btnStop.addEventListener('click', stopNoteSequence); btnStop.disabled = true; }
    if (btnPause) btnPause.disabled = true;
}

/*
function setupDurationControls() {
    // ... (codice per i pulsanti durata, se riattivato)
}
*/

function setupNavigationButtons() {
    console.log(">>> MAIN setupNavigationButtons chiamato.");
    if (btnHome) btnHome.addEventListener('click', () => showSection('home'));
    if (btnTeoriaMusicale) btnTeoriaMusicale.addEventListener('click', () => showSection('teoria'));
    if (btnEserciziTeorici) btnEserciziTeorici.addEventListener('click', () => showSection('selezione_esercizi'));
    if (btnVerifica) btnVerifica.addEventListener('click', () => showSection('verifica'));
}

async function playNoteSequence() {
    if (isPlayingSequence || userEnteredNotes.length === 0) return;
    console.log(">>> PLAYBACK: Avvio sequenza note...");
    isPlayingSequence = true;
    if (btnPlay) btnPlay.disabled = true;
    if (btnStop) btnStop.disabled = false;
    const noteDurationMs = 500;
    const intervalBetweenNotesMs = 600;
    for (let i = 0; i < userEnteredNotes.length; i++) {
        if (!isPlayingSequence) break;
        const noteEntry = userEnteredNotes[i];
        if (noteEntry.keys && noteEntry.keys.length > 0) {
            const vexNote = noteEntry.keys[0];
            const midiNote = vexFlowToMidi(vexNote);
            if (midiNote !== null) {
                playNoteSound(midiNote, noteDurationMs / 1000, 100);
                const keyElement = document.querySelector(`.key[data-midi="${midiNote}"]`);
                if (keyElement && !keyElement.classList.contains('key-is-hidden')) {
                    keyElement.classList.add('playing');
                    setTimeout(() => keyElement.classList.remove('playing'), noteDurationMs);
                }
            }
        }
        await new Promise(resolve => { playbackTimeoutId = setTimeout(resolve, intervalBetweenNotesMs); });
    }
    if (isPlayingSequence) stopNoteSequence();
}

function stopNoteSequence() {
    console.log(">>> PLAYBACK: Interruzione sequenza note...");
    isPlayingSequence = false;
    if (playbackTimeoutId) { clearTimeout(playbackTimeoutId); playbackTimeoutId = null; }
    stopAllSounds();
    if (btnPlay) btnPlay.disabled = false;
    if (btnStop) btnStop.disabled = true;
    allPianoKeys.forEach(key => key.classList.remove('playing'));
}

function handleNoteInput(vexFlowNote, midiNumber, velocity) {
    console.log(`>>> MAIN handleNoteInput: Nota=${vexFlowNote}, MIDI=${midiNumber}, Vel=${velocity}, Durata=${currentSelectedDuration}, Sezione=${currentSection}`);
    if (midiNumber !== undefined && midiNumber !== null && midiNumber >= 0 && velocity > 0) {
        playNoteSound(midiNumber, 0.7, velocity);
    }

    if (currentSection === 'verifica' && activeInputHandler === processVerificationInput) {
        console.log(`>>> MAIN handleNoteInput: Input per VERIFICA. Reindirizzando a processVerificationInput.`);
        activeInputHandler(vexFlowNote);
    } else {
        const isExerciseSection = ['quiz_notes', 'exercise_durations', 'exercise_intervals', 'exercise_alterations', 'exercise_triads'].includes(currentSection);
        if (activeInputHandler && isExerciseSection) {
            activeInputHandler(vexFlowNote);
        } else if (currentSection === 'teoria') {
            if (activeInputHandler && typeof activeInputHandler === 'function') {
                activeInputHandler(vexFlowNote);
            }
        } else if (currentSection === 'home') {
            userEnteredNotes.push({ keys: [vexFlowNote], duration: currentSelectedDuration });
            renderUserNotesOnStaff();
        }
    }
}

function handleMIDINoteOn(noteNameMIDI, midiNoteNumber, velocity) {
    console.log(`>>> MAIN handleMIDINoteOn: Nota=${noteNameMIDI}, MIDI=${midiNoteNumber}, Vel=${velocity}`);
    const keyElement = document.querySelector(`.key[data-midi="${midiNoteNumber}"]`);
    if (keyElement) {
        if (keyElement.classList.contains('key-is-hidden')) return;
        if (velocity > 0) {
            keyElement.classList.add('playing');
            setTimeout(() => { keyElement.classList.remove('playing'); }, 200);
        }
    }
    handleNoteInput(noteNameMIDI, midiNoteNumber, velocity);
}

function updateMIDIStatusUI(message, isConnected) {
    if (midiStatusIndicator) { midiStatusIndicator.textContent = `MIDI: ${message}`; isMidiReady = isConnected; midiStatusIndicator.classList.remove('connected', 'error'); if (isConnected) { midiStatusIndicator.classList.add('connected'); } else if (message.toLowerCase().includes('errore') || message.toLowerCase().includes('nessun dispositivo')) { midiStatusIndicator.classList.add('error'); } }
}

function toggleExtraKeysMode() {
    areExtraKeysEnabled = !areExtraKeysEnabled;
    allPianoKeys.forEach(keyElement => {
        const noteValue = keyElement.dataset.note;
        if (extraKeysNoteValues.includes(noteValue)) {
            keyElement.classList.toggle('key-is-hidden', !areExtraKeysEnabled);
        }
    });
    if (toggleExtraKeysBtn) {
        toggleExtraKeysBtn.textContent = areExtraKeysEnabled ? "Modalità Tastiera Ridotta" : "Modalità Tastiera Estesa";
    }
}

function toggleStaffNoteNames() {
    areStaffNoteNamesVisible = !areStaffNoteNamesVisible;
    renderUserNotesOnStaff();
    if (toggleStaffNoteNamesBtn) {
        toggleStaffNoteNamesBtn.textContent = areStaffNoteNamesVisible ? "Note Scritte (Pentagramma) ON" : "Note Scritte (Pentagramma) OFF";
    }
}

function clearStaff() {
    console.log(">>> MAIN clearStaff");
    userEnteredNotes = [];
    renderUserNotesOnStaff();
}

function showSection(sectionName) {
    console.log(`>>> MAIN showSection: Tentativo di mostrare "${sectionName}"`);
    if (isPlayingSequence) stopNoteSequence();
    currentSection = sectionName;
    activeInputHandler = null;

    document.querySelectorAll('#top-navigation .nav-button').forEach(btn => btn.classList.remove('active'));
    if (sectionName === 'home' && btnHome) btnHome.classList.add('active');
    else if (sectionName === 'teoria' && btnTeoriaMusicale) btnTeoriaMusicale.classList.add('active');
    else if (sectionName === 'verifica' && btnVerifica) btnVerifica.classList.add('active');
    else {
        const isExerciseRelated = ['selezione_esercizi', 'quiz_notes', 'exercise_durations', 'exercise_intervals', 'exercise_alterations', 'exercise_triads'].includes(sectionName);
        if (isExerciseRelated && btnEserciziTeorici) btnEserciziTeorici.classList.add('active');
    }

    if (!contentArea) { console.error("FATAL: contentArea non trovato!"); return; }
    contentArea.innerHTML = '';

    if (mainTvScreensContainer) {
        if (sectionName === 'home') {
            mainTvScreensContainer.style.display = 'flex';
            const tvContent = mainTvScreensContainer.querySelector('#center-main-tv .main-tv-screen-content');
            if (tvContent && (tvContent.children.length === 0 || !tvContent.textContent.includes("Piano Tutor cildren"))) {
                 tvContent.innerHTML = `<h2>Piano Tutor cildren</h2><p>Benvenuti su piano tutor cildren</p>`;
            }
        } else {
            mainTvScreensContainer.style.display = 'none';
        }
    }

    const shouldShowFooter = sectionName === 'home';
    if (pianoSectionFooter) {
        pianoSectionFooter.style.display = shouldShowFooter ? 'flex' : 'none';
        if (shouldShowFooter) renderUserNotesOnStaff();
    }

    switch (sectionName) {
        case 'home': break;
        case 'teoria': setupTheoryEnvironment(); break;
        case 'selezione_esercizi': showExerciseSelectionScreen(); break;
        case 'verifica':
            setupVerificationExerciseUI(contentArea.id);
            startVerificationExercise();
            activeInputHandler = processVerificationInput;
            break;
        case 'quiz_notes': setupQuizEnvironment(); break;
        case 'exercise_durations': setupDurationExerciseEnvironment(); break;
        case 'exercise_intervals': setupIntervalExerciseEnvironment(); break;
        case 'exercise_alterations': setupAlterationExerciseEnvironment(); break;
        case 'exercise_triads': setupTriadExerciseEnvironment(); break;
        default: showSection('home'); break;
    }
    console.log(`>>> MAIN showSection: Sezione "${currentSection}" caricata e visualizzata.`);
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
    if (document.getElementById(noteBtnId)) addInputButtons(noteBtnId, noteNames, 'note_theory');
    activeInputHandler = processTheoryInput;

    const titleCap2 = document.createElement('h2'); titleCap2.textContent = 'Capitolo 2'; titleCap2.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap2);
    setupDurationTheoryUI(contentArea);
    const durationNames = getDurationNamesHTML(); const durationBtnId = getDurationTheoryButtonsId();
    if (document.getElementById(durationBtnId)) addInputButtons(durationBtnId, durationNames, 'duration_theory');

    const titleCap3 = document.createElement('h2'); titleCap3.textContent = 'Capitolo 3'; titleCap3.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap3);
    setupIntervalTheoryUI(contentArea);
    const intervalNames = getIntervalTheoryButtonNames(); const intervalBtnId = getIntervalTheoryInputButtonsId();
    if (document.getElementById(intervalBtnId)) addInputButtons(intervalBtnId, intervalNames, 'interval_theory');

    const titleCap4 = document.createElement('h2'); titleCap4.textContent = 'Capitolo 4'; titleCap4.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap4);
    setupAlterationTheoryUI(contentArea);
    const alterationButtonNames = getAlterationTheoryButtonNames(); const alterationBtnId = getAlterationTheoryInputButtonsId();
    if (document.getElementById(alterationBtnId)) addInputButtons(alterationBtnId, alterationButtonNames, 'alteration_theory');

    const titleCap5 = document.createElement('h2'); titleCap5.textContent = 'Capitolo 5'; titleCap5.style.cssText = 'margin-top: 40px; margin-bottom: 0px; text-align: center; color: #3f51b5;'; contentArea.appendChild(titleCap5);
    setupTriadTheoryUI(contentArea);
    const triadButtonNames = getTriadTheoryButtonNames(); const triadBtnId = getTriadTheoryInputButtonsId();
    if (document.getElementById(triadBtnId)) addInputButtons(triadBtnId, triadButtonNames, 'triad_theory');
}

function setupQuizEnvironment() {
    setupQuizUI(contentArea.id);
    const noteNames = getDiatonicC4C5NoteNamesHTML(); const btnId = getQuizNoteInputButtonsId();
    if (document.getElementById(btnId)) addInputButtons(btnId, noteNames, 'note_exercise');
    startQuiz(); activeInputHandler = processQuizInput;
}
function setupDurationExerciseEnvironment() {
    setupDurationExerciseUI(contentArea.id);
    const durationNames = getDurationExerciseButtonNames(); const btnId = getDurationExerciseInputButtonsId();
    if (document.getElementById(btnId)) addInputButtons(btnId, durationNames, 'duration_exercise');
    startDurationExercise(); activeInputHandler = processDurationExerciseInput;
}
function setupIntervalExerciseEnvironment() {
    setupIntervalExerciseUI(contentArea.id);
    const intervalNames = getIntervalExerciseButtonNames(); const btnId = getIntervalExerciseInputButtonsId();
    if (document.getElementById(btnId)) addInputButtons(btnId, intervalNames, 'interval_exercise');
    startIntervalExercise(); activeInputHandler = processIntervalExerciseInput;
}
function setupAlterationExerciseEnvironment() {
    setupAlterationExerciseUI(contentArea.id); startAlterationExercise();
}
function setupTriadExerciseEnvironment() {
    setupTriadExerciseUI(contentArea.id); startTriadExercise();
}

window.addInputButtons = function(buttonsContainerId, itemNamesOrObjects, type) {
    console.log(`>>> MAIN addInputButtons: Aggiungendo pulsanti a #${buttonsContainerId} (tipo: ${type}). Oggetti:`, itemNamesOrObjects);
    const buttonsContainer = document.getElementById(buttonsContainerId);
    if (!buttonsContainer) { console.error(`Contenitore pulsanti "${buttonsContainerId}" non trovato!`); return; }
    buttonsContainer.innerHTML = '';
    itemNamesOrObjects.forEach(itemData => {
        const button = document.createElement('button');
        let buttonText, buttonValue;
        if (typeof itemData === 'object' && itemData.name !== undefined) {
            buttonText = itemData.name; buttonValue = itemData.value !== undefined ? itemData.value : itemData.name;
        } else {
            buttonText = itemData; buttonValue = itemData;
        }
        button.textContent = buttonText; button.classList.add('exercise-note-button');
        if (type === 'note_theory' || type === 'note_exercise') { button.dataset.noteNameItalian = buttonText.toLowerCase(); }
        else if (type === 'duration_theory' || type === 'duration_exercise') { button.dataset.durationName = buttonText; }
        else if (type === 'interval_theory') { button.dataset.intervalNameTheory = buttonText; }
        else if (type === 'interval_exercise') { button.dataset.intervalNameExercise = buttonText; }
        else if (type === 'alteration_theory') { button.dataset.alterationSymbol = buttonText.charAt(0); }
        else if (type === 'triad_theory') { button.dataset.triadNameTheory = buttonText; }
        else if (type === 'alteration_exercise_option') { button.dataset.answerOption = buttonValue; }
        else if (type === 'triad_exercise_option') { button.dataset.triadTypeOption = buttonValue; }
        button.addEventListener('click', () => {
            let vexKey = ""; let midiNumberForSound = null;
            if (type.endsWith('_theory')) {
                if (type === 'note_theory') activeInputHandler = processTheoryInput;
                else if (type === 'duration_theory') activeInputHandler = processDurationInput;
                else if (type === 'interval_theory') activeInputHandler = processIntervalTheoryInput;
                else if (type === 'alteration_theory') activeInputHandler = processAlterationTheoryInput;
                else if (type === 'triad_theory') activeInputHandler = processTriadTheoryInput;
            }
            if (type === 'note_theory' || type === 'note_exercise') {
                if (buttonText && buttonText.length >= 2) {
                    const notePart = buttonText.slice(0, -1).toLowerCase(); const octavePart = buttonText.slice(-1);
                    let baseNote = notePart.replace(/[#b]/g, ''); let accidental = '';
                    if (notePart.includes('#')) accidental = '#'; if (notePart.includes('b')) accidental = 'b';
                    const eq = { 'do': 'c', 're': 'd', 'mi': 'e', 'fa': 'f', 'sol': 'g', 'la': 'a', 'si': 'b' };
                    const enBase = eq[baseNote];
                    if (enBase) vexKey = `${enBase}${accidental}/${octavePart}`; else vexKey = buttonText;
                } else vexKey = buttonText;
                midiNumberForSound = vexFlowToMidi(vexKey);
            }
            switch (type) {
                case 'note_theory': if (midiNumberForSound !== null) playNoteSound(midiNumberForSound, 0.7, 100); processTheoryInput(vexKey); break;
                case 'duration_theory': processDurationInput(buttonValue); break;
                case 'interval_theory': processIntervalTheoryInput(buttonValue); break;
                case 'alteration_theory': processAlterationTheoryInput(button.dataset.alterationSymbol || buttonValue.charAt(0)); break;
                case 'triad_theory': processTriadTheoryInput(buttonValue); break;
                case 'note_exercise': handleNoteInput(vexKey, midiNumberForSound !== null ? midiNumberForSound : -1, 100); break;
                case 'duration_exercise': processDurationExerciseInput(buttonValue); break;
                case 'interval_exercise': processIntervalExerciseInput(buttonValue); break;
                case 'alteration_exercise_option': processAlterationExerciseInput(buttonValue); break;
                case 'triad_exercise_option': processTriadExerciseInput(buttonValue); break;
            }
        });
        buttonsContainer.appendChild(button);
    });
};

document.addEventListener('DOMContentLoaded', initializeApp);
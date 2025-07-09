/**
 * Piano Tutor cildren 
 * Copyright (c) 2023-2024 Lorenzetti Giuseppe
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



// js/verification_exercise.js
import { renderExercise, renderEmptyStaff } from './vexflow_renderer.js';
import { playNoteSound, vexFlowToMidi } from './audio_handler.js';

// --- STRUTTURA DATI ESERCIZI ---
const EXERCISE_CATEGORIES = [
    {
        name: "Scale Maggiori",
        exercises: [
            {
                name: "Scala di Do Maggiore", layout: "single", clef: "treble", keySignature: "C",
                notes: [
                    { keys: ["c/4"], duration: "q" }, { keys: ["d/4"], duration: "q" },
                    { keys: ["e/4"], duration: "q" }, { keys: ["f/4"], duration: "q" },
                    { keys: ["g/4"], duration: "q" }, { keys: ["a/4"], duration: "q" },
                    { keys: ["b/4"], duration: "q" }, { keys: ["c/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Sol Maggiore", layout: "single", clef: "treble", keySignature: "G",
                notes: [
                    { keys: ["g/4"], duration: "q" }, { keys: ["a/4"], duration: "q" },
                    { keys: ["b/4"], duration: "q" }, { keys: ["c/5"], duration: "q" },
                    { keys: ["d/5"], duration: "q" }, { keys: ["e/5"], duration: "q" },
                    { keys: ["f#/5"], duration: "q" }, { keys: ["g/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Re Maggiore", layout: "single", clef: "treble", keySignature: "D",
                notes: [
                    { keys: ["d/4"], duration: "q" }, { keys: ["e/4"], duration: "q" },
                    { keys: ["f#/4"], duration: "q" }, { keys: ["g/4"], duration: "q" },
                    { keys: ["a/4"], duration: "q" }, { keys: ["b/4"], duration: "q" },
                    { keys: ["c#/5"], duration: "q" }, { keys: ["d/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di La Maggiore", layout: "single", clef: "treble", keySignature: "A",
                notes: [
                    { keys: ["a/4"], duration: "q" }, { keys: ["b/4"], duration: "q" },
                    { keys: ["c#/5"], duration: "q" }, { keys: ["d/5"], duration: "q" },
                    { keys: ["e/5"], duration: "q" }, { keys: ["f#/5"], duration: "q" },
                    { keys: ["g#/5"], duration: "q" }, { keys: ["a/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Mi Maggiore", layout: "single", clef: "treble", keySignature: "E",
                notes: [
                    { keys: ["e/4"], duration: "q" }, { keys: ["f#/4"], duration: "q" },
                    { keys: ["g#/4"], duration: "q" }, { keys: ["a/4"], duration: "q" },
                    { keys: ["b/4"], duration: "q" }, { keys: ["c#/5"], duration: "q" },
                    { keys: ["d#/5"], duration: "q" }, { keys: ["e/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Si Maggiore", layout: "single", clef: "treble", keySignature: "B",
                notes: [
                    { keys: ["b/3"], duration: "q" }, { keys: ["c#/4"], duration: "q" },
                    { keys: ["d#/4"], duration: "q" }, { keys: ["e/4"], duration: "q" },
                    { keys: ["f#/4"], duration: "q" }, { keys: ["g#/4"], duration: "q" },
                    { keys: ["a#/4"], duration: "q" }, { keys: ["b/4"], duration: "q" }
                ]
            },
            {
                name: "Scala di Fa Maggiore", layout: "single", clef: "treble", keySignature: "F",
                notes: [
                    { keys: ["f/4"], duration: "q" }, { keys: ["g/4"], duration: "q" },
                    { keys: ["a/4"], duration: "q" }, { keys: ["bb/4"], duration: "q" },
                    { keys: ["c/5"], duration: "q" }, { keys: ["d/5"], duration: "q" },
                    { keys: ["e/5"], duration: "q" }, { keys: ["f/5"], duration: "q" }
                ]
            }
        ]
    },
    {
        name: "Scale Minori",
        exercises: [
            {
                name: "Scala di La Minore Naturale", layout: "single", clef: "treble", keySignature: "Am",
                notes: [
                    { keys: ["a/4"], duration: "q" }, { keys: ["b/4"], duration: "q" },
                    { keys: ["c/5"], duration: "q" }, { keys: ["d/5"], duration: "q" },
                    { keys: ["e/5"], duration: "q" }, { keys: ["f/5"], duration: "q" },
                    { keys: ["g/5"], duration: "q" }, { keys: ["a/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Mi Minore Naturale", layout: "single", clef: "treble", keySignature: "Em",
                notes: [
                    { keys: ["e/4"], duration: "q" }, { keys: ["f#/4"], duration: "q" },
                    { keys: ["g/4"], duration: "q" }, { keys: ["a/4"], duration: "q" },
                    { keys: ["b/4"], duration: "q" }, { keys: ["c/5"], duration: "q" },
                    { keys: ["d/5"], duration: "q" }, { keys: ["e/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Si Minore Naturale", layout: "single", clef: "treble", keySignature: "Bm",
                notes: [
                    { keys: ["b/3"], duration: "q" }, { keys: ["c#/4"], duration: "q" },
                    { keys: ["d/4"], duration: "q" }, { keys: ["e/4"], duration: "q" },
                    { keys: ["f#/4"], duration: "q" }, { keys: ["g/4"], duration: "q" },
                    { keys: ["a/4"], duration: "q" }, { keys: ["b/4"], duration: "q" }
                ]
            },
            {
                name: "Scala di Fa# Minore Naturale", layout: "single", clef: "treble", keySignature: "F#m",
                notes: [
                    { keys: ["f#/4"], duration: "q" }, { keys: ["g#/4"], duration: "q" },
                    { keys: ["a/4"], duration: "q" }, { keys: ["b/4"], duration: "q" },
                    { keys: ["c#/5"], duration: "q" }, { keys: ["d/5"], duration: "q" },
                    { keys: ["e/5"], duration: "q" }, { keys: ["f#/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Do# Minore Naturale", layout: "single", clef: "treble", keySignature: "C#m",
                notes: [
                    { keys: ["c#/4"], duration: "q" }, { keys: ["d#/4"], duration: "q" },
                    { keys: ["e/4"], duration: "q" }, { keys: ["f#/4"], duration: "q" },
                    { keys: ["g#/4"], duration: "q" }, { keys: ["a/4"], duration: "q" },
                    { keys: ["b/4"], duration: "q" }, { keys: ["c#/5"], duration: "q" }
                ]
            },
            {
                name: "Scala di Sol Minore Naturale", layout: "single", clef: "treble", keySignature: "Gm",
                notes: [
                    { keys: ["g/4"], duration: "q" }, { keys: ["a/4"], duration: "q" },
                    { keys: ["bb/4"], duration: "q" }, { keys: ["c/5"], duration: "q" },
                    { keys: ["d/5"], duration: "q" }, { keys: ["eb/5"], duration: "q" },
                    { keys: ["f/5"], duration: "q" }, { keys: ["g/5"], duration: "q" }
                ]
            },
             {
                name: "Scala di Re Minore Naturale", layout: "single", clef: "treble", keySignature: "Dm",
                notes: [
                    { keys: ["d/4"], duration: "q" }, { keys: ["e/4"], duration: "q" },
                    { keys: ["f/4"], duration: "q" }, { keys: ["g/4"], duration: "q" },
                    { keys: ["a/4"], duration: "q" }, { keys: ["bb/4"], duration: "q" },
                    { keys: ["c/5"], duration: "q" }, { keys: ["d/5"], duration: "q" }
                ]
            }
        ]
    },
    {
        name: "Accordi",
        exercises: [
            // Accordi Maggiori
            { name: "Accordo di Do Maggiore", layout: "single", clef: "treble", keySignature: "C", notes: [{ keys: ["c/4", "e/4", "g/4"], duration: "w" }] },
            { name: "Accordo di Sol Maggiore", layout: "single", clef: "treble", keySignature: "G", notes: [{ keys: ["g/4", "b/4", "d/5"], duration: "w" }] },
            { name: "Accordo di Re Maggiore", layout: "single", clef: "treble", keySignature: "D", notes: [{ keys: ["d/4", "f#/4", "a/4"], duration: "w" }] },
            { name: "Accordo di La Maggiore", layout: "single", clef: "treble", keySignature: "A", notes: [{ keys: ["a/4", "c#/5", "e/5"], duration: "w" }] },
            { name: "Accordo di Mi Maggiore", layout: "single", clef: "treble", keySignature: "E", notes: [{ keys: ["e/4", "g#/4", "b/4"], duration: "w" }] },
            { name: "Accordo di Si Maggiore", layout: "single", clef: "treble", keySignature: "B", notes: [{ keys: ["b/3", "d#/4", "f#/4"], duration: "w" }] },
            { name: "Accordo di Fa Maggiore", layout: "single", clef: "treble", keySignature: "F", notes: [{ keys: ["f/4", "a/4", "c/5"], duration: "w" }] },
            // Accordi Minori
            { name: "Accordo di Do Minore", layout: "single", clef: "treble", keySignature: "Cm", notes: [{ keys: ["c/4", "eb/4", "g/4"], duration: "w" }] },
            { name: "Accordo di Sol Minore", layout: "single", clef: "treble", keySignature: "Gm", notes: [{ keys: ["g/4", "bb/4", "d/5"], duration: "w" }] },
            { name: "Accordo di Re Minore", layout: "single", clef: "treble", keySignature: "Dm", notes: [{ keys: ["d/4", "f/4", "a/4"], duration: "w" }] },
            { name: "Accordo di La Minore", layout: "single", clef: "treble", keySignature: "Am", notes: [{ keys: ["a/4", "c/5", "e/5"], duration: "w" }] },
            { name: "Accordo di Mi Minore", layout: "single", clef: "treble", keySignature: "Em", notes: [{ keys: ["e/4", "g/4", "b/4"], duration: "w" }] },
            { name: "Accordo di Si Minore", layout: "single", clef: "treble", keySignature: "Bm", notes: [{ keys: ["b/3", "d/4", "f#/4"], duration: "w" }] },
            { name: "Accordo di Fa Minore", layout: "single", clef: "treble", keySignature: "Fm", notes: [{ keys: ["f/4", "ab/4", "c/5"], duration: "w" }] },
            // Accordi di Settima di Dominante
            { name: "Accordo di Do7", layout: "single", clef: "treble", keySignature: "C", notes: [{ keys: ["c/4", "e/4", "g/4", "bb/4"], duration: "w" }] },
            { name: "Accordo di Sol7", layout: "single", clef: "treble", keySignature: "G", notes: [{ keys: ["g/4", "b/4", "d/5", "f/5"], duration: "w" }] },
            { name: "Accordo di Re7", layout: "single", clef: "treble", keySignature: "D", notes: [{ keys: ["d/4", "f#/4", "a/4", "c/5"], duration: "w" }] },
            { name: "Accordo di La7", layout: "single", clef: "treble", keySignature: "A", notes: [{ keys: ["a/3", "c#/4", "e/4", "g/4"], duration: "w" }] },
            { name: "Accordo di Mi7", layout: "single", clef: "treble", keySignature: "E", notes: [{ keys: ["e/4", "g#/4", "b/4", "d/5"], duration: "w" }] },
            { name: "Accordo di Si7", layout: "single", clef: "treble", keySignature: "B", notes: [{ keys: ["b/3", "d#/4", "f#/4", "a/4"], duration: "w" }] },
            { name: "Accordo di Fa7", layout: "single", clef: "treble", keySignature: "F", notes: [{ keys: ["f/4", "a/4", "c/5", "eb/5"], duration: "w" }] }
        ]
    }
];
// --- FINE STRUTTURA DATI ESERCIZI ---

let currentExerciseData = {
    notes: [], notesTreble: [], notesBass: [],
    keySignature: "C", clef: "treble", layout: "single"
};
let verificationStaffId = 'verification-staff-output';
let verificationFeedbackId = 'verification-feedback';
let verificationKeyboardId = 'verification-keyboard-keys-verify';
let categorySelectId = 'verification-category-select';
let exerciseSelectId = 'verification-exercise-select';

// ====================================================================
// --- BLOCCO DI CODICE CORRETTO ---
// Sostituisce la vecchia mappa e la vecchia funzione `getEnharmonicTarget`
// ====================================================================

// Mappa COMPLETA che associa l'indice MIDI (0-11) al nome della nota.
const MIDI_INDEX_TO_NOTE_DATA = {
    0: { natural: "c" },
    1: { sharp: "c#", flat: "db" },
    2: { natural: "d" },
    3: { sharp: "d#", flat: "eb" },
    4: { natural: "e" },
    5: { natural: "f" },
    6: { sharp: "f#", flat: "gb" },
    7: { natural: "g" },
    8: { sharp: "g#", flat: "ab" },
    9: { natural: "a" },
    10: { sharp: "a#", flat: "bb" },
    11: { natural: "b" }
};

// Funzione 'getEnharmonicTarget' riscritta per essere più robusta e chiara.
function getEnharmonicTarget(midiNoteNumber, keySignature) {
    const octave = Math.floor(midiNoteNumber / 12) - 1;
    const noteIndexInOctave = midiNoteNumber % 12;

    const noteData = MIDI_INDEX_TO_NOTE_DATA[noteIndexInOctave];

    if (!noteData) {
        console.error(`VERIFICA: Indice MIDI non valido: ${noteIndexInOctave}`);
        return null; // Gestisce un caso anomalo
    }

    // Se la nota ha una versione 'naturale', usiamo quella. Questo ora funziona!
    if (noteData.natural) {
        return `${noteData.natural}/${octave}`;
    }
    // Altrimenti, è una nota alterata e decidiamo tra diesis e bemolle.
    else {
        // Logica per decidere se usare i bemolle
        const keyUsesFlats = (
            keySignature.includes("b") ||
            ["F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Gm", "Dm", "Cm", "Fm"].includes(keySignature)
        );

        const noteName = keyUsesFlats ? noteData.flat : noteData.sharp;
        return `${noteName}/${octave}`;
    }
}
// ====================================================================
// --- FINE DEL BLOCCO CORRETTO ---
// ====================================================================


function displayCurrentExerciseNotes() {
    const staffDiv = document.getElementById(verificationStaffId);
    if (!staffDiv) { console.error("VERIFICA: Contenitore pentagramma non trovato."); return; }
    console.log("VERIFICA: displayCurrentExerciseNotes - Dati:", JSON.stringify(currentExerciseData));

    const exerciseDataForRenderer = {
        timeSignature: '4/4',
        keySignature: currentExerciseData.keySignature,
        staveLayout: currentExerciseData.layout
    };

    if (currentExerciseData.layout === "grand") {
        exerciseDataForRenderer.notesTreble = [...(currentExerciseData.notesTreble || [])];
        exerciseDataForRenderer.notesBass = [...(currentExerciseData.notesBass || [])];
        console.log("VERIFICA: Rendering Grand Staff con Treble:", exerciseDataForRenderer.notesTreble, "Bass:", exerciseDataForRenderer.notesBass);
    } else {
        exerciseDataForRenderer.clef = currentExerciseData.clef;
        exerciseDataForRenderer.notes = [...(currentExerciseData.notes || [])];
        console.log("VERIFICA: Rendering Single Staff, Chiave:", exerciseDataForRenderer.clef, "Note:", exerciseDataForRenderer.notes);
    }
    const vexflowOptions = { showTextAnnotations: true, useFullWidth: true };

    try {
        const hasNotesToDraw = (currentExerciseData.layout === "grand" &&
                               ((currentExerciseData.notesTreble && currentExerciseData.notesTreble.length > 0) ||
                                (currentExerciseData.notesBass && currentExerciseData.notesBass.length > 0))) ||
                               (currentExerciseData.layout === "single" &&
                                currentExerciseData.notes && currentExerciseData.notes.length > 0);
        if (hasNotesToDraw) {
            renderExercise(verificationStaffId, exerciseDataForRenderer, vexflowOptions);
        } else {
            if (currentExerciseData.layout === "grand") {
                 renderExercise(verificationStaffId, { staveLayout: "grand", keySignature: currentExerciseData.keySignature, timeSignature: '4/4', notesTreble: [], notesBass: [] }, vexflowOptions);
            } else {
                renderEmptyStaff(verificationStaffId, currentExerciseData.clef, null, currentExerciseData.keySignature, 0, true, 15);
            }
        }
    } catch (e) { console.error("VERIFICA: Errore disegno VexFlow:", e); }
}

function updateFeedback(message) {
    const feedbackDiv = document.getElementById(verificationFeedbackId);
    if (feedbackDiv) feedbackDiv.textContent = message;
}

function loadSelectedExercise(categoryIndex, exerciseIndex) {
    console.log(`VERIFICA: loadSelectedExercise - CatIdx: ${categoryIndex}, ExIdx: ${exerciseIndex}`);
    const category = EXERCISE_CATEGORIES[categoryIndex];
    const exercise = category && category.exercises && category.exercises[exerciseIndex];
    if (!exercise) {
        currentExerciseData = { notes: [], notesTreble: [], notesBass: [], keySignature: "C", clef: "treble", layout: "single" };
        displayCurrentExerciseNotes(); updateFeedback("Errore: Esercizio non trovato."); return;
    }
    currentExerciseData.keySignature = exercise.keySignature || "C";
    currentExerciseData.layout = exercise.layout || "single";
    if (currentExerciseData.layout === "grand") {
        currentExerciseData.notesTreble = exercise.notesTreble ? JSON.parse(JSON.stringify(exercise.notesTreble)) : [];
        currentExerciseData.notesBass = exercise.notesBass ? JSON.parse(JSON.stringify(exercise.notesBass)) : [];
        currentExerciseData.notes = []; currentExerciseData.clef = "treble"; // Reset non rilevanti
    } else {
        currentExerciseData.notes = exercise.notes ? JSON.parse(JSON.stringify(exercise.notes)) : [];
        currentExerciseData.clef = exercise.clef || "treble";
        currentExerciseData.notesTreble = []; currentExerciseData.notesBass = []; // Reset non rilevanti
    }
    displayCurrentExerciseNotes();
    updateFeedback(`Esercizio "${exercise.name}" (${currentExerciseData.layout}, Tonalità: ${currentExerciseData.keySignature}). Suona per cancellare.`);
}

function populateCategorySelect() {
    const catSelect = document.getElementById(categorySelectId);
    if (!catSelect) { console.error("VERIFICA: Tendina categorie non trovata."); return; }
    catSelect.innerHTML = '<option value="-1" disabled selected>Scegli Categoria...</option>';
    EXERCISE_CATEGORIES.forEach((category, index) => {
        const option = document.createElement('option');
        option.value = index.toString(); option.textContent = category.name;
        catSelect.appendChild(option);
    });
    const newCatSelect = catSelect.cloneNode(true);
    catSelect.parentNode.replaceChild(newCatSelect, catSelect);
    newCatSelect.addEventListener('change', (event) => {
        const selectedCategoryIndex = parseInt(event.target.value, 10);
        const exSelect = document.getElementById(exerciseSelectId);
        if (exSelect) exSelect.innerHTML = '<option value="-1" disabled selected>Scegli Esercizio...</option>';
        currentExerciseData = { notes: [], notesTreble: [], notesBass: [], keySignature: "C", clef: "treble", layout: "single" };
        displayCurrentExerciseNotes();
        if (selectedCategoryIndex >= 0) {
            populateExerciseSelect(selectedCategoryIndex);
            updateFeedback("Scegli un esercizio specifico.");
        } else {
            updateFeedback("Scegli una categoria.");
        }
    });
}

function populateExerciseSelect(categoryIndex) {
    const exSelect = document.getElementById(exerciseSelectId);
    if (!exSelect) { console.error("VERIFICA: Tendina esercizi non trovata."); return; }
    const category = EXERCISE_CATEGORIES[categoryIndex];
    exSelect.innerHTML = '<option value="-1" disabled selected>Scegli Esercizio...</option>';
    if (category && category.exercises) {
        category.exercises.forEach((exercise, index) => {
            const option = document.createElement('option');
            option.value = index.toString(); option.textContent = exercise.name;
            exSelect.appendChild(option);
        });
    }
    const newExSelect = exSelect.cloneNode(true);
    exSelect.parentNode.replaceChild(newExSelect, exSelect);
    newExSelect.addEventListener('change', (event) => {
        const selectedExerciseIndex = parseInt(event.target.value, 10);
        if (selectedExerciseIndex >= 0) {
            loadSelectedExercise(categoryIndex, selectedExerciseIndex);
        } else {
            currentExerciseData = { notes: [], notesTreble: [], notesBass: [], keySignature: "C", clef: "treble", layout: "single" };
            displayCurrentExerciseNotes(); updateFeedback("Scegli un esercizio specifico.");
        }
    });
}

function setupVerificationKeyboardListeners() {
    const pianoKeysVerify = document.querySelectorAll(`#${verificationKeyboardId} .key`);
    if (!pianoKeysVerify || pianoKeysVerify.length === 0) return;
    pianoKeysVerify.forEach(keyElement => {
        const newKeyElement = keyElement.cloneNode(true);
        keyElement.parentNode.replaceChild(newKeyElement, keyElement);
        newKeyElement.addEventListener('mousedown', () => {
            const midiNumero = parseInt(newKeyElement.dataset.midi, 10);
            if (isNaN(midiNumero)) return;
            playNoteSound(midiNumero, 0.7, 100);
            const vexFlowKeyTarget = getEnharmonicTarget(midiNumero, currentExerciseData.keySignature);
            if (vexFlowKeyTarget) { // Aggiunto controllo per evitare errori se getEnharmonicTarget ritorna null
                console.log(`VERIFICA: Tasto MIDI ${midiNumero} premuto. Tonalità: ${currentExerciseData.keySignature}. Target: ${vexFlowKeyTarget}`);
                processVerificationInput(vexFlowKeyTarget);
            }
            newKeyElement.classList.add('playing'); setTimeout(() => { newKeyElement.classList.remove('playing'); }, 200);
        });
    });
}

export function setupVerificationExerciseUI(containerId) {
    console.log(">>> VERIFICA: setupVerificationExerciseUI chiamato.");
    const container = document.getElementById(containerId);
    if (!container) { console.error("VERIFICA: Contenitore UI non trovato"); return; }
    const whiteKeyWidth = 45; const blackKeyOffset = 14;

    container.innerHTML = `
        <div id="verification-exercise-container" style="width:100%; max-width: 900px; margin: 20px auto; padding: 20px; background-color: #fff; border: 1px solid #673ab7; border-radius: 10px; text-align: center;">
            <h2>Esercizio di Verifica Note</h2>
            <div style="margin-bottom: 10px;">
                <label for="${categorySelectId}" style="margin-right: 5px;">Categoria:</label>
                <select id="${categorySelectId}"></select>
            </div>
            <div style="margin-bottom: 20px;">
                <label for="${exerciseSelectId}" style="margin-right: 5px;">Esercizio Specifico:</label>
                <select id="${exerciseSelectId}"><option value="-1" disabled selected>Scegli Esercizio...</option></select>
            </div>
            <p>Suona le note mostrate sul pentagramma per cancellarle una ad una.</p>
            <div id="${verificationStaffId}" class="theory-exercise-staff-container"></div>
            <div id="${verificationFeedbackId}" style="margin-top: 15px; font-weight: bold;">Seleziona una categoria e un esercizio.</div>
            <div class="piano-container" style="margin-top: 25px; margin-bottom: 15px; display: flex; justify-content: center; overflow-x: auto;">
                <div class="piano" id="${verificationKeyboardId}" style="width: fit-content;">
                    <div class="key white" data-midi="48" data-note="C3">C3</div><div class="key white" data-midi="50" data-note="D3">D3</div><div class="key white" data-midi="52" data-note="E3">E3</div>
                    <div class="key white" data-midi="53" data-note="F3">F3</div><div class="key white" data-midi="55" data-note="G3">G3</div><div class="key white" data-midi="57" data-note="A3">A3</div>
                    <div class="key white" data-midi="59" data-note="B3">B3</div><div class="key white" data-midi="60" data-note="C4">C4</div><div class="key white" data-midi="62" data-note="D4">D4</div>
                    <div class="key white" data-midi="64" data-note="E4">E4</div><div class="key white" data-midi="65" data-note="F4">F4</div><div class="key white" data-midi="67" data-note="G4">G4</div>
                    <div class="key white" data-midi="69" data-note="A4">A4</div><div class="key white" data-midi="71" data-note="B4">B4</div><div class="key white" data-midi="72" data-note="C5">C5</div>
                    <div class="key white" data-midi="74" data-note="D5">D5</div><div class="key white" data-midi="76" data-note="E5">E5</div><div class="key white" data-midi="77" data-note="F5">F5</div>
                    <div class="key white" data-midi="79" data-note="G5">G5</div><div class="key white" data-midi="81" data-note="A5">A5</div><div class="key white" data-midi="83" data-note="B5">B5</div>
                    <div class="key white" data-midi="84" data-note="C6">C6</div>
                    <div class="key black" data-midi="49" data-note="C#3" style="left: calc(1 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="51" data-note="D#3" style="left: calc(2 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div>
                    <div class="key black" data-midi="54" data-note="F#3" style="left: calc(4 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="56" data-note="G#3" style="left: calc(5 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div>
                    <div class="key black" data-midi="58" data-note="A#3" style="left: calc(6 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="61" data-note="C#4" style="left: calc(8 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div>
                    <div class="key black" data-midi="63" data-note="D#4" style="left: calc(9 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="66" data-note="F#4" style="left: calc(11 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="68" data-note="G#4" style="left: calc(12 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="70" data-note="A#4" style="left: calc(13 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div>
                    <div class="key black" data-midi="73" data-note="C#5" style="left: calc(15 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="75" data-note="D#5" style="left: calc(16 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div>
                    <div class="key black" data-midi="78" data-note="F#5" style="left: calc(18 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="80" data-note="G#5" style="left: calc(19 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div><div class="key black" data-midi="82" data-note="A#5" style="left: calc(20 * ${whiteKeyWidth}px - ${blackKeyOffset}px);"></div>
                </div>
            </div>
            <button id="btn-reset-verification-exercise" style="margin-top:15px; padding: 8px 15px;">Ricarica Esercizio Attuale</button>
        </div>
    `;

    populateCategorySelect();
    const btnReset = document.getElementById('btn-reset-verification-exercise');
    if (btnReset) {
        const newBtnReset = btnReset.cloneNode(true);
        btnReset.parentNode.replaceChild(newBtnReset, btnReset);
        newBtnReset.addEventListener('click', () => {
            const catSelect = document.getElementById(categorySelectId);
            const exSelect = document.getElementById(exerciseSelectId);
            if (catSelect && catSelect.value !== "-1" && exSelect && exSelect.value !== "-1") {
                const catIdx = parseInt(catSelect.value, 10);
                const exIdx = parseInt(exSelect.value, 10);
                loadSelectedExercise(catIdx, exIdx);
            } else {
                updateFeedback("Nessun esercizio specifico selezionato da ricaricare.");
            }
        });
    }
    setupVerificationKeyboardListeners();
    displayCurrentExerciseNotes();
}

export function startVerificationExercise() {
    console.log(">>> VERIFICA: startVerificationExercise chiamato.");
    currentExerciseData = { notes: [], notesTreble: [], notesBass: [], keySignature: "C", clef: "treble", layout: "single" };
    displayCurrentExerciseNotes();
    updateFeedback("Seleziona una categoria e un esercizio per iniziare.");
    const catSelect = document.getElementById(categorySelectId);
    const exSelect = document.getElementById(exerciseSelectId);
    if (catSelect && catSelect.options.length > 0 && catSelect.options[0].value === "-1") {
        catSelect.value = "-1";
    }
    if (exSelect) {
        exSelect.innerHTML = '<option value="-1" disabled selected>Scegli Esercizio...</option>';
    }
}

export function processVerificationInput(vexFlowNoteClicked) {
    console.log(`VERIFICA: Processando input: ${vexFlowNoteClicked}. Layout: ${currentExerciseData.layout}, Tonalità: ${currentExerciseData.keySignature}`);
    if ( (currentExerciseData.layout === "single" && currentExerciseData.notes.length === 0) ||
         (currentExerciseData.layout === "grand" && currentExerciseData.notesTreble.length === 0 && currentExerciseData.notesBass.length === 0) ) {
        updateFeedback("Nessun esercizio caricato o note esaurite. Selezionane uno nuovo.");
        return;
    }

    let noteFoundAndRemoved = false;
    const targetNoteFromKeyboard = vexFlowNoteClicked.toLowerCase();

    const attemptRemove = (notesArray) => {
        if (!notesArray || notesArray.length === 0) return false;
        // La logica di rimozione deve cercare la prima nota/accordo corrispondente e fermarsi.
        // Partire dall'inizio (i=0) è più intuitivo per l'utente, che suona da sinistra a destra.
        for (let i = 0; i < notesArray.length; i++) {
            if (notesArray[i] && notesArray[i].keys && notesArray[i].keys.length > 0) {
                let matchInElement = false;
                // Per accordi (più keys) o note singole, controlla se la nota suonata è presente.
                // NON confrontare l'intero accordo.
                for (const keyInElement of notesArray[i].keys) {
                    if (keyInElement.toLowerCase() === targetNoteFromKeyboard) {
                        matchInElement = true;
                        break;
                    }
                }
                
                // Se la nota fa parte del primo elemento (nota o accordo) della sequenza
                if (matchInElement) {
                     // Caso speciale: se è un accordo, lo cancelliamo solo se è la prima nota dell'esercizio.
                     // In questo esercizio, gli accordi sono singoli, quindi questa logica funziona.
                     // Per sequenze di accordi, la logica andrebbe rivista.
                    console.log(`VERIFICA: NOTA TROVATA! Rimuovendo elemento [${notesArray[i].keys.join(', ')}] dall'array.`);
                    notesArray.splice(i, 1);
                    return true;
                }
                
                // Per le scale, l'utente DEVE suonare la prima nota della sequenza.
                // Se la nota suonata non è nella PRIMA nota/accordo da suonare, non facciamo nulla.
                // Questo previene la cancellazione di note a caso nel mezzo della scala.
                break; // Usciamo dal ciclo dopo aver controllato solo il primo elemento (i=0).
            }
        }
        return false;
    };

    if (currentExerciseData.layout === "grand") {
        if (attemptRemove(currentExerciseData.notesTreble)) {
            noteFoundAndRemoved = true;
        } else if (attemptRemove(currentExerciseData.notesBass)) {
            noteFoundAndRemoved = true;
        }
    } else {
        if (attemptRemove(currentExerciseData.notes)) {
            noteFoundAndRemoved = true;
        }
    }

    if (noteFoundAndRemoved) {
        displayCurrentExerciseNotes();
        const noTreble = !currentExerciseData.notesTreble || currentExerciseData.notesTreble.length === 0;
        const noBass = !currentExerciseData.notesBass || currentExerciseData.notesBass.length === 0;
        const noSingle = !currentExerciseData.notes || currentExerciseData.notes.length === 0;
        if ((currentExerciseData.layout === "grand" && noTreble && noBass) || (currentExerciseData.layout === "single" && noSingle)) {
            updateFeedback("Ottimo! Hai cancellato tutte le note! 🎉");
        } else {
            updateFeedback(`Nota ${vexFlowNoteClicked} cancellata. Suona la prossima.`);
        }
    } else {
        const nextNoteRequired = currentExerciseData.layout === 'single' ?
                                 (currentExerciseData.notes[0]?.keys.join(', ')) :
                                 (currentExerciseData.notesTreble[0]?.keys.join(', ') || currentExerciseData.notesBass[0]?.keys.join(', '));
        updateFeedback(`Sbagliato. La nota suonata (${vexFlowNoteClicked}) non è la prossima richiesta (${nextNoteRequired || 'N/A'}).`);
    }
}
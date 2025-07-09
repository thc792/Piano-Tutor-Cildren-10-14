/**
 * js/exercises/eserciziodurate.js
 * Modulo per l'esercizio di riconoscimento delle durate musicali.
 *
 * Piano App per Bambini
 */

// Importa le funzioni necessarie da vexflow_renderer.js (percorso relativo)
import { renderExercise } from '../vexflow_renderer.js';

// --- Costanti e Dati del Modulo ---
const EXERCISE_LENGTH = 10; // Numero di domande
const DURATION_DATA = [ // Dati delle durate (nome, nota VexFlow, pausa VexFlow)
    { name: 'Semibreve', durationNote: 'w', durationPause: 'wr' },
    { name: 'Minima', durationNote: 'h', durationPause: 'hr' },
    { name: 'Semiminima', durationNote: 'q', durationPause: 'qr' },
    { name: 'Croma', durationNote: '8', durationPause: '8r' },
    { name: 'Semicroma', durationNote: '16', durationPause: '16r' },
    { name: 'Biscroma', durationNote: '32', durationPause: '32r' },
    // { name: 'Semibiscroma', durationNote: '64', durationPause: '64r' } // Opzionale
];
const FIXED_KEY_FOR_DISPLAY = 'b/4'; // Nota fissa su cui disegnare i simboli

// --- Variabili di Stato dell'Esercizio ---
let exerciseQuestions = []; // Array delle domande { symbolDuration: 'w'/'wr'/..., correctName: 'Semibreve'/... }
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let exerciseStartTime = null;

// Riferimenti agli elementi UI (ID univoci per questo esercizio)
let exerciseStaffOutputId = 'duration-exercise-staff-output';
let exerciseFeedbackId = 'duration-exercise-feedback';
let exerciseInputButtonsId = 'duration-exercise-input-buttons';


// --- Funzioni Interne del Modulo ---

// Genera la sequenza di domande per l'esercizio
function generateExerciseQuestions() {
    exerciseQuestions = [];
    for (let i = 0; i < EXERCISE_LENGTH; i++) {
        // Scegli una durata casuale dai dati
        const randomIndex = Math.floor(Math.random() * DURATION_DATA.length);
        const chosenDuration = DURATION_DATA[randomIndex];

        // Decidi casualmente se mostrare la nota o la pausa
        const showNote = Math.random() < 0.5;
        const symbolDuration = showNote ? chosenDuration.durationNote : chosenDuration.durationPause;

        exerciseQuestions.push({
            symbolDuration: symbolDuration, // Durata VexFlow da mostrare (es. 'h' o 'hr')
            correctName: chosenDuration.name // Nome corretto da indovinare (es. 'Minima')
        });
    }
    console.log(">>> ESERCIZIO DURATE: Domande generate:", exerciseQuestions);
}

// Mostra il simbolo target corrente sul pentagramma dell'esercizio
function displayCurrentDurationSymbol() {
    if (!exerciseStaffOutputId) {
        console.error(">>> ESERCIZIO DURATE: exerciseStaffOutputId non impostato!");
        return;
    }
    if (currentQuestionIndex >= exerciseQuestions.length) {
        console.warn(">>> ESERCIZIO DURATE: Tentativo di mostrare simbolo oltre la fine.");
        return;
    }

    const question = exerciseQuestions[currentQuestionIndex];
    const symbolDuration = question.symbolDuration;
    // const isRest = symbolDuration.endsWith('r'); // Non più necessario con VexFlow 4

    console.log(`>>> ESERCIZIO DURATE: Mostrando domanda ${currentQuestionIndex + 1}: Simbolo ${symbolDuration} (Risposta: ${question.correctName})`);

    const exerciseDataForVexFlow = {
        clef: 'treble', 
        timeSignature: null, 
        keySignature: null, 
        notes: [
            {
                keys: [FIXED_KEY_FOR_DISPLAY], 
                duration: symbolDuration,
                status: 'default'
            }
        ]
    };

    const vexflowDrawingOptions = {
        showTextAnnotations: false 
    };

    try {
        renderExercise(exerciseStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions);
        console.log(">>> ESERCIZIO DURATE: Disegno simbolo target completato.");
    } catch (e) {
        console.error(">>> ESERCIZIO DURATE: Errore nel disegnare il simbolo target:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare il simbolo.</p>";
    }
    
    updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${EXERCISE_LENGTH}. Qual è questa figura?`);
}

function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) return;
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.textContent = message;
        feedbackDiv.style.color = color;
    }
}

// --- Funzioni Esportate per l'uso in main.js ---

export function setupDurationExerciseUI(containerId) {
    console.log(">>> ESERCIZIO DURATE: setupDurationExerciseUI chiamato.");
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`>>> ESERCIZIO DURATE: Contenitore UI "${containerId}" non trovato!`);
        return;
    }
    container.innerHTML = `
        <div id="duration-exercise-container">
            <h2>Esercizio Durate (Capitolo 2)</h2>
            <p>Identifica la figura musicale (nota o pausa) mostrata sul pentagramma cliccando il pulsante corretto.</p>
            <div id="${exerciseStaffOutputId}" style="height: 100px;"></div>
            <div id="${exerciseFeedbackId}"></div>
            <div id="${exerciseInputButtonsId}"></div>
        </div>
    `;
    console.log(">>> ESERCIZIO DURATE: Struttura UI creata.");
}

export function startDurationExercise() {
    console.log(">>> ESERCIZIO DURATE: startDurationExercise chiamato.");
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    generateExerciseQuestions();
    displayCurrentDurationSymbol(); 
    exerciseStartTime = Date.now();
    console.log(">>> ESERCIZIO DURATE: Esercizio avviato.");
}

export function processDurationExerciseInput(selectedDurationName) {
    console.log(`>>> ESERCIZIO DURATE: processDurationExerciseInput chiamato con input: ${selectedDurationName}`);

    if (currentQuestionIndex >= exerciseQuestions.length) {
        console.log(">>> ESERCIZIO DURATE: Esercizio già completato.");
        return; 
    }

    const correctAnswerName = exerciseQuestions[currentQuestionIndex].correctName;

    if (selectedDurationName === correctAnswerName) {
        updateFeedback(`Corretto! Era una ${correctAnswerName}. 🎉`, 'green');
        correctAnswersCount++;
    } else {
        updateFeedback(`Sbagliato. La risposta corretta era ${correctAnswerName}.`, 'red');
    }

    currentQuestionIndex++;
    
    const delay = selectedDurationName === correctAnswerName ? 1200 : 1800;

    setTimeout(() => {
        if (currentQuestionIndex < exerciseQuestions.length) {
            displayCurrentDurationSymbol(); 
        } else {
            const endTime = Date.now();
            const elapsedTimeSeconds = (endTime - exerciseStartTime) / 1000;
            const finalMessage = `Esercizio Completato! Risposte corrette: ${correctAnswersCount} su ${EXERCISE_LENGTH} in ${elapsedTimeSeconds.toFixed(1)} secondi. 🏆`;
            updateFeedback(finalMessage, 'blue');
            document.getElementById(exerciseInputButtonsId).innerHTML = ''; // Pulisci i pulsanti alla fine
        }
    }, delay);
}

export function getDurationExerciseButtonNames() {
    return DURATION_DATA.map(data => data.name);
}

export function getDurationExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}

// --- NUOVA FUNZIONE PER ESAME FINALE ---
/**
 * Genera una singola domanda casuale sul riconoscimento delle durate
 * e la restituisce in un formato standard per l'Exam Engine.
 */
export function generateRandomDurationQuestion() {
    // 1. Scegli una durata casuale
    const randomIndex = Math.floor(Math.random() * DURATION_DATA.length);
    const chosenDuration = DURATION_DATA[randomIndex];

    // 2. Decidi casualmente se mostrare la nota o la pausa
    const showNote = Math.random() < 0.5;
    const symbolDurationVex = showNote ? chosenDuration.durationNote : chosenDuration.durationPause;

    // 3. Costruisci l'oggetto domanda standardizzato
    return {
        type: 'duration_identification',
        inputType: 'buttons', // Anche questo tipo di domanda usa pulsanti
        data: {
            // Dati necessari per VexFlow
            notesToDisplay: [{
                keys: [FIXED_KEY_FOR_DISPLAY],
                duration: symbolDurationVex
            }],
            clef: 'treble',
            keySignature: null,
            
            // Dati per i pulsanti di risposta
            answerOptions: DURATION_DATA.map(d => d.name)
        },
        correctAnswer: chosenDuration.name
    };
}
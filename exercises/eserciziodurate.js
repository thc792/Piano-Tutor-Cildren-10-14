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
    const isRest = symbolDuration.endsWith('r');

    console.log(`>>> ESERCIZIO DURATE: Mostrando domanda ${currentQuestionIndex + 1}: Simbolo ${symbolDuration} (Risposta: ${question.correctName})`);

    const exerciseDataForVexFlow = {
        clef: 'treble', // Chiave fissa per riferimento visivo
        timeSignature: null, // Nessun tempo mostrato
        keySignature: null, // Nessuna armatura mostrata
        notes: [ // Array con un solo oggetto nota/pausa
            {
                keys: [FIXED_KEY_FOR_DISPLAY], // Chiave fissa
                duration: symbolDuration,
                // type: isRest ? 'r' : undefined, // VexFlow 4 gestisce le pause tramite durata (es. 'qr')
                status: 'default' // Stato normale
            }
        ]
    };

    const vexflowDrawingOptions = {
        showTextAnnotations: false // Non mostrare nomi
    };

    try {
        renderExercise(exerciseStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions);
        console.log(">>> ESERCIZIO DURATE: Disegno simbolo target completato.");
    } catch (e) {
        console.error(">>> ESERCIZIO DURATE: Errore nel disegnare il simbolo target:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare il simbolo.</p>";
    }

    // Aggiorna il feedback per indicare la domanda corrente
    updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${EXERCISE_LENGTH}. Qual è questa figura?`);
}

// Aggiorna il testo nell'area feedback
function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) return;
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.textContent = message;
        feedbackDiv.style.color = color;
    }
}

// --- Funzioni Esportate per l'uso in main.js ---

// Prepara la struttura HTML generale per l'ambiente dell'esercizio durate
export function setupDurationExerciseUI(containerId) {
    console.log(">>> ESERCIZIO DURATE: setupDurationExerciseUI chiamato.");
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`>>> ESERCIZIO DURATE: Contenitore UI "${containerId}" non trovato!`);
        return;
    }

    // Pulisce il container prima di aggiungere la UI dell'esercizio
    container.innerHTML = '';

    // Crea la struttura HTML
    container.innerHTML = `
        <div id="duration-exercise-container"> <!-- ID Contenitore specifico -->
            <h2>Esercizio Durate (Capitolo 2)</h2>
            <p>Identifica la figura musicale (nota o pausa) mostrata sul pentagramma cliccando il pulsante corretto.</p>
            <div id="${exerciseStaffOutputId}" style="height: 100px;">
                <!-- VexFlow disegnerà il simbolo target qui -->
            </div>
            <div id="${exerciseFeedbackId}">
                <!-- Feedback (corretto/sbagliato/progresso) -->
            </div>
            <div id="${exerciseInputButtonsId}">
                <!-- Pulsanti per le durate verranno aggiunti qui da main.js -->
            </div>
        </div>
    `;
    console.log(">>> ESERCIZIO DURATE: Struttura UI creata.");
}

// Avvia un nuovo esercizio di durate
export function startDurationExercise() {
    console.log(">>> ESERCIZIO DURATE: startDurationExercise chiamato.");
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    generateExerciseQuestions();
    displayCurrentDurationSymbol(); // Mostra il primo simbolo
    exerciseStartTime = Date.now();
    console.log(">>> ESERCIZIO DURATE: Esercizio avviato.");
}

// Processa l'input dell'utente (chiamato dal listener del pulsante in main.js)
export function processDurationExerciseInput(selectedDurationName) {
    console.log(`>>> ESERCIZIO DURATE: processDurationExerciseInput chiamato con input: ${selectedDurationName}`);

    if (currentQuestionIndex >= exerciseQuestions.length) {
        console.log(">>> ESERCIZIO DURATE: Esercizio già completato.");
        return; // Esercizio finito
    }

    const correctAnswerName = exerciseQuestions[currentQuestionIndex].correctName;

    if (selectedDurationName === correctAnswerName) {
        // Risposta corretta
        updateFeedback(`Corretto! Era una ${correctAnswerName}. 🎉`, 'green');
        console.log(">>> ESERCIZIO DURATE: Risposta corretta!");
        correctAnswersCount++;

        // Passa alla prossima domanda dopo un ritardo
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < exerciseQuestions.length) {
                displayCurrentDurationSymbol(); // Mostra prossimo simbolo
            } else {
                // Esercizio completato
                const endTime = Date.now();
                const elapsedTimeSeconds = (endTime - exerciseStartTime) / 1000;
                const finalMessage = `Esercizio Completato! Risposte corrette: ${correctAnswersCount} su ${EXERCISE_LENGTH} in ${elapsedTimeSeconds.toFixed(1)} secondi. 🏆`;
                updateFeedback(finalMessage, 'blue');
                console.log(">>> ESERCIZIO DURATE: Completato!", { correct: correctAnswersCount, total: EXERCISE_LENGTH, time: elapsedTimeSeconds });
                // TODO: Aggiungere pulsante per ricominciare o tornare alla selezione
            }
        }, 1200); // Pausa prima della prossima domanda

    } else {
        // Risposta sbagliata
        updateFeedback(`Sbagliato. La risposta corretta era ${correctAnswerName}. Riprova con la prossima.`, 'red');
        console.log(`>>> ESERCIZIO DURATE: Risposta sbagliata. Selezionato: ${selectedDurationName}, Corretta: ${correctAnswerName}`);
        // Evidenzia (opzionale) il pulsante sbagliato e/o quello giusto
        // Per ora, passiamo direttamente alla prossima domanda dopo un ritardo maggiore
         setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < exerciseQuestions.length) {
                displayCurrentDurationSymbol(); // Mostra prossimo simbolo
            } else {
                 // Esercizio completato (anche se l'ultima era sbagliata)
                const endTime = Date.now();
                const elapsedTimeSeconds = (endTime - exerciseStartTime) / 1000;
                const finalMessage = `Esercizio Completato! Risposte corrette: ${correctAnswersCount} su ${EXERCISE_LENGTH} in ${elapsedTimeSeconds.toFixed(1)} secondi. 🏆`;
                updateFeedback(finalMessage, 'blue');
                console.log(">>> ESERCIZIO DURATE: Completato!", { correct: correctAnswersCount, total: EXERCISE_LENGTH, time: elapsedTimeSeconds });
            }
        }, 1800); // Pausa più lunga dopo errore
    }
}

// Restituisce l'elenco dei nomi delle durate per i pulsanti
export function getDurationExerciseButtonNames() {
    return DURATION_DATA.map(data => data.name);
}

// Restituisce l'ID del contenitore dei pulsanti per questo esercizio
export function getDurationExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}
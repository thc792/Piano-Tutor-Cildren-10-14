/**
 * js/quiz_exercise.js
 * Modulo per gestire il quiz di note casuali.
 *
 * Piano App per Bambini
 *
 * Modificato: Il nome della nota target sul pentagramma appare solo dopo la risposta corretta.
 * Aggiunto: Tracciamento risposte corrette e tempo di esecuzione, mostrati alla fine.
 */

// Importa le funzioni necessarie dal tuo file vexflow_renderer.js
// Assicurati che questo percorso sia corretto rispetto a dove salvi quiz_exercise.js
import { renderExercise } from './vexflow_renderer.js';

// --- Costanti e Variabili del Quiz ---
const QUIZ_LENGTH = 20; // Numero di domande nel quiz
const DIATONIC_C4C5_NOTES = [ // Note diatoniche da C4 a C5 in formato VexFlow e nome italiano
    { key: 'c/4', name: 'Do4' },
    { key: 'd/4', name: 'Re4' },
    { key: 'e/4', name: 'Mi4' },
    { key: 'f/4', name: 'Fa4' },
    { key: 'g/4', name: 'Sol4' },
    { key: 'a/4', name: 'La4' },
    { key: 'b/4', name: 'Si4' },
    { key: 'c/5', name: 'Do5' }
];

let quizNotes = []; // Array delle note casuali per il quiz
let currentQuestionIndex = 0; // Indice della domanda corrente

// Variabili per il log e il punteggio (NUOVO)
let correctAnswersCount = 0;
let quizStartTime = null;


// Riferimenti agli elementi UI gestiti da questo modulo (main.js li passerà)
let exerciseStaffOutputId = null;
let exerciseFeedbackId = null;
let exerciseInputButtonsId = null; // Useremo questo per aggiungere/rimuovere pulsanti se necessario


// --- Funzioni Interne del Modulo Quiz ---

// Genera una sequenza casuale di note per il quiz
function generateQuizNotes() {
    quizNotes = [];
    for (let i = 0; i < QUIZ_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * DIATONIC_C4C5_NOTES.length);
        quizNotes.push(DIATONIC_C4C5_NOTES[randomIndex]);
    }
    console.log(">>> QUIZ: Note del quiz generate:", quizNotes.map(n => n.name).join(', '));
}

// Mostra la nota target corrente sul pentagramma dell'esercizio
// Aggiunto parametro forceShowAnnotation
function displayCurrentTargetNote(forceShowAnnotation = false) {
    if (!exerciseStaffOutputId) {
        console.error(">>> QUIZ: exerciseStaffOutputId non impostato!");
        return;
    }

    if (currentQuestionIndex >= quizNotes.length) {
        console.warn(">>> QUIZ: Tentativo di mostrare nota oltre la fine del quiz.");
        return;
    }

    const targetNote = quizNotes[currentQuestionIndex];
    console.log(`>>> QUIZ: Mostrando nota target per domanda ${currentQuestionIndex + 1}: ${targetNote.name} (${targetNote.key}). Mostra annotazione: ${forceShowAnnotation}`);

    const exerciseDataForVexFlow = {
        clef: 'treble', // Chiave fissa per il quiz
        timeSignature: '4/4', // Tempo fisso per il quiz
        keySignature: 'C', // Armatura fissa per il quiz
        notes: [
            { keys: [targetNote.key], duration: 'q' } // Disegna solo la nota target
        ]
    };

    const vexflowDrawingOptions = {
        // Usa il parametro per decidere se mostrare l'annotazione
        showTextAnnotations: forceShowAnnotation
    };

    try {
        renderExercise(exerciseStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions);
        console.log(">>> QUIZ: Disegno nota target completato.");
    } catch (e) {
        console.error(">>> QUIZ: Errore nel disegnare la nota target del quiz:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare la nota dell'esercizio.</p>";
    }

    // Aggiorna il feedback per indicare la domanda corrente (solo se non stiamo mostrando la risposta)
    if (!forceShowAnnotation) {
        updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${QUIZ_LENGTH}. Suona:`);
    }
}

// Aggiorna il testo nell'area feedback
function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) {
        console.error(">>> QUIZ: exerciseFeedbackId non impostato!");
        return;
    }
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.textContent = message;
        feedbackDiv.style.color = color;
    }
}

// --- Funzioni Esportate per l'uso in main.js ---

// Prepara la struttura HTML generale per l'ambiente quiz nell'area principale
export function setupQuizUI(containerId) {
    console.log(">>> QUIZ: setupQuizUI chiamato.");
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`>>> QUIZ: Contenitore UI "${containerId}" non trovato!`);
        return;
    }

    // Imposta i riferimenti agli elementi UI
    exerciseStaffOutputId = 'exercise-staff-output'; // ID del div per il pentagramma
    exerciseFeedbackId = 'exercise-feedback'; // ID del div per il feedback
    exerciseInputButtonsId = 'exercise-input-buttons'; // ID del div per i pulsanti

    // Crea la struttura HTML per l'ambiente quiz
    container.innerHTML = `
        <div id="exercise-container">
            <h2>Quiz di Note Casuali</h2>
            <p>Suona la nota mostrata sul pentagramma. Puoi usare la tastiera MIDI o i pulsanti qui sotto.</p>
            <div id="${exerciseStaffOutputId}">
                <!-- VexFlow disegnerà la nota target qui -->
            </div>
            <div id="${exerciseFeedbackId}">
                <!-- Qui apparirà il feedback (corretto/sbagliato/progresso) -->
            </div>
            <div id="${exerciseInputButtonsId}">
                <!-- I pulsanti per l'input delle note verranno aggiunti qui da main.js -->
            </div>
        </div>
    `;
    console.log(">>> QUIZ: Struttura UI del quiz creata.");
}

// Avvia un nuovo quiz
export function startQuiz() {
    console.log(">>> QUIZ: startQuiz chiamato.");
    currentQuestionIndex = 0; // Resetta l'indice delle domande
    correctAnswersCount = 0; // Resetta il conteggio delle risposte corrette (NUOVO)
    generateQuizNotes(); // Genera nuove note per il quiz
    displayCurrentTargetNote(); // Mostra la prima nota (senza annotazione per default)
    quizStartTime = Date.now(); // Registra il tempo di inizio (NUOVO)
    console.log(">>> QUIZ: Quiz avviato. Tempo di inizio:", quizStartTime);
}

// Processa l'input dell'utente (chiamato da main.js)
export function processQuizInput(vexFlowNote) {
    console.log(`>>> QUIZ: processQuizInput chiamato con input: ${vexFlowNote}`);

    if (currentQuestionIndex >= quizNotes.length) {
        console.log(">>> QUIZ: Quiz già completato, input ignorato.");
        return; // Quiz già finito
    }

    const targetNoteKey = quizNotes[currentQuestionIndex].key;

    if (vexFlowNote === targetNoteKey) {
        // Nota corretta
        updateFeedback("Corretto! 🎉", 'green');
        console.log(">>> QUIZ: Nota corretta!");
        correctAnswersCount++; // Incrementa il conteggio delle risposte corrette (NUOVO)

        // Mostra il nome della nota corretta sul pentagramma
        displayCurrentTargetNote(true);

        // Passa alla prossima domanda dopo un breve ritardo
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < quizNotes.length) {
                displayCurrentTargetNote(); // Mostra la prossima nota (senza annotazione)
            } else {
                // Quiz completato (NUOVO)
                const endTime = Date.now(); // Registra il tempo di fine
                const elapsedTimeSeconds = (endTime - quizStartTime) / 1000; // Calcola il tempo trascorso in secondi
                const finalMessage = `Quiz Completato! Hai risposto correttamente a ${correctAnswersCount} su ${QUIZ_LENGTH} domande in ${elapsedTimeSeconds.toFixed(2)} secondi. 🏆`;
                updateFeedback(finalMessage, 'blue');
                console.log(">>> QUIZ: Quiz completato!", { correct: correctAnswersCount, total: QUIZ_LENGTH, time: elapsedTimeSeconds });
                // TODO: Aggiungere logica per mostrare un risultato finale o un pulsante per ricominciare
            }
        }, 800); // Breve pausa prima di passare alla prossima domanda

    } else {
        // Nota sbagliata
        updateFeedback("Sbagliato. Riprova.", 'red');
        console.log(`>>> QUIZ: Nota sbagliata. Suonata: ${vexFlowNote}, Attesa: ${targetNoteKey}`);
        // La nota target rimane visualizzata senza nome
    }

    // TODO: Potresti voler aggiungere la nota suonata (corretta o sbagliata) al pentagramma dell'esercizio
    // Questo richiederebbe una modifica più complessa a renderExercise o una logica di disegno separata qui.
}

// Restituisce l'elenco delle note diatoniche C4-C5 in formato HTML per i pulsanti
export function getDiatonicC4C5NoteNamesHTML() {
    // Restituisce i nomi italiani per i pulsanti
    return DIATONIC_C4C5_NOTES.map(note => note.name);
}

// Restituisce l'ID del contenitore dei pulsanti (utile per main.js)
export function getExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}
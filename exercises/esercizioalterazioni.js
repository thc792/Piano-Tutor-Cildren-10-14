/**
 * js/exercises/esercizioalterazioni.js
 * Modulo per l'esercizio di riconoscimento delle alterazioni.
 * AGGIUNTO: Punteggio e tracciamento tempo.
 */

import { renderExercise } from '../vexflow_renderer.js'; // o percorso corretto

// --- Costanti e Dati del Modulo ---
const EXERCISE_LENGTH = 10; // Numero di domande per questo esercizio

// Esempio di come potrebbero essere strutturate le domande.
// DEVI implementare la logica in generateExerciseQuestions per popolarlo correttamente.
const ALL_POSSIBLE_NOTES_WITH_ALTERATIONS = [
    { noteToDisplayKey: 'f/4', correctAnswerName: 'Fa', answerOptions: ['Fa', 'Fa#', 'Fab'] },
    { noteToDisplayKey: 'f#/4', correctAnswerName: 'Fa#', answerOptions: ['Fa', 'Fa#', 'Fab'] },
    { noteToDisplayKey: 'fb/4', correctAnswerName: 'Fab', answerOptions: ['Fa', 'Fa#', 'Fab'] },
    { noteToDisplayKey: 'c/4', correctAnswerName: 'Do', answerOptions: ['Do', 'Do#', 'Dob'] },
    { noteToDisplayKey: 'c#/4', correctAnswerName: 'Do#', answerOptions: ['Do', 'Do#', 'Dob'] },
    { noteToDisplayKey: 'cb/4', correctAnswerName: 'Dob', answerOptions: ['Do', 'Do#', 'Dob'] },
    { noteToDisplayKey: 'g/4', correctAnswerName: 'Sol', answerOptions: ['Sol', 'Sol#', 'Solb'] },
    { noteToDisplayKey: 'g#/4', correctAnswerName: 'Sol#', answerOptions: ['Sol', 'Sol#', 'Solb'] },
    { noteToDisplayKey: 'gb/4', correctAnswerName: 'Solb', answerOptions: ['Sol', 'Sol#', 'Solb'] },
    // Aggiungi altre note e le loro alterazioni comuni con le relative opzioni di risposta
    // Le answerOptions dovrebbero includere la risposta corretta e alcuni distrattori plausibili.
];


// --- Variabili di Stato dell'Esercizio ---
let exerciseQuestions = []; // Array di oggetti { noteToDisplayKey: 'f#/4', correctAnswerName: 'Fa#', answerOptions: ['Fa', 'Fa#', 'Fab'] }
let currentQuestionIndex = 0;
let correctAnswersCount = 0; // Per il punteggio
let exerciseStartTime = null;   // Per il tempo

// Riferimenti agli elementi UI
let exerciseStaffOutputId = 'alteration-exercise-staff'; 
let exerciseFeedbackId = 'alteration-exercise-feedback';
let exerciseInputButtonsId = 'alteration-exercise-buttons'; 

// --- Funzioni Interne del Modulo ---

function generateExerciseQuestions() {
    exerciseQuestions = [];
    const availableQuestions = [...ALL_POSSIBLE_NOTES_WITH_ALTERATIONS]; // Copia per poterla modificare

    for (let i = 0; i < EXERCISE_LENGTH; i++) {
        if (availableQuestions.length === 0) {
            // Se finiamo le domande uniche prima di raggiungere EXERCISE_LENGTH,
            // potremmo ricominciare a pescare o fermarci. Per ora, duplichiamo.
            // Per una migliore esperienza, ALL_POSSIBLE_NOTES_WITH_ALTERATIONS dovrebbe avere almeno EXERCISE_LENGTH elementi unici.
            const randomIndex = Math.floor(Math.random() * ALL_POSSIBLE_NOTES_WITH_ALTERATIONS.length);
            exerciseQuestions.push(ALL_POSSIBLE_NOTES_WITH_ALTERATIONS[randomIndex]);
        } else {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            exerciseQuestions.push(availableQuestions.splice(randomIndex, 1)[0]); // Prende e rimuove per evitare duplicati diretti
        }
    }
    console.log(">>> ESERCIZIO ALTERAZIONI: Domande generate:", exerciseQuestions.map(q => q.noteToDisplayKey));
}

function displayCurrentQuestion() {
    if (!exerciseStaffOutputId) { console.error(">>> ESERCIZIO ALTERAZIONI: exerciseStaffOutputId non trovato!"); return; }
    if (currentQuestionIndex >= EXERCISE_LENGTH) { 
        console.log(">>> ESERCIZIO ALTERAZIONI: Tentativo di mostrare domanda oltre la fine.");
        return; 
    }

    const question = exerciseQuestions[currentQuestionIndex];
    if (!question) {
        console.error(">>> ESERCIZIO ALTERAZIONI: Domanda non definita per l'indice corrente:", currentQuestionIndex);
        // Potrebbe essere utile mostrare un messaggio di errore o terminare l'esercizio qui
        showFinalScore(); // Termina l'esercizio se la domanda non è valida
        return;
    }

    console.log(`>>> ESERCIZIO ALTERAZIONI: Mostrando domanda ${currentQuestionIndex + 1}: Nota ${question.noteToDisplayKey}, Risposta attesa: ${question.correctAnswerName}`);

    const exerciseDataForVexFlow = {
        clef: 'treble', 
        timeSignature: null,
        keySignature: null, 
        notes: [{ keys: [question.noteToDisplayKey], duration: 'q', status: 'default' }]
    };
    const vexflowOptions = { 
        showTextAnnotations: false,
        // customStartY: 0 // Esempio se vuoi un Y specifico per questo esercizio
    };

    try {
        renderExercise(exerciseStaffOutputId, exerciseDataForVexFlow, vexflowOptions);
    } catch (e) { 
        console.error(">>> ESERCIZIO ALTERAZIONI: Errore VexFlow:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore VexFlow.</p>";
    }

    updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${EXERCISE_LENGTH}. Identifica la nota.`);
    
    // Aggiorna i pulsanti di risposta per la domanda corrente
    // Questo presuppone che tu abbia una funzione in main.js per creare/aggiornare i pulsanti
    // e che getAlterationExerciseButtonOptions() restituisca le opzioni per la domanda corrente.
    const buttonsContainer = document.getElementById(exerciseInputButtonsId);
    if (buttonsContainer && typeof window.addInputButtons === 'function') { // Assumendo che addInputButtons sia globale o importata
        const buttonOptions = getAlterationExerciseButtonOptions(); // Prende le opzioni per la domanda corrente
        window.addInputButtons(exerciseInputButtonsId, buttonOptions.map(opt => opt.name), 'alteration_exercise_option');
                                                                    // Passa un tipo specifico per i listener
    } else {
        console.warn(">>> ESERCIZIO ALTERAZIONI: Contenitore pulsanti o addInputButtons non trovato/configurato per aggiornamento dinamico.");
    }
}

function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) { console.error(">>> ESERCIZIO ALTERAZIONI: exerciseFeedbackId non trovato!"); return; }
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.innerHTML = ''; // Pulisci prima, per permettere HTML nel messaggio finale
        const p = document.createElement('p');
        p.textContent = message;
        p.style.color = color;
        feedbackDiv.appendChild(p);
    }
}

function showFinalScore() {
    const endTime = Date.now();
    const elapsedTimeSeconds = ((endTime - exerciseStartTime) / 1000).toFixed(1);
    const wrongAnswersCount = EXERCISE_LENGTH - correctAnswersCount;

    let finalMessageHTML = `<h3>Esercizio Completato!</h3>`;
    finalMessageHTML += `<p>Risposte Corrette: ${correctAnswersCount} su ${EXERCISE_LENGTH}</p>`;
    finalMessageHTML += `<p>Risposte Errate: ${wrongAnswersCount}</p>`;
    finalMessageHTML += `<p>Tempo Impiegato: ${elapsedTimeSeconds} secondi</p>`;
    
    // finalMessageHTML += `<button id="btn-restart-alteration-exercise" class="exercise-selection-button" style="margin-top:15px;">Ricomincia Esercizio</button>`;

    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.innerHTML = finalMessageHTML; 
        // Non impostare feedbackDiv.style.color qui, perché i tag h3/p hanno i loro stili.
        // Se vuoi colorare tutto il blocco, puoi farlo, ma di solito il colore è per messaggi temporanei.
    }
    // Nascondi i pulsanti di risposta
    const buttonsContainer = document.getElementById(exerciseInputButtonsId);
    if (buttonsContainer) {
        buttonsContainer.innerHTML = ''; // Pulisce i pulsanti di risposta
    }
    console.log(">>> ESERCIZIO ALTERAZIONI: Completato!", { correct: correctAnswersCount, wrong: wrongAnswersCount, total: EXERCISE_LENGTH, time: elapsedTimeSeconds });
}


// --- Funzioni Esportate per l'uso in main.js ---

export function setupAlterationExerciseUI(containerId) {
    console.log(">>> ESERCIZIO ALTERAZIONI: setupAlterationExerciseUI chiamato.");
    const container = document.getElementById(containerId);
    if (!container) { console.error(`>>> ESERCIZIO ALTERAZIONI: Contenitore UI "${containerId}" non trovato!`); return; }
    container.innerHTML = `
        <div id="alteration-exercise-container">
            <h2>Esercizio Alterazioni (Capitolo 4)</h2>
            <p>Identifica la nota mostrata sul pentagramma.</p>
            <div id="${exerciseStaffOutputId}" style="height: 100px;"></div>
            <div id="${exerciseFeedbackId}"></div>
            <div id="${exerciseInputButtonsId}">
                <!-- I pulsanti di risposta verranno aggiunti dinamicamente -->
            </div>
        </div>
    `;
}

export function startAlterationExercise() {
    console.log(">>> ESERCIZIO ALTERAZIONI: startAlterationExercise chiamato.");
    currentQuestionIndex = 0;
    correctAnswersCount = 0;      
    exerciseStartTime = Date.now(); 
    generateExerciseQuestions(); // Genera le domande
    if (exerciseQuestions.length > 0) {
        displayCurrentQuestion(); // Mostra la prima domanda e i suoi pulsanti di risposta
    } else {
        updateFeedback("Nessuna domanda generata per l'esercizio.", "red");
        console.error(">>> ESERCIZIO ALTERAZIONI: Nessuna domanda generata.");
    }
    // In main.js, quando si entra in questa sezione, activeInputHandler sarà impostato su processAlterationExerciseInput
    // Questo è per l'input da tastiera MIDI, se lo usi per rispondere.
    // I click sui pulsanti di risposta generati da displayCurrentQuestion chiameranno direttamente processAlterationExerciseInput.
}

// selectedAnswer qui è il NOME della nota cliccata (es. "Fa#")
export function processAlterationExerciseInput(selectedAnswerName) { 
    console.log(`>>> ESERCIZIO ALTERAZIONI: processAlterationExerciseInput con: ${selectedAnswerName}`);
    if (currentQuestionIndex >= EXERCISE_LENGTH) {
        console.log(">>> ESERCIZIO ALTERAZIONI: Esercizio già completato.");
        return; 
    }

    const question = exerciseQuestions[currentQuestionIndex];
    if (!question) {
        console.error(">>> ESERCIZIO ALTERAZIONI: Domanda corrente non valida in processInput.");
        showFinalScore(); // Termina se c'è un problema con le domande
        return;
    }
    const correctAnswerName = question.correctAnswerName; 

    if (selectedAnswerName === correctAnswerName) {
        updateFeedback("Corretto! 🎉", 'green');
        correctAnswersCount++; 
    } else {
        updateFeedback(`Sbagliato. La risposta corretta era ${correctAnswerName}.`, 'red');
    }

    currentQuestionIndex++;

    if (currentQuestionIndex < EXERCISE_LENGTH) {
        setTimeout(() => {
            displayCurrentQuestion(); // Mostra la prossima domanda e i suoi pulsanti
        }, 1200); 
    } else {
        setTimeout(() => {
            showFinalScore(); 
        }, 1000);
    }
}

export function getAlterationExerciseButtonOptions() {
    if (currentQuestionIndex < EXERCISE_LENGTH && exerciseQuestions[currentQuestionIndex]) {
        // Restituisce le opzioni come array di stringhe (i nomi per i pulsanti)
        return exerciseQuestions[currentQuestionIndex].answerOptions.map(opt => ({ name: opt, value: opt }));
        // Oppure, se le opzioni sono già solo stringhe:
        // return exerciseQuestions[currentQuestionIndex].answerOptions;
    }
    return []; // Array vuoto se non ci sono più domande o la domanda non è definita
}

export function getAlterationExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}
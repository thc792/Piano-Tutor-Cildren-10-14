/**
 * js/exercises/esercizioalterazioni.js
 * Modulo per l'esercizio di riconoscimento delle alterazioni.
 * AGGIUNTO: Punteggio e tracciamento tempo.
 */

import { renderExercise } from '../vexflow_renderer.js'; // o percorso corretto

// --- Costanti e Dati del Modulo ---
const EXERCISE_LENGTH = 10; // Numero di domande per questo esercizio

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
    const availableQuestions = [...ALL_POSSIBLE_NOTES_WITH_ALTERATIONS]; 

    for (let i = 0; i < EXERCISE_LENGTH; i++) {
        if (availableQuestions.length === 0) {
            const randomIndex = Math.floor(Math.random() * ALL_POSSIBLE_NOTES_WITH_ALTERATIONS.length);
            exerciseQuestions.push(ALL_POSSIBLE_NOTES_WITH_ALTERATIONS[randomIndex]);
        } else {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            exerciseQuestions.push(availableQuestions.splice(randomIndex, 1)[0]);
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
        showFinalScore();
        return;
    }

    console.log(`>>> ESERCIZIO ALTERAZIONI: Mostrando domanda ${currentQuestionIndex + 1}: Nota ${question.noteToDisplayKey}, Risposta attesa: ${question.correctAnswerName}`);

    const exerciseDataForVexFlow = {
        clef: 'treble', 
        timeSignature: null,
        keySignature: 'C', // Usiamo C per non avere alterazioni in chiave e vedere solo quella della nota
        notes: [{ keys: [question.noteToDisplayKey], duration: 'w', status: 'default' }]
    };
    const vexflowOptions = { 
        showTextAnnotations: false,
    };

    try {
        renderExercise(exerciseStaffOutputId, exerciseDataForVexFlow, vexflowOptions);
    } catch (e) { 
        console.error(">>> ESERCIZIO ALTERAZIONI: Errore VexFlow:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore VexFlow.</p>";
    }

    updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${EXERCISE_LENGTH}. Identifica la nota.`);
    
    // Il codice originale per i pulsanti è stato rimosso in una versione precedente,
    // La logica di creazione pulsanti ora è meglio gestirla dinamicamente
    const buttonsContainer = document.getElementById(exerciseInputButtonsId);
    if(buttonsContainer) {
        buttonsContainer.innerHTML = ''; // Pulisci vecchi pulsanti
        const currentOptions = question.answerOptions || [];
        currentOptions.forEach(optionName => {
            const button = document.createElement('button');
            button.textContent = optionName;
            button.classList.add('exercise-note-button');
            button.addEventListener('click', () => processAlterationExerciseInput(optionName));
            buttonsContainer.appendChild(button);
        });
    }
}

function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) { console.error(">>> ESERCIZIO ALTERAZIONI: exerciseFeedbackId non trovato!"); return; }
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.innerHTML = '';
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
    
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.innerHTML = finalMessageHTML; 
    }
    const buttonsContainer = document.getElementById(exerciseInputButtonsId);
    if (buttonsContainer) {
        buttonsContainer.innerHTML = '';
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
    generateExerciseQuestions(); 
    if (exerciseQuestions.length > 0) {
        displayCurrentQuestion();
    } else {
        updateFeedback("Nessuna domanda generata per l'esercizio.", "red");
        console.error(">>> ESERCIZIO ALTERAZIONI: Nessuna domanda generata.");
    }
}

export function processAlterationExerciseInput(selectedAnswerName) { 
    console.log(`>>> ESERCIZIO ALTERAZIONI: processAlterationExerciseInput con: ${selectedAnswerName}`);
    if (currentQuestionIndex >= EXERCISE_LENGTH) {
        console.log(">>> ESERCIZIO ALTERAZIONI: Esercizio già completato.");
        return; 
    }

    const question = exerciseQuestions[currentQuestionIndex];
    if (!question) {
        console.error(">>> ESERCIZIO ALTERAZIONI: Domanda corrente non valida in processInput.");
        showFinalScore(); 
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
            displayCurrentQuestion();
        }, 1200); 
    } else {
        setTimeout(() => {
            showFinalScore(); 
        }, 1000);
    }
}

export function getAlterationExerciseButtonOptions() {
    if (currentQuestionIndex < EXERCISE_LENGTH && exerciseQuestions[currentQuestionIndex]) {
        return exerciseQuestions[currentQuestionIndex].answerOptions.map(opt => ({ name: opt, value: opt }));
    }
    return []; 
}

export function getAlterationExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}

// --- NUOVA FUNZIONE PER ESAME FINALE ---
/**
 * Genera una singola domanda casuale sul riconoscimento delle alterazioni
 * e la restituisce in un formato standard per l'Exam Engine.
 */
export function generateRandomAlterationQuestion() {
    // 1. Scegli una domanda casuale dalla lista completa
    const randomIndex = Math.floor(Math.random() * ALL_POSSIBLE_NOTES_WITH_ALTERATIONS.length);
    const questionData = ALL_POSSIBLE_NOTES_WITH_ALTERATIONS[randomIndex];

    // 2. Costruisci l'oggetto domanda standardizzato
    return {
        type: 'alteration_identification',
        inputType: 'buttons', // Questo tipo di domanda usa pulsanti di testo
        data: {
            // Dati necessari per VexFlow per disegnare la nota
            notesToDisplay: [{ keys: [questionData.noteToDisplayKey], duration: 'w' }],
            clef: 'treble',
            keySignature: 'C', // Tonalità di Do per isolare l'alterazione
            
            // Dati necessari per creare i pulsanti di risposta
            answerOptions: questionData.answerOptions
        },
        correctAnswer: questionData.correctAnswerName
    };
}
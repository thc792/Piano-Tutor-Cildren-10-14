/**
 * js/exercises/eserciziointervalli.js
 * Modulo per l'esercizio di riconoscimento degli intervalli diatonici da Do4.
 */

// Importa le funzioni necessarie da vexflow_renderer.js
import { renderExercise } from '../vexflow_renderer.js'; // Assicurati percorso corretto

// --- Costanti e Dati del Modulo ---
const EXERCISE_LENGTH = 10; // Numero di domande
const INTERVAL_DATA = [ // Dati degli intervalli (Nome breve per risposta, note VexFlow)
    { nameShort: "Unisono", note1: 'c/4', note2: 'c/4' },
    { nameShort: "Seconda", note1: 'c/4', note2: 'd/4' },
    { nameShort: "Terza", note1: 'c/4', note2: 'e/4' },
    { nameShort: "Quarta", note1: 'c/4', note2: 'f/4' },
    { nameShort: "Quinta", note1: 'c/4', note2: 'g/4' },
    { nameShort: "Sesta", note1: 'c/4', note2: 'a/4' },
    { nameShort: "Settima", note1: 'c/4', note2: 'b/4' },
    { nameShort: "Ottava", note1: 'c/4', note2: 'c/5' },
];

// --- Variabili di Stato dell'Esercizio ---
let exerciseQuestions = []; // Array delle domande { note1: 'c/4', note2: 'g/4', correctName: 'Quinta' }
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let exerciseStartTime = null;

// Riferimenti agli elementi UI
let exerciseStaffOutputId = 'interval-exercise-staff';
let exerciseFeedbackId = 'interval-exercise-feedback';
let exerciseInputButtonsId = 'interval-exercise-buttons';

// --- Funzioni Interne del Modulo ---

// Genera la sequenza di domande
function generateIntervalExerciseQuestions() {
    exerciseQuestions = [];
    const availableIntervals = [...INTERVAL_DATA]; 

    for (let i = 0; i < EXERCISE_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * availableIntervals.length);
        const chosenInterval = availableIntervals[randomIndex];
        
        exerciseQuestions.push({
            note1: chosenInterval.note1,
            note2: chosenInterval.note2,
            correctName: chosenInterval.nameShort
        });
    }
    console.log(">>> ESERCIZIO INTERVALLI: Domande generate:", exerciseQuestions);
}

// Mostra le due note dell'intervallo target sul pentagramma
function displayCurrentIntervalQuestion() {
    if (!exerciseStaffOutputId) { console.error("ID pentagramma esercizio intervalli non impostato!"); return; }
    if (currentQuestionIndex >= exerciseQuestions.length) { console.warn("Tentativo di mostrare domanda oltre la fine."); return; }

    const question = exerciseQuestions[currentQuestionIndex];
    console.log(`>>> ESERCIZIO INTERVALLI: Mostrando domanda ${currentQuestionIndex + 1}: Note ${question.note1}, ${question.note2} (Risposta: ${question.correctName})`);

    const notesToDraw = [
        { keys: [question.note1], duration: 'h', status: 'default' },
        { keys: [question.note2], duration: 'h', status: 'default' }
    ];

    const exerciseData = {
        clef: 'treble', timeSignature: null, keySignature: 'C', notes: notesToDraw
    };
    const vexflowOptions = { showTextAnnotations: false }; 

    try {
        renderExercise(exerciseStaffOutputId, exerciseData, vexflowOptions);
        console.log(">>> ESERCIZIO INTERVALLI: Disegno domanda completato.");
    } catch (e) {
        console.error(">>> ESERCIZIO INTERVALLI: Errore disegno domanda:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore disegno domanda.</p>";
    }

    updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${EXERCISE_LENGTH}. Che intervallo è?`);
}

function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) return;
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) { feedbackDiv.textContent = message; feedbackDiv.style.color = color; }
}

// --- Funzioni Esportate ---

export function setupIntervalExerciseUI(containerElementOrId) {
    console.log(">>> ESERCIZIO INTERVALLI: setupIntervalExerciseUI chiamato.");
     const container = (typeof containerElementOrId === 'string')
        ? document.getElementById(containerElementOrId)
        : containerElementOrId;
    if (!container) { console.error(`>>> ESERCIZIO INTERVALLI: Contenitore UI non trovato!`); return; }

    container.innerHTML = `
        <div id="interval-exercise-container">
            <h2>Esercizio Intervalli (Capitolo 3)</h2>
            <p>Identifica l'intervallo mostrato sul pentagramma cliccando il pulsante corretto.</p>
            <div id="${exerciseStaffOutputId}" style="height: 120px;"></div>
            <div id="${exerciseFeedbackId}"></div>
            <div id="${exerciseInputButtonsId}"></div>
        </div>
    `;
    console.log(">>> ESERCIZIO INTERVALLI: Struttura UI creata.");
}

export function startIntervalExercise() {
    console.log(">>> ESERCIZIO INTERVALLI: startIntervalExercise chiamato.");
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    generateIntervalExerciseQuestions();
    displayCurrentIntervalQuestion();
    exerciseStartTime = Date.now();
    console.log(">>> ESERCIZIO INTERVALLI: Esercizio avviato.");
}

export function processIntervalExerciseInput(selectedIntervalName) {
    console.log(`>>> ESERCIZIO INTERVALLI: processIntervalExerciseInput chiamato con: ${selectedIntervalName}`);
    if (currentQuestionIndex >= exerciseQuestions.length) { console.log("Esercizio già completato."); return; }

    const correctAnswerName = exerciseQuestions[currentQuestionIndex].correctName;

    if (selectedIntervalName === correctAnswerName) {
        updateFeedback(`Corretto! Era una ${correctAnswerName}. 🎉`, 'green');
        correctAnswersCount++;
    } else {
        updateFeedback(`Sbagliato. La risposta corretta era ${correctAnswerName}.`, 'red');
    }
    
    const delay = selectedIntervalName === correctAnswerName ? 1200 : 1800;

    currentQuestionIndex++;
    
    setTimeout(() => {
        if (currentQuestionIndex < exerciseQuestions.length) {
            displayCurrentIntervalQuestion();
        } else {
            const endTime = Date.now();
            const elapsedTime = (endTime - exerciseStartTime) / 1000;
            updateFeedback(`Esercizio Finito! Corrette: ${correctAnswersCount}/${EXERCISE_LENGTH} in ${elapsedTime.toFixed(1)}s. 🏆`, 'blue');
            document.getElementById(exerciseInputButtonsId).innerHTML = ''; // Pulisci i pulsanti alla fine
        }
    }, delay);
}

export function getIntervalExerciseButtonNames() {
    return INTERVAL_DATA.map(data => data.nameShort);
}

export function getIntervalExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}

// --- NUOVA FUNZIONE PER ESAME FINALE ---
/**
 * Genera una singola domanda casuale sul riconoscimento degli intervalli
 * e la restituisce in un formato standard per l'Exam Engine.
 */
export function generateRandomIntervalQuestion() {
    // 1. Scegli un intervallo casuale
    const randomIndex = Math.floor(Math.random() * INTERVAL_DATA.length);
    const chosenInterval = INTERVAL_DATA[randomIndex];

    // 2. Costruisci l'oggetto domanda standardizzato
    return {
        type: 'interval_identification',
        inputType: 'buttons', // Anche questo tipo di domanda usa pulsanti
        data: {
            // Dati per VexFlow per disegnare le due note
            notesToDisplay: [
                { keys: [chosenInterval.note1], duration: 'h' },
                { keys: [chosenInterval.note2], duration: 'h' }
            ],
            clef: 'treble',
            keySignature: 'C',
            
            // Dati per i pulsanti di risposta
            answerOptions: INTERVAL_DATA.map(d => d.nameShort)
        },
        correctAnswer: chosenInterval.nameShort
    };
}
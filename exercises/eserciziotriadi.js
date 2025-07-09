/**
 * js/exercises/eserciziotriadi.js
 * Modulo per l'esercizio di identificazione completa delle triadi.
 */

import { renderExercise } from '../vexflow_renderer.js'; // Assicurati percorso corretto

// --- Costanti e Dati del Modulo ---
const EXERCISE_LENGTH = 10; // Almeno 10 domande
const TRIAD_DEFINITIONS = [ // Definizioni base delle triadi
    { nameComplete: "Do Maggiore", notes: ['c/4', 'e/4', 'g/4'] },
    { nameComplete: "Re minore", notes: ['d/4', 'f/4', 'a/4'] },
    { nameComplete: "Mi minore", notes: ['e/4', 'g/4', 'b/4'] },
    { nameComplete: "Fa Maggiore", notes: ['f/4', 'a/4', 'c/5'] },
    { nameComplete: "Sol Maggiore", notes: ['g/4', 'b/4', 'd/5'] },
    { nameComplete: "La minore", notes: ['a/4', 'c/5', 'e/5'] },
    { nameComplete: "Si diminuito", notes: ['b/4', 'd/5', 'f/5'] }
    // Potremmo aggiungere altre triadi in futuro (es. eccedenti, o su altre toniche)
];
const NUMBER_OF_ANSWER_OPTIONS = 4; // Quanti pulsanti di risposta mostrare

// --- Variabili di Stato dell'Esercizio ---
let exerciseQuestions = []; // { notesToDisplay: ['c/4', 'e/4', 'g/4'], correctAnswerName: "Do Maggiore", answerOptions: ["Do M", "Re m", "Fa M", "Sol M"] }
let currentQuestionIndex = 0;
let correctAnswersCount = 0;
let exerciseStartTime = null;

// Riferimenti UI
let exerciseStaffOutputId = 'triad-exercise-staff';
let exerciseFeedbackId = 'triad-exercise-feedback';
let exerciseInputButtonsId = 'triad-exercise-buttons';

// --- Funzioni Interne ---

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Mescola un array (algoritmo di Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Genera opzioni di risposta, includendo la corretta e dei distrattori
function generateAnswerOptions(correctTriadName) {
    const options = new Set();
    options.add(correctTriadName); // Aggiungi la risposta corretta

    // Estrai i nomi di tutte le triadi disponibili come possibili distrattori
    const allTriadNames = TRIAD_DEFINITIONS.map(t => t.nameComplete);

    // Aggiungi distrattori fino a raggiungere il numero desiderato di opzioni
    while (options.size < NUMBER_OF_ANSWER_OPTIONS && options.size < allTriadNames.length) {
        const randomDistractor = getRandomElement(allTriadNames);
        options.add(randomDistractor); // Set gestisce i duplicati automaticamente
    }
    return shuffleArray(Array.from(options)); // Converte in array e mescola
}

function generateTriadExerciseQuestions() {
    exerciseQuestions = [];
    const availableTriads = [...TRIAD_DEFINITIONS]; // Lavora su una copia

    for (let i = 0; i < EXERCISE_LENGTH; i++) {
        // Scegli una triade casuale per la domanda corrente
        // Per assicurare varietà, potremmo voler evitare ripetizioni immediate se EXERCISE_LENGTH > TRIAD_DEFINITIONS.length
        // Ma per 10 domande su 7 triadi, la casualità semplice va bene.
        const chosenTriad = getRandomElement(availableTriads);

        exerciseQuestions.push({
            notesToDisplay: chosenTriad.notes,
            correctAnswerName: chosenTriad.nameComplete,
            answerOptions: generateAnswerOptions(chosenTriad.nameComplete)
        });
    }
    console.log(">>> ESERCIZIO TRIADI: Domande generate:", exerciseQuestions);
}

function displayCurrentTriadQuestion() {
    if (!exerciseStaffOutputId) { console.error("ID pentagramma non impostato!"); return; }
    if (currentQuestionIndex >= exerciseQuestions.length) {
        console.warn("Fine esercizio, nessuna domanda da mostrare.");
        return;
    }

    const question = exerciseQuestions[currentQuestionIndex];
    console.log(`>>> ESERCIZIO TRIADI: Domanda ${currentQuestionIndex + 1}: Note ${question.notesToDisplay.join(', ')} (Risposta: ${question.correctAnswerName}) Opzioni:`, question.answerOptions);

    // --- MODIFICA CHIAVE QUI ---
    // Invece di mappare ogni nota a un oggetto separato, creiamo un singolo
    // oggetto nota (l'accordo) il cui array 'keys' contiene tutte le note della triade.
    const notesToDraw = [{
        keys: question.notesToDisplay, // Passa l'intero array di note qui!
        duration: 'w', // 'w' (whole note / semibreve) è ideale per un accordo statico
        status: 'default'
    }];
    // Questo produce: [{keys: ['c/4', 'e/4', 'g/4'], duration: 'w', ...}]
    // che VexFlow interpreta come "disegna un accordo con le note Do, Mi, Sol".

    // Impostiamo una time signature per chiarezza, anche se non la mostriamo
    const exerciseData = { clef: 'treble', timeSignature: '4/4', keySignature: 'C', notes: notesToDraw };
    const vexflowOptions = { showTextAnnotations: false }; // Non mostrare nomi Do, Re... sulla nota

    try {
        renderExercise(exerciseStaffOutputId, exerciseData, vexflowOptions);
    } catch (e) {
        console.error("Errore disegno triade esercizio:", e);
        const staffDiv = document.getElementById(exerciseStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare la triade.</p>";
    }

    updateFeedback(`Domanda ${currentQuestionIndex + 1} di ${EXERCISE_LENGTH}. Qual è questa triade?`);

    // --- CREAZIONE PULSANTI DINAMICA (invariata) ---
    const buttonsContainer = document.getElementById(exerciseInputButtonsId);
    if (buttonsContainer) {
        buttonsContainer.innerHTML = '';
        if (question.answerOptions && question.answerOptions.length > 0) {
            question.answerOptions.forEach(optionName => {
                const button = document.createElement('button');
                button.textContent = optionName;
                button.classList.add('exercise-note-button');
                button.dataset.triadAnswer = optionName;
                button.addEventListener('click', () => {
                    console.log(`>>> ESERCIZIO TRIADI: Pulsante cliccato: ${optionName}`);
                    processTriadExerciseInput(optionName);
                });
                buttonsContainer.appendChild(button);
            });
            console.log(">>> ESERCIZIO TRIADI: Pulsanti opzione creati:", question.answerOptions);
        } else {
            console.warn(">>> ESERCIZIO TRIADI: Nessuna opzione di risposta generata.");
        }
    } else {
        console.error(`Contenitore pulsanti "${exerciseInputButtonsId}" non trovato!`);
    }
}

function updateFeedback(message, color = '#333') {
    if (!exerciseFeedbackId) return;
    const feedbackDiv = document.getElementById(exerciseFeedbackId);
    if (feedbackDiv) { feedbackDiv.textContent = message; feedbackDiv.style.color = color; }
}

// --- Funzioni Esportate ---
export function setupTriadExerciseUI(containerElementOrId) {
    console.log(">>> ESERCIZIO TRIADI: setupTriadExerciseUI chiamato.");
    const container = (typeof containerElementOrId === 'string') ? document.getElementById(containerElementOrId) : containerElementOrId;
    if (!container) { console.error("Contenitore UI non trovato!"); return; }
    container.innerHTML = '';

    const exerciseDiv = document.createElement('div');
    exerciseDiv.id = 'triad-exercise-container'; // ID per CSS
    exerciseDiv.innerHTML = `
        <h2>Esercizio Triadi (Capitolo 5)</h2>
        <p>Identifica la triade mostrata sul pentagramma.</p>
        <div id="${exerciseStaffOutputId}" style="height: 120px;"></div>
        <div id="${exerciseFeedbackId}"></div>
        <div id="${exerciseInputButtonsId}">
            <!-- Pulsanti risposta verranno creati dinamicamente -->
        </div>
    `;
    container.appendChild(exerciseDiv);
    console.log(">>> ESERCIZIO TRIADI: Struttura UI creata.");
}

export function startTriadExercise() {
    console.log(">>> ESERCIZIO TRIADI: startTriadExercise chiamato.");
    currentQuestionIndex = 0;
    correctAnswersCount = 0;
    generateTriadExerciseQuestions(); // Genera le domande e le loro opzioni
    displayCurrentTriadQuestion();    // Mostra la prima domanda e i suoi pulsanti
    exerciseStartTime = Date.now();
    console.log(">>> ESERCIZIO TRIADI: Esercizio avviato.");
}

export function processTriadExerciseInput(selectedTriadName) { // Es. "Do Maggiore"
    console.log(`>>> ESERCIZIO TRIADI: Input: ${selectedTriadName}`);
    if (currentQuestionIndex >= EXERCISE_LENGTH) { // Controllo per evitare errori se si clicca dopo la fine
        console.log("Esercizio già formalmente completato.");
        return;
    }

    const correctAnswerName = exerciseQuestions[currentQuestionIndex].correctAnswerName;

    if (selectedTriadName === correctAnswerName) {
        updateFeedback(`Corretto! Era ${correctAnswerName}. 🎉`, 'green');
        correctAnswersCount++;
    } else {
        updateFeedback(`Sbagliato. La risposta corretta era ${correctAnswerName}.`, 'red');
    }

    currentQuestionIndex++; // Avanza alla prossima domanda o alla fine

    if (currentQuestionIndex < EXERCISE_LENGTH) {
        setTimeout(() => {
            displayCurrentTriadQuestion();
        }, selectedTriadName === correctAnswerName ? 1200 : 1800); // Ritardo diverso per corretto/sbagliato
    } else {
        // Fine esercizio
        const endTime = Date.now();
        const elapsedTimeSeconds = (endTime - exerciseStartTime) / 1000;
        setTimeout(() => { // Leggero ritardo per leggere l'ultimo feedback
            updateFeedback(`Esercizio Completato! Risposte corrette: ${correctAnswersCount} su ${EXERCISE_LENGTH} in ${elapsedTimeSeconds.toFixed(1)} secondi. 🏆`, 'blue');
            console.log(">>> ESERCIZIO TRIADI: Completato!", { correct: correctAnswersCount, total: EXERCISE_LENGTH, time: elapsedTimeSeconds });
            // TODO: Aggiungere pulsante per ricominciare o tornare alla selezione
            const buttonsContainer = document.getElementById(exerciseInputButtonsId);
            if(buttonsContainer) buttonsContainer.innerHTML = ''; // Pulisce i pulsanti alla fine
        }, selectedTriadName === correctAnswerName ? 1200 : 1800);
    }
}

// Questa funzione non è più necessaria per fornire nomi statici a main.js
// export function getTriadExerciseButtonNames() { /* ... */ }

export function getTriadExerciseInputButtonsId() {
    return exerciseInputButtonsId;
}
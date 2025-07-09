/**
 * js/esame_completo.js
 * Modulo per l'esame completo e randomizzato.
 * Questo "Exam Engine" orchestra domande da diversi moduli di esercizio.
 */

import { renderExercise, renderEmptyStaff } from './vexflow_renderer.js';

// 1. Importa i GENERATORI di domande da ogni modulo di esercizio
import { generateRandomAlterationQuestion } from './exercises/esercizioalterazioni.js';
import { generateRandomDurationQuestion } from './exercises/eserciziodurate.js';
import { generateRandomIntervalQuestion } from './exercises/eserciziointervalli.js';
import { generateRandomTriadQuestion } from './exercises/eserciziotriadi.js';
import { generateRandomVerificationQuestion } from './verification_exercise.js';


// --- Costanti e Dati del Modulo ---
const EXAM_LENGTH = 15; // Numero totale di domande nell'esame
const QUESTION_GENERATORS = [
    generateRandomAlterationQuestion,
    generateRandomDurationQuestion,
    generateRandomIntervalQuestion,
    generateRandomTriadQuestion,
    generateRandomVerificationQuestion // Aggiunto il generatore per le domande di verifica
];

// --- Variabili di Stato dell'Esame ---
let examQuestions = [];
let currentExamQuestionIndex = 0;
let examScore = 0;
let activeExamInputHandler = null; // Per gestire l'input da tastiera

// --- Riferimenti UI ---
let examStaffId = 'exam-staff';
let examFeedbackId = 'exam-feedback';
let examInputAreaId = 'exam-input-area';

// --- Funzioni Interne ---

/**
 * Crea la lista di domande per l'esame, pescando casualmente dai generatori.
 */
function generateExam() {
    examQuestions = [];
    for (let i = 0; i < EXAM_LENGTH; i++) {
        const randomGenerator = QUESTION_GENERATORS[Math.floor(Math.random() * QUESTION_GENERATORS.length)];
        examQuestions.push(randomGenerator());
    }
    console.log(">>> ESAME: Domande generate:", examQuestions);
}

/**
 * Mostra la domanda corrente sul pentagramma e prepara l'area di input.
 */
function displayCurrentExamQuestion() {
    if (currentExamQuestionIndex >= examQuestions.length) {
        showFinalExamScore();
        return;
    }

    const question = examQuestions[currentExamQuestionIndex];
    updateExamFeedback(`Domanda ${currentExamQuestionIndex + 1} di ${EXAM_LENGTH}.`);

    renderQuestionOnStaff(question);
    prepareInputArea(question);
}

/**
 * Renderizza la domanda corrente sul pentagramma usando VexFlow.
 * Questa funzione è ora più generica e robusta.
 * @param {object} question - L'oggetto domanda corrente.
 */
function renderQuestionOnStaff(question) {
    if (!question || !question.data || !question.data.notesToDisplay) {
        console.error("Dati della domanda non validi per il rendering.");
        renderEmptyStaff(examStaffId, 'treble', null, 'C');
        return;
    }

    const exerciseData = {
        clef: question.data.clef,
        timeSignature: question.data.timeSignature,
        keySignature: question.data.keySignature,
        notes: question.data.notesToDisplay
    };

    try {
        renderExercise(examStaffId, exerciseData, { showTextAnnotations: false });
    } catch (e) {
        console.error("ESAME: Errore VexFlow durante il rendering della domanda", e);
        const staffDiv = document.getElementById(examStaffId);
        if(staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare la domanda.</p>";
    }
}

/**
 * Prepara l'area di input (pulsanti o altro) in base al tipo di domanda.
 * @param {object} question - L'oggetto domanda corrente.
 */
function prepareInputArea(question) {
    const inputArea = document.getElementById(examInputAreaId);
    if (!inputArea) return;
    inputArea.innerHTML = '';
    activeExamInputHandler = null;

    switch (question.inputType) {
        case 'buttons':
            question.data.answerOptions.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('exercise-note-button');
                button.addEventListener('click', () => {
                    processExamAnswer(option, question.correctAnswer);
                });
                inputArea.appendChild(button);
            });
            break;

        case 'keyboard':
            const instruction = document.createElement('p');
            instruction.textContent = "Suona la nota o l'accordo corretto sulla tastiera.";
            instruction.style.fontWeight = 'bold';
            inputArea.appendChild(instruction);
            
            activeExamInputHandler = (vexFlowNotePlayed) => {
                processExamAnswer(vexFlowNotePlayed, question.correctAnswer);
            };
            break;
            
        default:
            console.error(`Tipo di input non gestito: ${question.inputType}`);
    }
}

/**
 * Processa la risposta data dall'utente, aggiorna il punteggio e avanza alla domanda successiva.
 * @param {string} userAnswer - La risposta fornita dall'utente.
 * @param {string} correctAnswer - La risposta corretta per la domanda corrente.
 */
function processExamAnswer(userAnswer, correctAnswer) {
    const inputArea = document.getElementById(examInputAreaId);
    if (inputArea) {
        inputArea.innerHTML = '<p>...</p>';
    }
    activeExamInputHandler = null;

    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        updateExamFeedback('Corretto! 🎉', 'green');
        examScore++;
    } else {
        updateExamFeedback(`Sbagliato. La risposta corretta era: ${correctAnswer}.`, 'red');
    }

    currentExamQuestionIndex++;

    setTimeout(() => {
        displayCurrentExamQuestion();
    }, 1500);
}

function showFinalExamScore() {
    updateExamFeedback(`Esame Finito! Punteggio finale: ${examScore} su ${EXAM_LENGTH}.`, 'blue');
    const inputArea = document.getElementById(examInputAreaId);
    if (inputArea) {
        inputArea.innerHTML = '';
    }
    console.log(`>>> ESAME: Completato. Punteggio: ${examScore}/${EXAM_LENGTH}`);
}

function updateExamFeedback(message, color = '#333') {
    const feedbackDiv = document.getElementById(examFeedbackId);
    if (feedbackDiv) {
        feedbackDiv.textContent = message;
        feedbackDiv.style.color = color;
    }
}

// --- Funzioni Esportate ---

/**
 * Crea la struttura HTML per l'esame all'interno del contenitore specificato.
 * @param {string} containerId - L'ID dell'elemento contenitore.
 */
export function setupExamUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`ESAME: Contenitore UI con ID "${containerId}" non trovato!`);
        return;
    }
    container.innerHTML = `
        <div id="exam-container" style="width:100%; max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; border: 1px solid #c0392b; border-radius: 10px; text-align: center;">
            <h2>Esame Finale</h2>
            <p>Rispondi a una serie di domande casuali da tutti i capitoli.</p>
            <div id="${examStaffId}" style="height: 150px; margin: 20px auto; border: 1px solid #ccc; border-radius: 5px; display: flex; justify-content: center; align-items: center; overflow: hidden;"></div>
            <div id="${examFeedbackId}" style="margin-top: 15px; font-weight: bold; min-height: 1.5em;"></div>
            <div id="${examInputAreaId}" style="margin-top: 20px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                <!-- L'area di input verrà popolata dinamicamente -->
            </div>
        </div>
    `;
}

/**
 * Avvia un nuovo esame.
 */
export function startExam() {
    console.log(">>> ESAME: Avvio esame...");
    currentExamQuestionIndex = 0;
    examScore = 0;
    activeExamInputHandler = null;
    generateExam();
    displayCurrentExamQuestion();
}

/**
 * Restituisce il gestore di input attivo, se ce n'è uno.
 * @returns {Function|null}
 */
export function getActiveExamInputHandler() {
    return activeExamInputHandler;
}
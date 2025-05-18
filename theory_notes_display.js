/**
  Piano Tutor Extrame Edition V2 (o il nome attuale del progetto)
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
 * https:https://github.com/thc792/PENTAGRAMMA-A-4/blob/main/LICENSE.md]
 * o contattare [pianothc791@gmail.com].
 */

// Importa le funzioni necessarie dal tuo file vexflow_renderer.js
import { renderExercise } from '../vexflow_renderer.js'; // Assicurati che il percorso sia corretto

// --- Dati e Variabili del Modulo ---
const THEORY_NOTES_DATA = [ // Note da visualizzare (es. C4-C5 diatoniche)
    { key: 'c/4', name: 'Do4' }, { key: 'd/4', name: 'Re4' }, { key: 'e/4', name: 'Mi4' },
    { key: 'f/4', name: 'Fa4' }, { key: 'g/4', name: 'Sol4' }, { key: 'a/4', name: 'La4' },
    { key: 'b/4', name: 'Si4' }, { key: 'c/5', name: 'Do5' }
];
let currentTheoryNotes = []; // Array VexFlow con stato
let highlightTimeoutId = null; // Per gestire timeout evidenziazione

// Riferimenti agli elementi UI (ID usati internamente e da main.js)
let theoryStaffOutputId = 'theory-staff-output';
let theoryFeedbackId = 'theory-feedback';
let theoryInputButtonsId = 'theory-input-buttons';

// --- Funzioni Interne del Modulo ---

// Prepara i dati delle note per VexFlow
function prepareNotesForDisplay() {
    console.log(">>> THEORY: prepareNotesForDisplay chiamato.");
    currentTheoryNotes = THEORY_NOTES_DATA.map(note => ({
        keys: [note.key], duration: 'q', status: 'default'
    }));
    console.log(">>> THEORY: Note preparate:", currentTheoryNotes);
}

// Disegna le note correnti sul pentagramma
function displayTheoryNotes() {
    console.log(">>> THEORY: displayTheoryNotes chiamato.");
    if (!theoryStaffOutputId) { console.error(">>> THEORY: theoryStaffOutputId non impostato!"); return; }
    console.log(">>> THEORY: Disegnando note teoriche:", currentTheoryNotes);
    const exerciseData = { clef: 'treble', timeSignature: '4/4', keySignature: 'C', notes: currentTheoryNotes };
    const vexflowOptions = { showTextAnnotations: true }; // Mostra nomi Do, Re, Mi...
    try {
        renderExercise(theoryStaffOutputId, exerciseData, vexflowOptions);
        console.log(">>> THEORY: Disegno note teoriche completato.");
    } catch (e) { console.error(">>> THEORY: Errore disegno:", e); const staffDiv = document.getElementById(theoryStaffOutputId); if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore disegno.</p>"; }
}

// --- Funzioni Esportate per l'uso in main.js ---

// Crea la UI per questa sezione (chiamata da main.js)
export function setupTheoryUI(containerElementOrId) {
    console.log(">>> THEORY: setupTheoryUI (Note) chiamato.");
    const container = (typeof containerElementOrId === 'string')
        ? document.getElementById(containerElementOrId)
        : containerElementOrId;
    if (!container) { console.error(`>>> THEORY: Contenitore UI non trovato!`); return; }

    // Crea il div contenitore della sezione Note
    const theorySectionDiv = document.createElement('div');
    theorySectionDiv.id = 'theory-container'; // ID usato nel CSS

    // Struttura HTML interna
    theorySectionDiv.innerHTML = `
        <h2>Note Musicali: Prima Ottava</h2>
        <p>Clicca sui pulsanti o suona le note sulla tastiera MIDI per vederle evidenziate sul pentagramma.</p>
        <div id="${theoryStaffOutputId}"></div>
        <div id="${theoryFeedbackId}"></div>
        <div id="${theoryInputButtonsId}"></div>
    `;

    // Aggiunta Pulsante Link Capitolo 1
    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '25px';
    linkContainer.style.textAlign = 'center';
    const linkButton = document.createElement('a');
    linkButton.href = "https://www.pianohitech.com/capitoli-1-cildren"; // <-- LINK AGGIORNATO QUI
    linkButton.target = "_blank";
    linkButton.classList.add('external-link-button');
    linkButton.textContent = 'Teoria Capitolo 1';
    linkContainer.appendChild(linkButton);
    theorySectionDiv.appendChild(linkContainer);
    console.log(">>> THEORY: Pulsante link 'Capitolo 1' aggiunto con nuovo URL.");

    // Aggiunge l'intera sezione al container fornito da main.js
    container.appendChild(theorySectionDiv);
    console.log(">>> THEORY: Struttura UI sezione note creata e aggiunta.");

    // Prepara e disegna le note iniziali
    prepareNotesForDisplay();
    displayTheoryNotes();
}

// Processa l'input (da pulsante o MIDI) per evidenziare la nota
export function processTheoryInput(vexFlowNote) {
    console.log(`>>> THEORY: processTheoryInput chiamato con input: ${vexFlowNote}`);
    if (highlightTimeoutId) { clearTimeout(highlightTimeoutId); highlightTimeoutId = null; } // Cancella timeout precedente

    let noteFound = false;
    // Aggiorna stato per highlight
    currentTheoryNotes = currentTheoryNotes.map(note => {
        if (note.keys.includes(vexFlowNote)) {
            noteFound = true;
            console.log(`>>> THEORY: Trovata e marcata per evidenziazione: ${vexFlowNote}.`);
            return { ...note, status: 'highlight' }; // Imposta highlight
        } else {
            return { ...note, status: 'default' }; // Resetta le altre
        }
    });

    console.log(">>> THEORY: currentTheoryNotes aggiornato per highlight:", currentTheoryNotes);

    // Ridisegna solo se la nota è stata trovata e lo stato è cambiato
    if (noteFound) {
        console.log(">>> THEORY: Chiamando displayTheoryNotes (highlight).");
        displayTheoryNotes(); // Ridisegna con highlight

        // Imposta timeout per rimuovere highlight
        highlightTimeoutId = setTimeout(() => {
            console.log(">>> THEORY: Timeout scaduto. Rimuovendo evidenziazione.");
            currentTheoryNotes = currentTheoryNotes.map(note => ({ ...note, status: 'default' })); // Resetta stato
            console.log(">>> THEORY: currentTheoryNotes resettato a default:", currentTheoryNotes);
            displayTheoryNotes(); // Ridisegna senza highlight
            highlightTimeoutId = null;
        }, 800); // Durata evidenziazione

    } else {
        console.warn(`>>> THEORY: Nota inserita "${vexFlowNote}" non trovata.`);
        // Assicura che tutto sia default se la nota non è valida
        currentTheoryNotes = currentTheoryNotes.map(note => ({ ...note, status: 'default' }));
        displayTheoryNotes(); // Ridisegna senza highlights
    }
}

// Restituisce i nomi per i pulsanti
export function getTheoryNoteNamesHTML() {
    return THEORY_NOTES_DATA.map(note => note.name);
}

// Restituisce l'ID del contenitore pulsanti
export function getTheoryInputButtonsId() {
    return theoryInputButtonsId;
}
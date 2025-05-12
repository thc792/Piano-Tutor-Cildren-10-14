/**
 * js/theory_notes_display.js
 * Modulo per visualizzare un set fisso di note e gestirne l'evidenziazione.
 *
 * Piano App per Bambini
 *
 * Mantenuta: Visualizzazione note fisse con nomi e evidenziazione colore.
 * Aggiunti: Log per debugging dell'evidenziazione.
 */

// Importa le funzioni necessarie dal tuo file vexflow_renderer.js
import { renderExercise } from './vexflow_renderer.js';

// --- Dati e Variabili del Modulo ---
const THEORY_NOTES_DATA = [ // Note da visualizzare (es. C4-C5 diatoniche)
    { key: 'c/4', name: 'Do4' },
    { key: 'd/4', name: 'Re4' },
    { key: 'e/4', name: 'Mi4' },
    { key: 'f/4', name: 'Fa4' },
    { key: 'g/4', name: 'Sol4' },
    { key: 'a/4', name: 'La4' },
    { key: 'b/4', name: 'Si4' },
    { key: 'c/5', name: 'Do5' }
    // Puoi aggiungere altre note qui se necessario
];

// Array che conterrà gli oggetti nota in formato VexFlow con stato (per l'evidenziazione)
let currentTheoryNotes = [];

// Riferimenti agli elementi UI gestiti da questo modulo
let theoryStaffOutputId = null;
let theoryFeedbackId = null; // Potrebbe non servire per ora, ma teniamolo
let theoryInputButtonsId = null;


// --- Funzioni Interne del Modulo ---

// Prepara i dati delle note per VexFlow, aggiungendo uno stato iniziale (es. 'default')
function prepareNotesForDisplay() {
    console.log(">>> THEORY: prepareNotesForDisplay chiamato."); // LOG
    currentTheoryNotes = THEORY_NOTES_DATA.map(note => ({
        keys: [note.key],
        duration: 'q', // Durata fissa per la visualizzazione
        status: 'default' // Stato iniziale
    }));
    console.log(">>> THEORY: Note preparate per la visualizzazione:", currentTheoryNotes); // LOG
}

// Disegna le note correnti sul pentagramma della sezione teoria
function displayTheoryNotes() {
    console.log(">>> THEORY: displayTheoryNotes chiamato."); // LOG
    if (!theoryStaffOutputId) {
        console.error(">>> THEORY: theoryStaffOutputId non impostato!");
        return;
    }

    console.log(">>> THEORY: Disegnando note teoriche sul pentagramma con dati:", currentTheoryNotes); // LOG

    const exerciseDataForVexFlow = {
        clef: 'treble', // Chiave fissa
        timeSignature: '4/4', // Tempo fisso
        keySignature: 'C', // Armatura fissa
        notes: currentTheoryNotes // Usa l'array di note con stati
    };

    const vexflowDrawingOptions = {
        showTextAnnotations: true // Mostra sempre i nomi delle note in questa sezione
    };

    try {
        // Chiama renderExercise
        renderExercise(theoryStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions);

        console.log(">>> THEORY: Disegno note teoriche completato."); // LOG
    } catch (e) {
        console.error(">>> THEORY: Errore nel disegnare le note teoriche:", e); // LOG
        const staffDiv = document.getElementById(theoryStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare le note teoriche.</p>";
    }
}


// --- Funzioni Esportate per l'uso in main.js ---

// Prepara la struttura HTML generale per l'ambiente teoria nell'area principale
export function setupTheoryUI(containerId) {
    console.log(">>> THEORY: setupTheoryUI chiamato."); // LOG
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`>>> THEORY: Contenitore UI "${containerId}" non trovato!`); // LOG
        return;
    }

    // Imposta i riferimenti agli elementi UI
    theoryStaffOutputId = 'theory-staff-output'; // ID del div per il pentagramma
    theoryFeedbackId = 'theory-feedback'; // ID del div per il feedback (se usato)
    theoryInputButtonsId = 'theory-input-buttons'; // ID del div per i pulsanti

    // Crea la struttura HTML per l'ambiente teoria (struttura semplice)
    container.innerHTML = `
        <div id="theory-container">
            <h2>Note Musicali: Prima Ottava</h2>
            <p>Clicca sui pulsanti o suona le note sulla tastiera MIDI per vederle evidenziate sul pentagramma.</p>

            <div id="${theoryStaffOutputId}">
                <!-- VexFlow disegnerà le note qui -->
            </div>

            <div id="${theoryFeedbackId}">
                <!-- Area feedback (opzionale) -->
            </div>
            <div id="${theoryInputButtonsId}">
                <!-- I pulsanti per l'input delle note verranno aggiunti qui da main.js -->
            </div>
        </div>
    `;
    console.log(">>> THEORY: Struttura UI della sezione teoria creata."); // LOG

    // Prepara i dati delle note e disegnale inizialmente
    prepareNotesForDisplay();
    displayTheoryNotes(); // Questo disegna le note con stato 'default'
}

// Processa l'input dell'utente (chiamato da main.js)
// Questo gestisce SOLO l'evidenziazione del colore della nota
export function processTheoryInput(vexFlowNote) {
    console.log(`>>> THEORY: processTheoryInput chiamato con input: ${vexFlowNote}`); // LOG

    let noteFound = false;

    // Aggiorna lo stato delle note per l'evidenziazione della nota stessa
    const updatedNotes = currentTheoryNotes.map(note => {
        // Rimuovi l'evidenziazione da tutte le note
        const newNote = { ...note, status: 'default' };

        // Se questa nota corrisponde all'input, impostane lo stato su 'highlight'
        if (note.keys.includes(vexFlowNote)) {
            newNote.status = 'highlight'; // Useremo questo stato per il stile CSS (colore)
            noteFound = true;
            console.log(`>>> THEORY: Trovata e marcata per evidenziazione la nota: ${vexFlowNote}. Nuovo stato: ${newNote.status}`); // LOG
        } else {
             console.log(`>>> THEORY: Nota ${note.keys[0]} non corrisponde all'input ${vexFlowNote}. Stato: ${newNote.status}`); // LOG
        }
        return newNote;
    });

    // Aggiorna l'array delle note correnti
    currentTheoryNotes = updatedNotes;
    console.log(">>> THEORY: currentTheoryNotes aggiornato:", currentTheoryNotes); // LOG

    // Ridisegna il pentagramma con la nota evidenziata (cambio colore)
    console.log(">>> THEORY: Chiamando displayTheoryNotes per ridisegnare con evidenziazione."); // LOG
    displayTheoryNotes(); // Questo ridisegna tutto, inclusa la nota con il nuovo colore

    if (!noteFound) {
        console.warn(`>>> THEORY: Nota inserita "${vexFlowNote}" non trovata tra le note visualizzate.`); // LOG
        // Potresti voler dare un feedback all'utente qui
        // updateFeedback(`Nota "${vexFlowNote}" non visualizzata.`, 'orange');
    } else {
         // Pulisci feedback se c'era un messaggio di nota non trovata
         // updateFeedback('');
    }

    // Dopo un breve ritardo, rimuovi l'evidenziazione (solo del colore della nota)
    setTimeout(() => {
        console.log(">>> THEORY: Timeout scaduto. Rimuovendo evidenziazione."); // LOG
        // Riporta lo stato delle note a 'default' e ridisegna (rimuove l'evidenziazione del colore della nota)
        currentTheoryNotes = currentTheoryNotes.map(note => ({ ...note, status: 'default' }));
        console.log(">>> THEORY: currentTheoryNotes resettato a default:", currentTheoryNotes); // LOG
        displayTheoryNotes();
        console.log(">>> THEORY: Ridisegno completato dopo timeout."); // LOG

        // Pulisci feedback se c'era un messaggio di nota non trovata
        // updateFeedback('');

    }, 800); // Durata dell'evidenziazione
}

// Restituisce l'elenco dei nomi delle note in formato HTML per i pulsanti
export function getTheoryNoteNamesHTML() {
    // Restituisce i nomi italiani per i pulsanti basati sui dati visualizzati
    return THEORY_NOTES_DATA.map(note => note.name);
}

// Restituisce l'ID del contenitore dei pulsanti (utile per main.js)
export function getTheoryInputButtonsId() {
    return theoryInputButtonsId;
}
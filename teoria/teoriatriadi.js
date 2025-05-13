/**
 * js/teoria/teoriatriadi.js
 * Modulo per la teoria delle triadi (Accordi di Tre Suoni) Maggiori e minori.
 */

import { renderExercise, renderEmptyStaff } from '../vexflow_renderer.js'; // Assicurati percorso corretto

// --- Dati e Variabili del Modulo ---
const TRIAD_DATA = [
    // Triadi diatoniche della scala di Do Maggiore (C4 come tonica o nota più bassa)
    { name: "Do Maggiore (Do-Mi-Sol)", nameShort: "Do M", type: "Maggiore", notes: ['c/4', 'e/4', 'g/4'] },
    { name: "Re minore (Re-Fa-La)", nameShort: "Re m", type: "minore", notes: ['d/4', 'f/4', 'a/4'] },
    { name: "Mi minore (Mi-Sol-Si)", nameShort: "Mi m", type: "minore", notes: ['e/4', 'g/4', 'b/4'] },
    { name: "Fa Maggiore (Fa-La-Do)", nameShort: "Fa M", type: "Maggiore", notes: ['f/4', 'a/4', 'c/5'] },
    { name: "Sol Maggiore (Sol-Si-Re)", nameShort: "Sol M", type: "Maggiore", notes: ['g/4', 'b/4', 'd/5'] },
    { name: "La minore (La-Do-Mi)", nameShort: "La m", type: "minore", notes: ['a/4', 'c/5', 'e/5'] },
    { name: "Si diminuito (Si-Re-Fa)", nameShort: "Si dim", type: "Diminuito", notes: ['b/4', 'd/5', 'f/5'] }
];

let currentTriadNotesVex = []; // Note VexFlow dell'accordo attualmente mostrato
let highlightTimeoutId = null;

// Riferimenti UI
let triadTheoryStaffId = 'triad-theory-staff';
let triadTheoryButtonsId = 'triad-theory-buttons';
let triadTypeDisplayId = 'triad-type-display'; // Per mostrare "Maggiore", "minore"

// --- Funzioni Interne ---

function displayTriad(triadNotes, triadType) {
    console.log(`>>> TRIADI TEORIA: displayTriad chiamato per tipo ${triadType}, note:`, triadNotes);
    if (!triadTheoryStaffId) { console.error("ID pentagramma teoria triadi non impostato!"); return; }

    currentTriadNotesVex = triadNotes.map(noteKey => ({
        keys: [noteKey],
        duration: 'h', // Semiminime per visualizzare l'accordo
        status: 'highlight' // Evidenzia tutte le note dell'accordo
    }));

    const exerciseData = {
        clef: 'treble', timeSignature: null, keySignature: 'C', notes: currentTriadNotesVex
    };
    const vexflowOptions = { showTextAnnotations: true }; // Mostra nomi note

    try {
        renderExercise(triadTheoryStaffId, exerciseData, vexflowOptions);
        console.log(">>> TRIADI TEORIA: Disegno triade completato.");
    } catch (e) {
        console.error(">>> TRIADI TEORIA: Errore disegno:", e);
        const staffDiv = document.getElementById(triadTheoryStaffId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore disegno triade.</p>";
    }

    // Mostra il tipo di triade
    const typeDisplay = document.getElementById(triadTypeDisplayId);
    if (typeDisplay) {
        typeDisplay.textContent = `Tipo: ${triadType}`;
    }
}

function clearStaffAndTypeDisplay() {
     console.log(">>> TRIADI TEORIA: clearStaffAndTypeDisplay chiamato.");
     if (!triadTheoryStaffId) return;
     renderEmptyStaff(triadTheoryStaffId, 'treble', null, 'C');
     const typeDisplay = document.getElementById(triadTypeDisplayId);
     if (typeDisplay) {
         typeDisplay.textContent = 'Tipo: --';
     }
}

// --- Funzioni Esportate ---

export function setupTriadTheoryUI(containerElementOrId) {
    console.log(">>> TRIADI TEORIA: setupTriadTheoryUI chiamato.");
    const container = (typeof containerElementOrId === 'string')
        ? document.getElementById(containerElementOrId)
        : containerElementOrId;
    if (!container) { console.error(`>>> TRIADI TEORIA: Contenitore UI non trovato!`); return; }

    const triadSectionDiv = document.createElement('div');
    triadSectionDiv.id = 'triad-theory-container';

    triadSectionDiv.innerHTML = `
        <h2>Gli Accordi: Le Triadi Maggiori e Minori</h2>
        <p>Un accordo è la combinazione di tre suoni suonati insieme. Clicca su un pulsante per vedere la triade corrispondente.</p>
        <div id="${triadTheoryStaffId}" style="height: 120px; margin-bottom: 10px;">
            <!-- VexFlow disegnerà la triade qui -->
        </div>
        <div id="${triadTypeDisplayId}" style="font-size: 1.2em; font-weight: bold; margin-bottom: 15px; min-height: 1.5em;">
            Tipo: --
        </div>
        <div id="${triadTheoryButtonsId}">
            <!-- Pulsanti verranno aggiunti da main.js -->
        </div>
    `;

    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '25px'; linkContainer.style.textAlign = 'center';
    const linkButton = document.createElement('a');
    linkButton.href = "#"; // <-- SOSTITUISCI CON URL REALE CAPITOLO 5
    linkButton.target = "_blank"; linkButton.classList.add('external-link-button');
    linkButton.textContent = 'Teoria Capitolo 5';
    linkContainer.appendChild(linkButton);
    triadSectionDiv.appendChild(linkContainer);

    container.appendChild(triadSectionDiv);
    console.log(">>> TRIADI TEORIA: Struttura UI creata.");

    clearStaffAndTypeDisplay(); // Mostra pentagramma vuoto all'inizio
}

export function processTriadTheoryInput(triadFullName) { // Es. "Do Maggiore (Do-Mi-Sol)"
    console.log(`>>> TRIADI TEORIA: processTriadTheoryInput chiamato con: ${triadFullName}`);
    if (highlightTimeoutId) { clearTimeout(highlightTimeoutId); highlightTimeoutId = null; }

    const selectedTriad = TRIAD_DATA.find(triad => triad.name === triadFullName);

    if (selectedTriad) {
        console.log(`>>> TRIADI TEORIA: Trovata triade: ${selectedTriad.nameShort}, Tipo: ${selectedTriad.type}`);
        displayTriad(selectedTriad.notes, selectedTriad.type);

        highlightTimeoutId = setTimeout(() => {
            console.log(">>> TRIADI TEORIA: Timeout scaduto, pulendo display.");
            clearStaffAndTypeDisplay();
            highlightTimeoutId = null;
        }, 3000); // Visualizza per 3 secondi
    } else {
        console.warn(`>>> TRIADI TEORIA: Nome triade "${triadFullName}" non trovato.`);
        clearStaffAndTypeDisplay();
    }
}

// Nomi completi per i pulsanti
export function getTriadTheoryButtonNames() {
    return TRIAD_DATA.map(data => data.name);
}

export function getTriadTheoryInputButtonsId() {
    return triadTheoryButtonsId;
}
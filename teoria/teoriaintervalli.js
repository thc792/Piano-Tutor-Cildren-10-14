/**
 * js/teoria/teoriaintervalli.js
 * Modulo per la teoria degli intervalli musicali semplici (partendo da Do4).
 */

// Importa le funzioni necessarie da vexflow_renderer.js
import { renderExercise, renderEmptyStaff } from '../vexflow_renderer.js'; // Assicurati percorso corretto

// --- Dati e Variabili del Modulo ---
const INTERVAL_DATA = [
    // Intervalli diatonici partendo da C4
    { name: "Unisono (Do-Do)", nameShort: "Unisono", note1: 'c/4', note2: 'c/4' }, // Aggiunto Unisono per completezza
    { name: "Seconda (Do-Re)", nameShort: "Seconda", note1: 'c/4', note2: 'd/4' },
    { name: "Terza (Do-Mi)", nameShort: "Terza", note1: 'c/4', note2: 'e/4' },
    { name: "Quarta (Do-Fa)", nameShort: "Quarta", note1: 'c/4', note2: 'f/4' },
    { name: "Quinta (Do-Sol)", nameShort: "Quinta", note1: 'c/4', note2: 'g/4' },
    { name: "Sesta (Do-La)", nameShort: "Sesta", note1: 'c/4', note2: 'a/4' },
    { name: "Settima (Do-Si)", nameShort: "Settima", note1: 'c/4', note2: 'b/4' },
    { name: "Ottava (Do-Do)", nameShort: "Ottava", note1: 'c/4', note2: 'c/5' },
];

// Stato: note correntemente visualizzate
let currentIntervalNotes = [];
let highlightTimeoutId = null;

// Riferimenti UI
let intervalTheoryStaffId = 'interval-theory-staff';
let intervalTheoryButtonsId = 'interval-theory-buttons';

// --- Funzioni Interne ---

// Disegna le note dell'intervallo selezionato
function displayInterval(note1Key, note2Key) {
    console.log(`>>> INTERVALLI TEORIA: displayInterval chiamato per ${note1Key} e ${note2Key}`);
    if (!intervalTheoryStaffId) { console.error("ID pentagramma teoria intervalli non impostato!"); return; }

    // Prepara le note per VexFlow, marcandole per l'highlight
    currentIntervalNotes = [
        { keys: [note1Key], duration: 'h', status: 'highlight' }, // Semiminime per vederle meglio
        { keys: [note2Key], duration: 'h', status: 'highlight' }
    ];
    // Ordina le note per VexFlow se necessario (anche se qui partiamo sempre da C4)
    // currentIntervalNotes.sort((a, b) => /* logica di ordinamento VexFlow key */);

    const exerciseData = {
        clef: 'treble',
        timeSignature: null, // Non mostriamo tempo
        keySignature: 'C', // Mostriamo Do Maggiore
        notes: currentIntervalNotes
    };
    const vexflowOptions = { showTextAnnotations: true }; // Mostra Do, Re, Mi...

    try {
        renderExercise(intervalTheoryStaffId, exerciseData, vexflowOptions);
        console.log(">>> INTERVALLI TEORIA: Disegno intervallo completato.");
    } catch (e) {
        console.error(">>> INTERVALLI TEORIA: Errore disegno:", e);
        const staffDiv = document.getElementById(intervalTheoryStaffId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore disegno intervallo.</p>";
    }
}

// Rimuove l'highlight e mostra un pentagramma vuoto o una nota base
function clearStaffHighlight() {
     console.log(">>> INTERVALLI TEORIA: clearStaffHighlight chiamato.");
     if (!intervalTheoryStaffId) return;
     // Mostra solo la chiave e l'armatura
     renderEmptyStaff(intervalTheoryStaffId, 'treble', null, 'C');
     // Oppure mostra solo la nota base C4
     // currentIntervalNotes = [{ keys: ['c/4'], duration: 'w', status: 'default' }];
     // const exerciseData = { clef: 'treble', timeSignature: null, keySignature: 'C', notes: currentIntervalNotes };
     // renderExercise(intervalTheoryStaffId, exerciseData, { showTextAnnotations: true });
}


// --- Funzioni Esportate ---

// Crea la UI per la sezione teoria intervalli
export function setupIntervalTheoryUI(containerElementOrId) {
    console.log(">>> INTERVALLI TEORIA: setupIntervalTheoryUI chiamato.");
    const container = (typeof containerElementOrId === 'string')
        ? document.getElementById(containerElementOrId)
        : containerElementOrId;
    if (!container) { console.error(`>>> INTERVALLI TEORIA: Contenitore UI non trovato!`); return; }

    // Crea il div contenitore della sezione
    const intervalSectionDiv = document.createElement('div');
    intervalSectionDiv.id = 'interval-theory-container'; // ID per CSS

    // Struttura HTML interna
    intervalSectionDiv.innerHTML = `
        <h2>Gli Intervalli (Distanze tra le Note)</h2>
        <p>Clicca su un pulsante per vedere l'intervallo corrispondente (la distanza tra Do e l'altra nota) sul pentagramma.</p>
        <div id="${intervalTheoryStaffId}" style="height: 120px;">
            <!-- VexFlow disegnerà l'intervallo qui -->
        </div>
        <div id="${intervalTheoryButtonsId}">
            <!-- Pulsanti verranno aggiunti da main.js -->
        </div>
    `;

    // Aggiunta Pulsante Link Capitolo 3
    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '25px';
    linkContainer.style.textAlign = 'center';
    const linkButton = document.createElement('a');
    linkButton.href = "https://www.pianohitech.com/capitoli-3-cildren"; // <-- SOSTITUISCI CON URL REALE CAPITOLO 3
    linkButton.target = "_blank";
    linkButton.classList.add('external-link-button');
    linkButton.textContent = 'Teoria Capitolo 3';
    linkContainer.appendChild(linkButton);
    intervalSectionDiv.appendChild(linkContainer);
    console.log(">>> INTERVALLI TEORIA: Pulsante link 'Capitolo 3' aggiunto.");

    // Aggiunge la sezione al container principale
    container.appendChild(intervalSectionDiv);
    console.log(">>> INTERVALLI TEORIA: Struttura UI creata e aggiunta.");

    // Disegna lo stato iniziale (pentagramma vuoto con chiave/armatura)
    clearStaffHighlight();
}

// Processa il click sui pulsanti della teoria degli intervalli
export function processIntervalTheoryInput(intervalName) {
    console.log(`>>> INTERVALLI TEORIA: processIntervalTheoryInput chiamato con: ${intervalName}`);
    if (highlightTimeoutId) { clearTimeout(highlightTimeoutId); highlightTimeoutId = null; }

    // Trova i dati dell'intervallo corrispondente al nome completo del pulsante
    const selectedIntervalData = INTERVAL_DATA.find(interval => interval.name === intervalName);

    if (selectedIntervalData) {
        console.log(`>>> INTERVALLI TEORIA: Trovato intervallo: ${selectedIntervalData.name}. Note: ${selectedIntervalData.note1}, ${selectedIntervalData.note2}`);
        // Mostra e evidenzia le note dell'intervallo
        displayInterval(selectedIntervalData.note1, selectedIntervalData.note2);

        // Imposta timeout per pulire l'highlight
        highlightTimeoutId = setTimeout(() => {
            console.log(">>> INTERVALLI TEORIA: Timeout scaduto, pulendo highlight.");
            clearStaffHighlight(); // Rimuove le note evidenziate
            highlightTimeoutId = null;
        }, 2000); // Durata visualizzazione intervallo (2 secondi)

    } else {
        console.warn(`>>> INTERVALLI TEORIA: Nome intervallo "${intervalName}" non trovato nei dati.`);
        clearStaffHighlight(); // Pulisci comunque se il nome non è valido
    }
}

// Restituisce i nomi completi per i pulsanti (es. "Terza (Do-Mi)")
export function getIntervalTheoryButtonNames() {
    return INTERVAL_DATA.map(data => data.name);
}

// Restituisce l'ID del contenitore pulsanti
export function getIntervalTheoryInputButtonsId() {
    return intervalTheoryButtonsId;
}
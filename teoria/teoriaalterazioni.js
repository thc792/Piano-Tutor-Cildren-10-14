/**
 * js/teoria/teoriaalterazioni.js
 * Modulo per la teoria delle alterazioni musicali (Diesis, Bemolle, Bequadro).
 */

import { renderExercise, renderEmptyStaff } from '../vexflow_renderer.js'; // Assicurati percorso corretto

// --- Dati e Variabili del Modulo ---
const NOTE_BASI_PER_ALTERAZIONI = [ // Note su cui sperimentare le alterazioni
    { name: "Do", baseKey: "c/4", vexName: "C" },
    { name: "Re", baseKey: "d/4", vexName: "D" },
    { name: "Mi", baseKey: "e/4", vexName: "E" },
    { name: "Fa", baseKey: "f/4", vexName: "F" },
    { name: "Sol", baseKey: "g/4", vexName: "G" },
    { name: "La", baseKey: "a/4", vexName: "A" },
    { name: "Si", baseKey: "b/4", vexName: "B" },
];

let currentBaseNoteIndex = 4; // Inizia con Sol (G)
let currentAlteration = null; // null, '#', 'b', 'n' (per bequadro)
let displayedVexNote = NOTE_BASI_PER_ALTERAZIONI[currentBaseNoteIndex].baseKey; // Nota VexFlow attualmente mostrata

// Riferimenti UI
let alterationTheoryStaffId = 'alteration-theory-staff';
let alterationTheoryNoteSelectorId = 'alteration-theory-note-selector'; // Per selezionare la nota base
let alterationTheoryButtonsId = 'alteration-theory-buttons'; // Per #, b, n

// --- Funzioni Interne ---

function getVexNoteWithAlteration(baseKey, alteration) {
    const parts = baseKey.split('/'); // es. "g/4" -> ["g", "4"]
    let noteName = parts[0];
    const octave = parts[1];

    // Rimuovi eventuali alterazioni precedenti dal nome base per riapplicare
    noteName = noteName.replace(/[#b]/g, '');

    switch (alteration) {
        case '#': return `${noteName}#/${octave}`;
        case 'b': return `${noteName}b/${octave}`;
        case 'n': // Bequadro riporta alla nota naturale
        default:  return `${noteName}/${octave}`; // Naturale o nessuna alterazione
    }
}

function displayAlteredNote() {
    console.log(`>>> ALTERAZIONI TEORIA: displayAlteredNote. Base: ${NOTE_BASI_PER_ALTERAZIONI[currentBaseNoteIndex].baseKey}, Alterazione: ${currentAlteration}`);
    if (!alterationTheoryStaffId) { console.error("ID pentagramma teoria alterazioni non impostato!"); return; }

    displayedVexNote = getVexNoteWithAlteration(NOTE_BASI_PER_ALTERAZIONI[currentBaseNoteIndex].baseKey, currentAlteration);
    console.log(`>>> ALTERAZIONI TEORIA: Nota VexFlow da disegnare: ${displayedVexNote}`);

    const notesToDraw = [{ keys: [displayedVexNote], duration: 'w', status: 'highlight' }]; // Nota intera evidenziata

    const exerciseData = {
        clef: 'treble', timeSignature: null, keySignature: 'C', notes: notesToDraw
    };
    const vexflowOptions = { showTextAnnotations: true }; // Mostra nome nota (Do#, Solb, ecc.)

    try {
        renderExercise(alterationTheoryStaffId, exerciseData, vexflowOptions);
        console.log(">>> ALTERAZIONI TEORIA: Disegno nota alterata completato.");
    } catch (e) {
        console.error(">>> ALTERAZIONI TEORIA: Errore disegno:", e);
        const staffDiv = document.getElementById(alterationTheoryStaffId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore disegno nota.</p>";
    }
}

function createNoteSelector() {
    const selectorContainer = document.getElementById(alterationTheoryNoteSelectorId);
    if (!selectorContainer) { console.error("Contenitore selettore note non trovato"); return; }
    selectorContainer.innerHTML = 'Nota Base: ';

    const select = document.createElement('select');
    NOTE_BASI_PER_ALTERAZIONI.forEach((note, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = note.name;
        if (index === currentBaseNoteIndex) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener('change', (event) => {
        currentBaseNoteIndex = parseInt(event.target.value);
        currentAlteration = null; // Resetta alterazione quando cambia la nota base
        displayAlteredNote();
    });
    selectorContainer.appendChild(select);
}

// --- Funzioni Esportate ---

export function setupAlterationTheoryUI(containerElementOrId) {
    console.log(">>> ALTERAZIONI TEORIA: setupAlterationTheoryUI chiamato.");
    const container = (typeof containerElementOrId === 'string')
        ? document.getElementById(containerElementOrId)
        : containerElementOrId;
    if (!container) { console.error(`>>> ALTERAZIONI TEORIA: Contenitore UI non trovato!`); return; }

    const alterationSectionDiv = document.createElement('div');
    alterationSectionDiv.id = 'alteration-theory-container';

    alterationSectionDiv.innerHTML = `
        <h2>Le Alterazioni: Diesis (#), Bemolle (b) e Bequadro (♮)</h2>
        <p>Le alterazioni cambiano l'altezza di una nota. Seleziona una nota base e applica un'alterazione per vedere l'effetto.</p>
        <div id="${alterationTheoryNoteSelectorId}" style="margin-bottom: 15px; font-size: 1.1em;">
            <!-- Selettore nota base verrà inserito qui -->
        </div>
        <div id="${alterationTheoryStaffId}" style="height: 120px; margin-bottom:15px;">
            <!-- VexFlow disegnerà la nota qui -->
        </div>
        <div id="${alterationTheoryButtonsId}">
            <!-- Pulsanti #, b, n verranno aggiunti da main.js -->
        </div>
    `;

    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '25px'; linkContainer.style.textAlign = 'center';
    const linkButton = document.createElement('a');
    linkButton.href = "https://www.pianohitech.com/capitoli-4-cildren"; // <-- SOSTITUISCI CON URL REALE CAPITOLO 4
    linkButton.target = "_blank"; linkButton.classList.add('external-link-button');
    linkButton.textContent = 'Teoria Capitolo 4';
    linkContainer.appendChild(linkButton);
    alterationSectionDiv.appendChild(linkContainer);

    container.appendChild(alterationSectionDiv);
    console.log(">>> ALTERAZIONI TEORIA: Struttura UI creata.");

    createNoteSelector(); // Crea il menu a tendina per selezionare la nota base
    displayAlteredNote(); // Mostra la nota iniziale (Sol naturale)
}

export function processAlterationTheoryInput(alterationSymbol) { // '#' 'b' 'n'
    console.log(`>>> ALTERAZIONI TEORIA: processAlterationTheoryInput chiamato con: ${alterationSymbol}`);
    currentAlteration = alterationSymbol;
    displayAlteredNote();
    // Non c'è timeout qui, l'utente cambia attivamente l'alterazione
}

// Nomi per i pulsanti di alterazione
export function getAlterationTheoryButtonNames() {
    return ["# (Diesis)", "b (Bemolle)", "♮ (Bequadro)"];
}

export function getAlterationTheoryInputButtonsId() {
    return alterationTheoryButtonsId;
}
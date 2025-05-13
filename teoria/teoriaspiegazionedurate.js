/**
 * js/teoria/teoriaspiegazionedurate.js
 * Modulo per visualizzare le durate musicali (note e pause) e gestirne l'evidenziazione.
 * Mostra tutte le durate all'inizio, poi solo la coppia selezionata con Y custom.
 */

import { renderExercise } from '../vexflow_renderer.js'; // Assicurati percorso corretto

const DURATION_DATA = [
    { name: 'Semibreve', durationNote: 'w', durationPause: 'wr', key: 'b/4' },
    { name: 'Minima', durationNote: 'h', durationPause: 'hr', key: 'b/4' },
    { name: 'Semiminima', durationNote: 'q', durationPause: 'qr', key: 'b/4' },
    { name: 'Croma', durationNote: '8', durationPause: '8r', key: 'b/4' },
    { name: 'Semicroma', durationNote: '16', durationPause: '16r', key: 'b/4' },
    { name: 'Biscroma', durationNote: '32', durationPause: '32r', key: 'b/4' },
];
let allDurationSymbolsForInitialDisplay = [];
let highlightTimeoutId = null;

let durationStaffOutputId = 'duration-staff-output'; // ID del div per il pentagramma
let durationFeedbackId = 'duration-feedback';
let durationInputButtonsId = 'duration-input-buttons'; // ID del div per i pulsanti

function prepareAllDurationsForInitialDisplay() {
    allDurationSymbolsForInitialDisplay = [];
    DURATION_DATA.forEach((data) => {
        allDurationSymbolsForInitialDisplay.push({ keys: [data.key], duration: data.durationNote, type: undefined, status: 'default', durationName: data.name });
        allDurationSymbolsForInitialDisplay.push({ keys: [data.key], duration: data.durationPause, type: 'r', status: 'default', durationName: data.name });
    });
}

function displaySymbolsOnStaff(symbolsToDisplay, isInitialDisplay = false) {
    if (!durationStaffOutputId) { console.error(">>> DURATE TEORIA: durationStaffOutputId non impostato!"); return; }
    console.log(">>> DURATE TEORIA: Disegnando simboli:", symbolsToDisplay);
    
    const exerciseData = { 
        clef: 'treble', 
        timeSignature: null, 
        keySignature: null, 
        notes: symbolsToDisplay 
    };

    const vexflowOptions = { 
        showTextAnnotations: false,
        // Non impostare useFullWidth: true qui, così usa la larghezza adattiva
    };

    // Applica customStartY solo se NON è la visualizzazione iniziale (con tutte le note)
    // o se vuoi un Y specifico anche per la visualizzazione iniziale.
    // Per ora, applichiamolo quando mostriamo la coppia selezionata per alzarla.
    if (!isInitialDisplay && symbolsToDisplay.length <= 2) { // Se stiamo mostrando una coppia selezionata
         vexflowOptions.customStartY = 5; // Valore Y per alzare il pentagramma quando mostra poche note
         console.log(">>> DURATE TEORIA: Applicando customStartY:", vexflowOptions.customStartY);
    } else {
        // Per la visualizzazione iniziale con molte note, potremmo volere il default Y (-10) o un altro valore.
        // Se non specifichiamo customStartY, userà STAVE_START_Y_SINGLE_DEFAULT da vexflow_renderer.js
        // vexflowOptions.customStartY = -5; // Esempio se volessi un Y diverso per la vista completa
        console.log(">>> DURATE TEORIA: Usando StartY di default per vista completa.");
    }


    try {
        renderExercise(durationStaffOutputId, exerciseData, vexflowOptions); 
        console.log(">>> DURATE TEORIA: Disegno simboli completato.");
    } catch (e) { 
        console.error(">>> DURATE TEORIA: Errore disegno:", e); 
        const staffDiv = document.getElementById(durationStaffOutputId); 
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore disegno.</p>"; 
    }
}

function updateDurationFeedback(message, color = '#333') {
    if (!durationFeedbackId) return;
    const feedbackDiv = document.getElementById(durationFeedbackId);
    if (feedbackDiv) { feedbackDiv.textContent = message; feedbackDiv.style.color = color; }
}

export function setupDurationTheoryUI(containerElementOrId) {
    console.log(">>> DURATE TEORIA: setupDurationTheoryUI chiamato.");
    const container = (typeof containerElementOrId === 'string')
        ? document.getElementById(containerElementOrId)
        : containerElementOrId;
    if (!container) { console.error(`>>> DURATE TEORIA: Contenitore UI non trovato!`); return; }

    const durationSectionDiv = document.createElement('div');
    durationSectionDiv.id = 'duration-theory-container';
    durationSectionDiv.innerHTML = `
        <h2>Figure Musicali (Durate)</h2>
        <p>Clicca sui pulsanti per vedere la figura musicale (nota e pausa corrispondente) evidenziata sul pentagramma.</p>
        <div id="${durationStaffOutputId}" style="height: 100px;"></div>
        <div id="${durationFeedbackId}"></div>
        <div id="${durationInputButtonsId}"></div>
    `;
    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '25px';
    linkContainer.style.textAlign = 'center';
    const linkButton = document.createElement('a');
    linkButton.href = "https://www.google.com"; 
    linkButton.target = "_blank";
    linkButton.classList.add('external-link-button');
    linkButton.textContent = 'Teoria Capitolo 2';
    linkContainer.appendChild(linkButton);
    durationSectionDiv.appendChild(linkContainer);
    container.appendChild(durationSectionDiv);

    prepareAllDurationsForInitialDisplay();
    displaySymbolsOnStaff(allDurationSymbolsForInitialDisplay, true); // true indica che è la visualizzazione iniziale
}

export function processDurationInput(durationName) { // Questo è l'activeInputHandler per questa sezione
    console.log(`>>> DURATE TEORIA: processDurationInput chiamato con input: ${durationName}`);
    if (highlightTimeoutId) { clearTimeout(highlightTimeoutId); highlightTimeoutId = null; }

    const selectedData = DURATION_DATA.find(data => data.name === durationName);
    if (!selectedData) {
        console.warn(`>>> DURATE TEORIA: Durata "${durationName}" non trovata.`);
        updateDurationFeedback('');
        displaySymbolsOnStaff(allDurationSymbolsForInitialDisplay, true); 
        return;
    }

    const symbolsToShow = [
        { keys: [selectedData.key], duration: selectedData.durationNote, type: undefined, status: 'highlight', durationName: selectedData.name },
        { keys: [selectedData.key], duration: selectedData.durationPause, type: 'r', status: 'highlight', durationName: selectedData.name }
    ];

    console.log(`>>> DURATE TEORIA: Simboli per "${durationName}" preparati per display singolo.`);
    updateDurationFeedback(`Figura selezionata: ${durationName}`, 'blue');
    displaySymbolsOnStaff(symbolsToShow, false); // false indica che non è la visualizzazione iniziale

    highlightTimeoutId = setTimeout(() => {
        console.log(">>> DURATE TEORIA: Timeout scaduto. Tornando a visualizzazione completa.");
        displaySymbolsOnStaff(allDurationSymbolsForInitialDisplay, true); 
        updateDurationFeedback('');
        highlightTimeoutId = null;
    }, 2500); 
}

export function getDurationNamesHTML() {
    return DURATION_DATA.map(data => data.name);
}

export function getDurationInputButtonsId() {
    return durationInputButtonsId;
}
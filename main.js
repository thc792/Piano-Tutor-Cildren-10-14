/**
 * js/main.js
 * Logica principale dell'applicazione Piano App per Bambini.
 *
 * Modificato: Aggiunto data attribute ai pulsanti per la colorazione.
 */

// Importa le funzioni necessarie dal tuo file vexflow_renderer.js
import { renderExercise, renderEmptyStaff } from './vexflow_renderer.js';

// Importa la funzione per inizializzare la gestione del MIDI
import { initializeMIDI } from './midi_handler.js';

// Importa le funzioni specifiche per il quiz
import {
    setupQuizUI,
    startQuiz,
    processQuizInput,
    getDiatonicC4C5NoteNamesHTML,
    getExerciseInputButtonsId
} from './quiz_exercise.js';

// Importa le funzioni specifiche per la sezione teoria
import {
    setupTheoryUI,
    processTheoryInput,
    getTheoryNoteNamesHTML,
    getTheoryInputButtonsId
} from './theory_notes_display.js';


// --- Variabili Globali e Riferimenti agli elementi HTML ---
const pianoKeysContainer = document.getElementById('piano-keys');
const allPianoKeys = document.querySelectorAll('#piano-keys .key');
const toggleKeyboardNoteNamesBtn = document.getElementById('toggle-keyboard-note-names-btn');
const toggleStaffNoteNamesBtn = document.getElementById('toggle-staff-note-names-btn');
const btnClearStaff = document.getElementById('btnClearStaff'); // Il pulsante "Pulisci Pentagramma"
const vexflowStaffOutputId = 'vexflow-staff-output'; // L'ID della "scatola" dove VexFlow disegnerà il pentagramma (nel footer)
const midiStatusIndicator = document.getElementById('midi-status-indicator');

// Riferimenti ai pulsanti di navigazione principali
const btnTeoriaMusicale = document.getElementById('btn-teoria-musicale');
const btnEserciziTeorici = document.getElementById('btn-esercizi-teorici'); // Riferimento al pulsante Esercizi

// Riferimento all'area del contenuto principale e ai "TV screens" originali
const contentArea = document.getElementById('content-area');
const mainTvScreensContainer = document.getElementById('main-tv-screens-container');

// Riferimento al footer
const pianoSectionFooter = document.getElementById('piano-section-footer');


// Variabili per tenere lo stato della nostra applicazione
let userEnteredNotes = []; // Qui salviamo le note che l'utente "scrive" cliccando (per il pentagramma libero)
let currentClef = 'treble'; // La chiave musicale che stiamo usando (all'inizio violino)
let currentTimeSignature = '4/4'; // Il tempo musicale (all'inizio 4/4)
let currentKeySignature = 'C'; // L'armatura di chiave (all'inizio Do maggiore)
let areKeyboardNoteNamesVisible = true; // Per ricordare se i nomi sui tasti sono visibili
let areStaffNoteNamesVisible = false;  // Per ricordare se i nomi Do,Re,Mi sul pentagramma sono visibili
let isMidiReady = false; // Variabile per sapere se un dispositivo MIDI è connesso e pronto

// Variabile per tenere traccia della sezione corrente visualizzata
let currentSection = 'home'; // 'home', 'teoria', 'esercizi'

// Variabile per tenere un riferimento al gestore input dell'esercizio/sezione attivo
let activeInputHandler = null;


// --- Funzione Principale di Avvio ---
function initializeApp() {
    console.log(">>> MAIN initializeApp: Piano App per Bambini: Inizializzazione in corso...");

    // 1. Disegna il pentagramma libero all'inizio (sarà vuoto)
    renderUserNotesOnStaff();

    // 2. Collega le azioni ai tasti della pianola virtuale
    setupVirtualKeyboardListeners();

    // 3. Collega le azioni ai pulsanti di controllo e navigazione
    setupControlButtons();
    setupNavigationButtons();

    // 4. Inizializza la gestione del MIDI
    initializeMIDI(handleMIDINoteOn, updateMIDIStatusUI);

    // Mostra la sezione iniziale (la "home" con i TV screens)
    showSection('home');

    console.log(">>> MAIN initializeApp: Inizializzazione completata.");
}

// --- Funzioni per Preparare le Cose ---

// Questa funzione si occupa di chiamare VexFlow per disegnare il pentagramma LIBERO
// con le note che sono nella nostra lista 'userEnteredNotes'.
function renderUserNotesOnStaff() {
    console.log(`>>> MAIN renderUserNotesOnStaff chiamato. Numero note utente (libero): ${userEnteredNotes.length}. Disegno su: #${vexflowStaffOutputId}`);

    const exerciseDataForVexFlow = {
        clef: currentClef,
        timeSignature: currentTimeSignature,
        keySignature: currentKeySignature,
        notes: [...userEnteredNotes], // Usa la lista delle note libere
    };

    const vexflowDrawingOptions = {
        showTextAnnotations: areStaffNoteNamesVisible
    };

    try {
        console.log(">>> MAIN renderUserNotesOnStaff: Chiamando renderExercise con dati:", exerciseDataForVexFlow, "e opzioni:", vexflowDrawingOptions);
        renderExercise(vexflowStaffOutputId, exerciseDataForVexFlow, vexflowDrawingOptions);
        console.log(">>> MAIN renderUserNotesOnStaff: Chiamata a renderExercise completata.");
    } catch (e) {
        console.error(">>> MAIN renderUserNotesOnStaff: Errore VexFlow mentre disegnavo il pentagramma libero:", e);
        const staffDiv = document.getElementById(vexflowStaffOutputId);
        if (staffDiv) staffDiv.innerHTML = "<p style='color:red;'>Errore nel disegnare le note sul pentagramma libero.</p>";
    }
}

// Questa funzione trova tutti i tasti della pianola virtuale e li prepara
// ad ascoltare quando vengono cliccati con il mouse.
function setupVirtualKeyboardListeners() {
    console.log(">>> MAIN setupVirtualKeyboardListeners chiamato.");
    allPianoKeys.forEach(keyElement => {
        // Quando un tasto virtuale viene premuto, chiama il gestore di input centrale
        keyElement.addEventListener('mousedown', () => {
            const noteDaHTML = keyElement.dataset.note; // Es: "C4", "F#3"
            const midiNumero = keyElement.dataset.midi; // Otteniamo il numero MIDI
            let vexFlowKey = noteDaHTML;
             if (noteDaHTML && !noteDaHTML.includes('/') && noteDaHTML.length >= 2) {
                 const notePart = noteDaHTML.slice(0, -1).toLowerCase();
                 const octavePart = noteDaHTML.slice(-1);
                 vexFlowKey = `${notePart}/${octavePart}`;
             } else if (noteDaHTML && noteDaHTML.includes('/')) {
                 const parts = noteDaHTML.split('/');
                 if (parts.length === 2) {
                     vexFlowKey = `${parts[0].toLowerCase()}/${parts[1]}`;
                 } else {
                     console.warn(`>>> MAIN setupVirtualKeyboardListeners: Formato data-note inatteso "${noteDaHTML}". Uso come è.`);
                     vexFlowKey = noteDaHTML;
                 }
             } else {
                  console.warn(`>>> MAIN setupVirtualKeyboardListeners: Formato data-note non valido o vuoto "${noteDaHTML}". Ignorato.`);
                  return;
             }

            console.log(`>>> MAIN setupVirtualKeyboardListeners: Tasto virtuale premuto: ${noteDaHTML}. Nota VexFlow: ${vexFlowKey}. MIDI: ${midiNumero}`);

            // Chiama il gestore di input centrale
            handleNoteInput(vexFlowKey, parseInt(midiNumero), 100); // Velocity fissa per tastiera virtuale

            // Facciamo illuminare brevemente il tasto virtuale
            keyElement.classList.add('playing');
            setTimeout(() => {
                keyElement.classList.remove('playing');
            }, 200);
        });
        // TODO: Aggiungere listener per 'mouseup' se necessario
    });
    console.log(`>>> MAIN setupVirtualKeyboardListeners: Listener collegati a ${allPianoKeys.length} tasti della pianola.`);
}


// Questa funzione trova tutti i pulsanti di controllo (non navigazione) e li prepara
// ad ascoltare quando vengono cliccati.
function setupControlButtons() {
    console.log(">>> MAIN setupControlButtons chiamato.");
    if (toggleKeyboardNoteNamesBtn) {
        toggleKeyboardNoteNamesBtn.addEventListener('click', toggleKeyboardNoteNames);
    } else {
        console.warn(">>> MAIN setupControlButtons: Pulsante 'toggle-keyboard-note-names-btn' non trovato nell'HTML.");
    }

    if (toggleStaffNoteNamesBtn) {
        toggleStaffNoteNamesBtn.addEventListener('click', toggleStaffNoteNames);
    } else {
        console.warn(">>> MAIN setupControlButtons: Pulsante 'toggle-staff-note-names-btn' non trovato nell'HTML.");
    }

    if (btnClearStaff) {
        btnClearStaff.addEventListener('click', clearStaff);
    } else {
        console.warn(">>> MAIN setupControlButtons: Pulsante 'btnClearStaff' (Pulisci Pentagramma) non trovato nell'HTML.");
    }

    // TODO: Collegare i pulsanti Play/Pausa/Stop
}

// Funzione per collegare i listener ai pulsanti di navigazione principali
function setupNavigationButtons() {
    console.log(">>> MAIN setupNavigationButtons chiamato.");
    if (btnTeoriaMusicale) {
        btnTeoriaMusicale.addEventListener('click', () => showSection('teoria'));
    } else {
        console.warn(">>> MAIN setupNavigationButtons: Pulsante 'btn-teoria-musicale' non trovato.");
    }

    if (btnEserciziTeorici) {
        btnEserciziTeorici.addEventListener('click', () => showSection('esercizi'));
        console.log(">>> MAIN setupNavigationButtons: Listener collegato a 'btn-esercizi-teorici'.");
    } else {
        console.warn(">>> MAIN setupNavigationButtons: Pulsante 'btn-esercizi-teorici' non trovato.");
    }
}


// --- Gestori di Input Centralizzati ---

// Gestore centrale per l'input di note (da tastiera virtuale, MIDI o dai nuovi pulsanti)
function handleNoteInput(vexFlowNote, midiNumber, velocity) {
    console.log(`>>> MAIN handleNoteInput chiamato. Nota VexFlow: ${vexFlowNote}, MIDI: ${midiNumber}, Velocità: ${velocity}`);

    if (activeInputHandler) { // Usa il gestore input attivo se presente
        console.log(">>> MAIN handleNoteInput: Reindirizzando input al gestore attivo.");
        activeInputHandler(vexFlowNote); // Passa solo la nota VexFlow al gestore specifico
    } else {
        // Altrimenti, aggiungi la nota al pentagramma libero nel footer
        console.log(">>> MAIN handleNoteInput: Aggiungendo nota al pentagramma libero.");
        userEnteredNotes.push({
            keys: [vexFlowNote],
            duration: 'q', // Durata fissa per ora
            // midiValue: midiNumber, // Puoi aggiungere il numero MIDI qui se utile
        });
        renderUserNotesOnStaff(); // Ridisegna il pentagramma libero
    }

    // TODO: Riprodurre il suono della nota (usando Web Audio API)
    // playNoteSound(midiNumber, velocity);
}


// Cosa succede quando un messaggio MIDI "Note On" arriva dalla tastiera fisica
function handleMIDINoteOn(noteNameMIDI, midiNoteNumber, velocity) {
    console.log(`>>> MAIN handleMIDINoteOn (Physical MIDI) chiamato. Nota: ${noteNameMIDI}, MIDI: ${midiNoteNumber}, Velocità: ${velocity}`);

    // Troviamo il tasto virtuale corrispondente al numero MIDI ricevuto per l'illuminazione
    const keyElement = document.querySelector(`.key[data-midi="${midiNoteNumber}"]`);
    if (keyElement) {
         keyElement.classList.add('playing');
         // Rimuovi la classe 'playing' dopo un breve ritardo
         setTimeout(() => {
             keyElement.classList.remove('playing');
         }, 200); // Durata dell'illuminazione
    } else {
        console.warn(`>>> MAIN handleMIDINoteOn: Nessun tasto virtuale trovato per numero MIDI ${midiNoteNumber} per l'illuminazione.`);
    }

    // Chiama il gestore di input centrale con la nota MIDI
    handleNoteInput(noteNameMIDI, midiNoteNumber, velocity); // noteNameMIDI dovrebbe essere già in formato vexflow es. c/4

    // TODO: Tracciare l'evento MIDI con il logger
    // Logger.logEvent('midi_input', { note: noteNameMIDI, midi: midiNoteNumber, velocity: velocity });
}


// Cosa succede quando lo stato della connessione MIDI cambia
function updateMIDIStatusUI(message, isConnected) {
    console.log(`>>> MAIN updateMIDIStatusUI chiamato. Messaggio: "${message}", Connesso: ${isConnected}`);
    if (midiStatusIndicator) {
        midiStatusIndicator.textContent = `MIDI: ${message}`;
        isMidiReady = isConnected;

        midiStatusIndicator.classList.remove('connected', 'error');
        if (isConnected) {
            midiStatusIndicator.classList.add('connected');
        } else if (message.toLowerCase().includes('errore') || message.toLowerCase().includes('nessun dispositivo')) {
            midiStatusIndicator.classList.add('error');
        }
    }
}


function toggleKeyboardNoteNames() {
     console.log(">>> MAIN toggleKeyboardNoteNames chiamato.");
    areKeyboardNoteNamesVisible = !areKeyboardNoteNamesVisible;

    if (pianoKeysContainer) {
        pianoKeysContainer.classList.toggle('hide-all-note-names', !areKeyboardNoteNamesVisible);
        pianoKeysContainer.classList.toggle('show-all-note-names', areKeyboardNoteNamesVisible);
        toggleKeyboardNoteNamesBtn.textContent = areKeyboardNoteNamesVisible ? "Nomi Note (Tastiera) ON" : "Nomi Note (Tastiera) OFF";
    }
}

function toggleStaffNoteNames() {
    console.log(">>> MAIN toggleStaffNoteNames chiamato.");
    areStaffNoteNamesVisible = !areStaffNoteNamesVisible;
    console.log(`>>> MAIN toggleStaffNoteNames: Visualizzazione nomi note testuali sul pentagramma libero: ${areStaffNoteNamesVisible ? 'ATTIVA' : 'DISATTIVA'}`);

    renderUserNotesOnStaff(); // Ridisegna il pentagramma libero con/senza annotazioni

    toggleStaffNoteNamesBtn.textContent = areStaffNoteNamesVisible ? "Note Scritte (Pentagramma) ON" : "Note Scritte (Pentagramma) OFF";
}

function clearStaff() {
    console.log(">>> MAIN clearStaff chiamato.");
    userEnteredNotes = [];
    renderUserNotesOnStaff(); // Ridisegna il pentagramma libero vuoto
    console.log(">>> MAIN clearStaff: Lista delle note utente (libero) svuotata. Pentagramma libero pulito.");
}


// --- Gestione delle Sezioni ---

// Funzione per mostrare una specifica sezione dell'applicazione
function showSection(sectionName) {
    console.log(`>>> MAIN showSection chiamato: ${sectionName}`);

    // Aggiorna lo stato della sezione corrente
    currentSection = sectionName;
    activeInputHandler = null; // Resetta il gestore input attivo quando si cambia sezione

    // Rimuovi la classe 'active' da tutti i pulsanti di navigazione
    document.querySelectorAll('#top-navigation .nav-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Pulisce l'area del contenuto principale
    contentArea.innerHTML = '';

    // Gestisce la visibilità del footer
    if (pianoSectionFooter) {
        if (sectionName === 'esercizi' || sectionName === 'teoria') { // Nascondi footer anche per teoria
            pianoSectionFooter.style.display = 'none';
            console.log(">>> MAIN showSection: Footer nascosto.");
        } else {
            pianoSectionFooter.style.display = 'flex';
            console.log(">>> MAIN showSection: Footer mostrato.");
            // Assicurati che il pentagramma libero sia disegnato quando il footer è visibile
            renderUserNotesOnStaff();
        }
    }


    // Mostra il contenuto della sezione richiesta
    switch (sectionName) {
        case 'home':
            console.log(">>> MAIN showSection: Mostrando sezione Home.");
            // Ricrea i TV screens originali
            if (mainTvScreensContainer) {
                 mainTvScreensContainer.style.display = 'flex';
                 contentArea.appendChild(mainTvScreensContainer);
                 // Potresti voler ripristinare il contenuto originale dei TV screens qui se necessario
                 document.getElementById('left-main-tv').innerHTML = '<div class="main-tv-screen-content"><h2>Schermo Feedback / Storie</h2><p>(Qui appariranno video o immagini)</p></div>';
                 document.getElementById('right-main-tv').innerHTML = '<div class="main-tv-screen-content"><h2>Schermo Istruttivo / Esercizi</h2><p>(Qui appariranno video o immagini)</p></div>';
            }
            if (btnTeoriaMusicale) btnTeoriaMusicale.classList.remove('active'); // Nessun pulsante attivo per la home
            if (btnEserciziTeorici) btnEserciziTeorici.classList.remove('active');
            break;
        case 'teoria':
            console.log(">>> MAIN showSection: Mostrando sezione Teoria Musicale.");
            setupTheoryEnvironment(); // Prepara e mostra l'ambiente teoria
            if (btnTeoriaMusicale) btnTeoriaMusicale.classList.add('active');
            break;
        case 'esercizi':
            console.log(">>> MAIN showSection: Mostrando sezione Esercizi di Teoria.");
            setupQuizEnvironment(); // Prepara e avvia l'ambiente del quiz
            if (btnEserciziTeorici) btnEserciziTeorici.classList.add('active');
            break;
        default:
            console.warn(`>>> MAIN showSection: Sezione sconosciuta: ${sectionName}. Tornando alla home.`);
            showSection('home'); // Torna alla home se la sezione non è riconosciuta
            break;
    }
}

// --- Gestione Ambiente Quiz ---

// Funzione per preparare l'ambiente del quiz e avviarlo
function setupQuizEnvironment() {
    console.log(">>> MAIN setupQuizEnvironment chiamato.");

    // 1. Prepara la struttura UI generale per il quiz (nel contentArea)
    setupQuizUI(contentArea.id);

    // 2. Aggiunge i pulsanti di input delle note specifiche per il quiz
    const noteNamesForButtons = getDiatonicC4C5NoteNamesHTML(); // Ottiene i nomi delle note dal modulo quiz
    const buttonsContainerId = getExerciseInputButtonsId(); // Ottiene l'ID del contenitore pulsanti dal modulo quiz
    addNoteInputButtons(buttonsContainerId, noteNamesForButtons); // Chiama la funzione locale per creare i pulsanti

    // 3. Avvia la logica del quiz (genera note, mostra la prima)
    startQuiz();

    // 4. Imposta il gestore input attivo per reindirizzare l'input a processQuizInput
    activeInputHandler = processQuizInput; // Usa il gestore input generale
}

// --- Gestione Ambiente Teoria ---

// Funzione per preparare l'ambiente della sezione teoria
function setupTheoryEnvironment() {
    console.log(">>> MAIN setupTheoryEnvironment chiamato.");

    // 1. Prepara la struttura UI generale per la sezione teoria (nel contentArea)
    setupTheoryUI(contentArea.id);

    // 2. Aggiunge i pulsanti di input delle note specifiche per la teoria
    const noteNamesForButtons = getTheoryNoteNamesHTML(); // Ottiene i nomi delle note dal modulo teoria
    const buttonsContainerId = getTheoryInputButtonsId(); // Ottiene l'ID del contenitore pulsanti dal modulo teoria
    addNoteInputButtons(buttonsContainerId, noteNamesForButtons); // Chiama la funzione locale per creare i pulsanti

    // 3. Imposta il gestore input attivo per reindirizzare l'input a processTheoryInput
    activeInputHandler = processTheoryInput; // Usa il gestore input generale
}


// Funzione locale per aggiungere i pulsanti di input delle note a un contenitore specificato
// MODIFICATO: Aggiunto data attribute per il nome della nota italiana
function addNoteInputButtons(buttonsContainerId, noteNamesHTML) {
    console.log(`>>> MAIN addNoteInputButtons chiamato per #${buttonsContainerId}.`);
    const buttonsContainer = document.getElementById(buttonsContainerId);
    if (!buttonsContainer) {
        console.error(`>>> MAIN addNoteInputButtons: Contenitore pulsanti "${buttonsContainerId}" non trovato!`);
        return;
    }

    buttonsContainer.innerHTML = ''; // Pulisce eventuali pulsanti precedenti

    noteNamesHTML.forEach(noteHTML => {
        const button = document.createElement('button');
        button.textContent = noteHTML; // Testo del pulsante (es. "Do4")
        button.classList.add('exercise-note-button'); // Classe per lo stile (riutilizziamo la stessa classe CSS)
        // NUOVO: Aggiungi l'attributo data-note-name-italian
        button.dataset.noteNameItalian = noteHTML.toLowerCase(); // Es: "do4", "re4"

        // Converti il nome HTML in formato VexFlow per l'input
        let vexFlowKey = noteHTML;
         if (noteHTML && noteHTML.length >= 2) { // Assumiamo formato "NomeOttava" es. "Do4"
             const notePart = noteHTML.slice(0, -1).toLowerCase(); // es. "Do4" -> "do"
             const octavePart = noteHTML.slice(-1);              // es. "Do4" -> "4"
             // Gestisci le alterazioni se presenti (es. "Do#4")
             let baseNote = notePart.replace(/[#b]/g, ''); // Rimuovi alterazioni per trovare la base
             let accidental = '';
             if (notePart.includes('#')) accidental = '#';
             if (notePart.includes('b')) accidental = 'b'; // Semplice, non gestisce doppie alterazioni o conflitti

             // Trova il nome della nota in inglese per VexFlow
             const englishNoteNames = { 'do': 'c', 're': 'd', 'mi': 'e', 'fa': 'f', 'sol': 'g', 'la': 'a', 'si': 'b' };
             const englishBaseNote = englishNoteNames[baseNote];

             if (englishBaseNote) {
                 vexFlowKey = `${englishBaseNote}${accidental}/${octavePart}`;
             } else {
                  console.warn(`>>> MAIN addNoteInputButtons: Nome nota italiano non riconosciuto "${noteHTML}". Uso come è.`);
                  vexFlowKey = noteHTML; // Fallback, potrebbe non funzionare
             }

         } else {
              console.warn(`>>> MAIN addNoteInputButtons: Formato nota non valido o vuoto "${noteHTML}". Ignorato.`);
              return; // Salta questo pulsante se il formato non è gestibile
         }


        // Aggiungi un listener al pulsante
        button.addEventListener('click', () => {
            console.log(`>>> MAIN addNoteInputButtons: Pulsante "${noteHTML}" cliccato. Input VexFlow: ${vexFlowKey}`);
            // Chiama il gestore di input centrale con la nota selezionata dal pulsante
            // Usiamo un midiNumber fittizio (-1) e velocity (100) per distinguere l'input da pulsante
            handleNoteInput(vexFlowKey, -1, 100);
        });

        buttonsContainer.appendChild(button);
    });
    console.log(`>>> MAIN addNoteInputButtons: Aggiunti ${noteNamesHTML.length} pulsanti di input.`);
}


// --- Avvio ---
// Quando la pagina HTML è completamente caricata, esegui initializeApp
document.addEventListener('DOMContentLoaded', initializeApp);
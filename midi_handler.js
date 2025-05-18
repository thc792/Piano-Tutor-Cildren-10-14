/**
 * js/midi_handler.js
 * Gestore per l'input MIDI Web API
 * **VERSIONE CON AGGIUNTA FORZATA DEL LISTENER in updateDevices**
 *
   * Piano Tutor cildren 
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
 * https:https://github.com/thc792/Pianotutorcildren/blob/main/LICENSE.md]
 * o contattare [pianothc791@gmail.com].
 */

// RIGA 7: QUESTA DEVE ESSERE LA RIGA 7. Non deve essere un import.
let midiAccess = null;

let currentInput = null;
let noteOnCallback = null; // Funzione da chiamare quando una nota è premuta (handleMIDINoteOn in main.js)
let midiStatusCallback = null; // Funzione per aggiornare lo stato nell'UI

const MIDI_NOTE_MAP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiNumberToNoteName(midiNote) {
    if (midiNote < 0 || midiNote > 127) return null;
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    // Restituisce nel formato VexFlow (es. c/4, f#/3). Aggiustato per essere minuscolo.
    return `${MIDI_NOTE_MAP[noteIndex].toLowerCase()}/${octave}`;
}

// Listener principale che riceve i messaggi MIDI
function onMIDIMessage(event) {
    const rawData = event.data;
    const command = rawData[0] >> 4;
    const noteNumber = rawData[1];
    const velocity = rawData.length > 2 ? rawData[2] : 0;

    // Logga SEMPRE il messaggio ricevuto per debug
    console.log(`%cMIDI Message Received:`, 'color: orange; font-weight: bold;', {
        rawData: `[${rawData[0]}, ${rawData[1]}${rawData.length > 2 ? ', ' + rawData[2] : ''}]`,
        command: command,
        noteNumber: noteNumber,
        velocity: velocity
    });

    // Processa solo Note On con velocity > 0
    if (command === 9 && velocity > 0) {
        const noteName = midiNumberToNoteName(noteNumber); // Nome nota nel formato VexFlow (es. c/4)
        console.log(`  -> Interpreted as: Note On (Name: ${noteName})`); // DEBUG

        if (noteOnCallback && noteName) {
            console.log("  -> Calling noteOnCallback (handleMIDINoteOn in main.js)..."); // DEBUG
            // Passiamo il nome nota nel formato VexFlow, il numero MIDI, e la velocity
            noteOnCallback(noteName, noteNumber, velocity);
        } else if (!noteOnCallback) {
            console.error("  -> Error: noteOnCallback is missing!");
        } else if (!noteName) {
            console.warn(`  -> Warning: Could not get noteName for MIDI note ${noteNumber}`);
        }
    } else {
        // TODO: Gestire Note Off (command === 8) se serve per visualizzazione tastiera o suono
        // console.log(" -> Ignoring non-NoteOn message or NoteOff."); // DEBUG opzionale
    }
}

// Funzione CHIAVE: Gestisce l'aggiunta/rimozione del listener
function updateDevices(inputs) {
    console.log("MIDI LOG: updateDevices: Checking inputs...");
    const inputsIterator = inputs.values();
    const firstInput = inputs.size > 0 ? inputsIterator.next().value : null;

    // Rimuovi SEMPRE il listener dal vecchio input, se esiste
    if (currentInput && currentInput !== firstInput) {
        console.log(`MIDI LOG: updateDevices: Removing listener from old device ${currentInput.name}`);
        try {
             currentInput.removeEventListener('midimessage', onMIDIMessage);
        } catch (e) { console.error("MIDI LOG: Error removing listener:", e)}
        currentInput = null;
    } else if (currentInput && currentInput === firstInput) {
        console.log(`MIDI LOG: updateDevices: Device ${currentInput.name} is the same, attempting to refresh listener.`);
         try {
             currentInput.removeEventListener('midimessage', onMIDIMessage);
             console.log(`MIDI LOG: updateDevices: Successfully removed listener before re-adding.`);
        } catch (e) { console.error("MIDI LOG: Error removing listener before re-adding:", e)}
    }


    // Se c'è un nuovo (o lo stesso) dispositivo valido
    if (firstInput) {
        currentInput = firstInput;
        console.log(`MIDI LOG: updateDevices: Attempting to attach listener to ${currentInput.name}...`);
        try {
            currentInput.addEventListener('midimessage', onMIDIMessage);
            console.log(`%cMIDI LOG: updateDevices: Listener ATTACHED (or re-attached) successfully to ${currentInput.name}`, 'color: green; font-weight: bold;');
        } catch (e) {
             console.error(`%cMIDI LOG: updateDevices: FAILED to attach listener to ${currentInput.name}`, 'color: red; font-weight: bold;', e);
        }

        if (midiStatusCallback) midiStatusCallback(`Connesso a: ${currentInput.name}`, true);

    } else {
        // Nessun dispositivo trovato
        console.log("MIDI LOG: updateDevices: No input devices found.");
        currentInput = null;
        if (midiStatusCallback) midiStatusCallback("Nessun dispositivo MIDI trovato", false);
    }
}

// Chiamato quando l'accesso MIDI ha successo
function onMIDISuccess(access) {
    midiAccess = access;
    console.log("MIDI LOG: onMIDISuccess: Accesso MIDI OK.");
    updateDevices(midiAccess.inputs); // Configura il dispositivo iniziale

    midiAccess.onstatechange = (event) => {
        console.log(`%cMIDI LOG: MIDI State Change: Port=${event.port.name}, State=${event.port.state}, Type=${event.port.type}`, 'color: purple;');
        if (event.port.type === 'input') {
             console.log("MIDI LOG: onstatechange: Input port changed state, calling updateDevices...");
            updateDevices(midiAccess.inputs); // Riconfigura i dispositivi
        }
    };
}

// Chiamato se l'accesso MIDI fallisce
function onMIDIFailure(msg) {
    console.error("MIDI LOG: onMIDIFailure: Errore accesso MIDI:", msg);
    if (midiStatusCallback) midiStatusCallback(`Errore: ${msg}`, false);
}

// Funzione esportata per inizializzare
export function initializeMIDI(_noteOnCallback, _statusCallback) {
    console.log("MIDI LOG: initializeMIDI: Initializing Web MIDI API...");
    noteOnCallback = _noteOnCallback;
    midiStatusCallback = _statusCallback;

    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: false })
            .then(onMIDISuccess, onMIDIFailure);
    } else {
        console.warn("MIDI LOG: initializeMIDI: Web MIDI API non supportata dal browser.");
        if (midiStatusCallback) midiStatusCallback("Web MIDI non supportato", false);
    }
}

// Funzioni lasciate per compatibilità importazione ma non fanno più nulla
export function stopMIDIListening() { /* ... */ }
export function startMIDIListening() { /* ... */ }
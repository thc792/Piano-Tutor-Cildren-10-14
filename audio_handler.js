/**
 * js/audio_handler.js
 * Gestore per la riproduzione di suoni utilizzando la Web Audio API.
 */

let audioContext = null;
let mainGainNode = null; // Per un controllo del volume generale
let activeOscillators = {}; // Per tenere traccia degli oscillatori attivi (utile per stop/pausa futuri)

// Funzione per convertire un numero di nota MIDI in frequenza (A4 = 440Hz)
const MIDI_NOTE_TO_FREQ_A4_440 = (note) => Math.pow(2, (note - 69) / 12) * 440;

// Mappatura nomi note (senza ottava) a indice MIDI (C=0)
const NOTE_NAME_TO_MIDI_INDEX = {
    'c': 0, 'c#': 1, 'db': 1,
    'd': 2, 'd#': 3, 'eb': 3,
    'e': 4, 'fb': 4, // e e fb sono enarmonicamente equivalenti a volte
    'f': 5, 'e#':5, // f e e#
    'f#': 6, 'gb': 6,
    'g': 7, 'g#': 8, 'ab': 8,
    'a': 9, 'a#': 10, 'bb': 10,
    'b': 11, 'cb': 11 // b e cb
};

/**
 * Converte una nota in formato VexFlow (es. "c/4", "f#/3") in un numero MIDI.
 * @param {string} vexNoteString La nota in formato VexFlow.
 * @returns {number|null} Il numero MIDI corrispondente o null se la conversione fallisce.
 */
export function vexFlowToMidi(vexNoteString) {
    if (!vexNoteString || typeof vexNoteString !== 'string') return null;
    const parts = vexNoteString.toLowerCase().split('/');
    if (parts.length !== 2) return null;

    const noteName = parts[0];
    const octave = parseInt(parts[1], 10);

    if (isNaN(octave) || NOTE_NAME_TO_MIDI_INDEX[noteName] === undefined) {
        console.warn(`>>> AUDIO: Impossibile convertire VexFlow note "${vexNoteString}" in MIDI.`);
        return null;
    }

    // MIDI C4 (nota 60) corrisponde a octave 4 nella nostra mappatura.
    // Formula: (octave + 1) * 12 + noteIndex (se C0 è MIDI 0)
    // O, più comunemente, per C4=60: (octave + 1) * 12 + noteIndex.
    // MIDI note number = (octave + 1) * 12 + note_index_from_C
    // Esempio: C4 -> (4+1)*12 + 0 = 60
    // Esempio: A3 -> (3+1)*12 + 9 = 48 + 9 = 57
    const midiNumber = (octave + 1) * 12 + NOTE_NAME_TO_MIDI_INDEX[noteName];
    return midiNumber;
}


/**
 * Inizializza l'AudioContext e il nodo gain principale.
 */
export function initializeAudio() {
    if (audioContext) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        mainGainNode = audioContext.createGain();
        mainGainNode.connect(audioContext.destination);
        mainGainNode.gain.value = 0.5; // Volume master ridotto leggermente
        console.log(">>> AUDIO: AudioContext inizializzato.");
    } catch (e) {
        console.error(">>> AUDIO: Web Audio API non supportata o errore inizializzazione.", e);
        alert("Il tuo browser non supporta la Web Audio API, i suoni non funzioneranno.");
    }
}

/**
 * Riproduce un suono di nota.
 * @param {number} midiNoteNumber Il numero MIDI della nota.
 * @param {number} durationSeconds Durata totale per cui la nota dovrebbe idealmente suonare (inclusi attack e release).
 * @param {number} velocity La "forza" (0-127), influenza il volume.
 * @param {string} waveType Tipo d'onda (sine, square, sawtooth, triangle).
 */
export function playNoteSound(midiNoteNumber, durationSeconds = 0.7, velocity = 100, waveType = 'triangle') {
    if (!audioContext) {
        initializeAudio();
        if (!audioContext) {
            console.error(">>> AUDIO: Impossibile riprodurre suono: AudioContext non disponibile.");
            return;
        }
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => console.error(">>> AUDIO: Errore nel riprendere AudioContext:", err));
    }

    const oscillator = audioContext.createOscillator();
    const noteGainNode = audioContext.createGain();
    const uniqueId = `${midiNoteNumber}-${Date.now()}`; // Per tracciare l'oscillatore

    oscillator.type = waveType;
    const frequency = MIDI_NOTE_TO_FREQ_A4_440(midiNoteNumber);
    if (isNaN(frequency) || frequency <= 0) {
        console.warn(`>>> AUDIO: Frequenza non valida (${frequency}) per MIDI ${midiNoteNumber}.`);
        return;
    }
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    const now = audioContext.currentTime;
    const attackDuration = 0.02;
    const peakVolume = (velocity / 127) * 0.7; // Volume picco
    const releaseDuration = Math.min(0.3, durationSeconds * 0.4); // Release più corto e proporzionale

    noteGainNode.gain.setValueAtTime(0, now);
    noteGainNode.gain.linearRampToValueAtTime(peakVolume, now + attackDuration);
    
    // Inizio del sustain (o direttamente al release se la nota è molto corta)
    const sustainEndTime = now + durationSeconds - releaseDuration;
    if (sustainEndTime > now + attackDuration) {
        noteGainNode.gain.setValueAtTime(peakVolume, now + attackDuration); // Inizio sustain
        noteGainNode.gain.linearRampToValueAtTime(peakVolume, sustainEndTime); // Fine sustain / Inizio release
    }
    
    noteGainNode.gain.linearRampToValueAtTime(0.0001, now + durationSeconds); // Rilascia a zero

    oscillator.connect(noteGainNode);
    noteGainNode.connect(mainGainNode || audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.05); // Ferma un po' dopo per il release completo

    activeOscillators[uniqueId] = { oscillator, gainNode: noteGainNode };

    oscillator.onended = () => {
        noteGainNode.disconnect();
        oscillator.disconnect();
        delete activeOscillators[uniqueId];
    };
}

// Funzione per fermare tutti i suoni (utile per un pulsante STOP)
export function stopAllSounds() {
    if (!audioContext) return;
    console.log(">>> AUDIO: Tentativo di fermare tutti i suoni...");
    for (const id in activeOscillators) {
        try {
            const { oscillator, gainNode } = activeOscillators[id];
            // Fade out rapido invece di stop immediato per evitare click
            const now = audioContext.currentTime;
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(gainNode.gain.value, now); // Prendi il valore corrente
            gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.05); // Rampa a zero velocemente
            oscillator.stop(now + 0.1); // Ferma l'oscillatore poco dopo
            console.log(`>>> AUDIO: Fermando oscillatore ${id}`);
        } catch (e) {
            console.warn(`>>> AUDIO: Errore nel fermare oscillatore ${id}`, e);
        }
        delete activeOscillators[id];
    }
     // Svuota l'oggetto dopo aver tentato di fermare tutto
    activeOscillators = {};
}
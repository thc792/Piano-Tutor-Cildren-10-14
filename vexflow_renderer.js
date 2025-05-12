/**
 * js/vexflow_renderer.js
 * Renderer per esercizi musicali e pentagrammi base usando VexFlow.
 *
 * Piano App per Bambini
 * Basato su codice di Piano Future di Lorenzetti Giuseppe (con modifiche e aggiunte per debug)
 *
 * Questo codice sorgente è rilasciato sotto la licenza MIT.
 * Vedi il file LICENSE nel repository GitHub per i dettagli completi.
 * https://github.com/thc792/piano-tutor-extraime/blob/main/LICENSE
 */

// Importa le classi necessarie da Vex.Flow
const { Factory, Stave, StaveNote, Formatter, Voice, Beam, Accidental, StaveConnector, TickContext, Fraction, Note, Annotation, TextNote } = Vex.Flow;

// --- Costanti ---
const MEASURES_PER_LINE = 4; // Quante battute per riga (puoi aggiustare)
const SYSTEM_SPACING = 280; // Spazio verticale tra i sistemi (grand staff)
const SINGLE_STAVE_SYSTEM_SPACING = 150; // Spazio verticale (single staff)
const STAVE_START_X = 15; // Margine sinistro
// Adattato Y iniziale per pentagramma singolo per farlo stare meglio nel footer più piccolo
const STAVE_START_Y_GRAND = 40;
const STAVE_START_Y_SINGLE = 20; // Ridotto l'inizio per un pentagramma più compatto nel footer
const STAVE_VERTICAL_DISTANCE = 100; // Distanza tra treble e bass nel grand staff


// --- Funzioni Helper (Dal tuo codice funzionante - Copiato fedelmente) ---
function durationToTicks(durationString) {
    const BEAT_TICKS = Vex.Flow.RESOLUTION / 4; let ticks = 0;
    const baseDuration = durationString.replace(/[.d]/g, '');
    switch (baseDuration) { case 'w': ticks = 4 * BEAT_TICKS; break; case 'h': ticks = 2 * BEAT_TICKS; break; case 'q': ticks = BEAT_TICKS; break; case '8': ticks = BEAT_TICKS / 2; break; case '16': ticks = BEAT_TICKS / 4; break; case '32': ticks = BEAT_TICKS / 8; break; default: ticks = BEAT_TICKS; }
    if (durationString.includes('.')) { let numDots = (durationString.match(/\./g) || []).length; let dotValue = ticks; for (let i = 0; i < numDots; i++) { dotValue /= 2; ticks += dotValue; } }
    else if (durationString.endsWith('d')) { ticks = ticks * 1.5; }
    return ticks;
}

function getTicksPerMeasure(timeSignature) {
    try {
        if (!timeSignature) return Vex.Flow.RESOLUTION;
        const parts = timeSignature.split('/');
        if (parts.length !== 2) return Vex.Flow.RESOLUTION;
        const beats = parseInt(parts[0]);
        const beatValue = parseInt(parts[1]);
        if (isNaN(beats) || isNaN(beatValue) || beatValue === 0 || !Number.isInteger(beats) || !Number.isInteger(beatValue)) {
             console.warn("VXR LOG: Invalid time signature format:", timeSignature, "Falling back to 4/4.");
             return Vex.Flow.RESOLUTION;
        }
        return (Vex.Flow.RESOLUTION / beatValue) * beats;
    } catch (e) {
        console.error("VXR LOG: Error parsing time signature:", timeSignature, e);
        return Vex.Flow.RESOLUTION;
    }
}

function segmentNotesByMeasure(notes, ticksPerMeasure, measuresPerLine) {
    if (!notes || !Array.isArray(notes) || notes.length === 0) return [];
    const segments = [];
    let currentSegment = [];
    let currentTickCount = 0;
    const ticksPerLine = ticksPerMeasure * measuresPerLine;
    const validNotes = notes.filter(note => note && typeof note.duration === 'string');
    validNotes.forEach(note => {
        const noteTicks = durationToTicks(note.duration);
        if (isNaN(noteTicks)) {
            console.warn("VXR LOG: Invalid duration found for note, skipping:", note);
            return;
        }
        if ((currentTickCount + noteTicks > ticksPerLine && currentSegment.length > 0) || (noteTicks > ticksPerLine && currentSegment.length === 0) ) {
             if (currentTickCount > 0) { segments.push(currentSegment); }
            currentSegment = [note];
            currentTickCount = noteTicks;
             if (noteTicks > ticksPerLine) {
                 console.warn(`VXR LOG: Note with duration ${note.duration} exceeds ticks per line (${ticksPerLine}). Placing on its own line.`);
                 segments.push(currentSegment);
                 currentSegment = [];
                 currentTickCount = 0;
             }
        } else if (noteTicks <= ticksPerLine) {
            currentSegment.push(note);
            currentTickCount += noteTicks;
        } else {
             console.error("VXR LOG: Unhandled case in segmentNotesByMeasure for note:", note);
        }
        if (currentTickCount === ticksPerLine && currentSegment.length > 0) {
             segments.push(currentSegment);
             currentSegment = [];
             currentTickCount = 0;
        }
    });
    if (currentSegment.length > 0) { segments.push(currentSegment); }
    return segments;
}

// MODIFICATA: Aggiunto parametro showTextAnnotations e logica per aggiungere Annotation
function createStyledStaveNotes(noteDataArray, clefType, showTextAnnotations = false, defaultFill = '#333', defaultStroke = '#333') {
    if (!noteDataArray || !Array.isArray(noteDataArray)) return [];

     // Mappa per nomi note in italiano
    const italianNoteNames = {
        'C': 'Do', 'C#': 'Do#', 'Db': 'Reb', 'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib',
        'E': 'Mi', 'Fb': 'Fab', 'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb',
        'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab', 'A': 'La', 'A#': 'La#', 'Bb': 'Sib',
        'B': 'Si', 'Cb': 'Dob'
    };


    return noteDataArray.map((noteData) => {
        if (!noteData || typeof noteData !== 'object' || !noteData.keys || !Array.isArray(noteData.keys) || noteData.keys.length === 0 || typeof noteData.duration !== 'string') {
             console.warn("VXR LOG: Invalid note data object found:", noteData);
             return null;
        }

        const isRest = noteData.keys[0].toLowerCase() === 'r' || noteData.keys[0].toLowerCase().startsWith('r/');
        const baseDuration = noteData.duration.replace(/[.d]/g, '');

        const noteConfig = {
            keys: isRest ? ["b/4"] : noteData.keys,
            duration: baseDuration,
            clef: clefType,
            type: isRest ? 'r' : undefined
        };

        let staveNote;
        try {
            staveNote = new StaveNote(noteConfig);
        } catch (e) {
            console.error("VXR LOG: Error creating StaveNote with config:", noteConfig, "Original data:", noteData, "Error:", e);
            return null;
        }

        if (!isRest) {
            noteData.keys.forEach((key, keyIndex) => {
                const keyParts = key.split('/');
                if (keyParts.length < 2) return;
                const pitchNameFull = keyParts[0];

                let accidentalSymbol = null;
                if (pitchNameFull.endsWith("##")) accidentalSymbol = "##";
                else if (pitchNameFull.endsWith("bb")) accidentalSymbol = (pitchNameFull === "bb" ? "b" : "bb");
                else if (pitchNameFull.endsWith("#")) accidentalSymbol = "#";
                else if (pitchNameFull.endsWith("b") && pitchNameFull.length > 1) accidentalSymbol = "b";

                if (accidentalSymbol) {
                    try {
                        staveNote.addModifier(new Accidental(accidentalSymbol), keyIndex);
                    } catch (e) {
                        console.error("VXR LOG: Error adding accidental:", accidentalSymbol, "to note:", staveNote, "Error:", e);
                    }
                }

                // Aggiungi annotazione testuale se richiesto
                if (showTextAnnotations) {
                    const rawPitch = pitchNameFull.replace(/[#b]/g, '').toUpperCase();
                    const italianName = italianNoteNames[rawPitch] || rawPitch;

                    if (italianName) {
                         const annotation = new Annotation(italianName)
                             .setFont("Arial", 10, "bold")
                             .setVerticalJustification(Annotation.VerticalJustify.TOP);

                         staveNote.addModifier(annotation, keyIndex);
                    }
                }
            });

            if (noteData.duration.includes('.')) {
                let numDots = (noteData.duration.match(/\./g) || []).length;
                for (let i = 0; i < numDots; i++) { try { staveNote.addDotToAll(); } catch(e) { console.error("VXR LOG: Error adding dot:", e, "Note:", staveNote); } }
            } else if (noteData.duration.endsWith('d')) {
                 try { staveNote.addDotToAll(); } catch(e) { console.error("VXR LOG: Error adding dot for 'd':", e, "Note:", staveNote); }
            }
        }

        let fillStyle = defaultFill;
        let strokeStyle = defaultStroke;
        if (!isRest && noteData.status) {
            switch (noteData.status) {
                case 'correct': fillStyle = '#28a745'; strokeStyle = '#1c7430'; break;
                case 'incorrect': fillStyle = 'rgba(220, 53, 69, 0.7)'; strokeStyle = '#a71d2a'; break;
                case 'expected': fillStyle = 'rgba(0, 123, 255, 0.5)'; strokeStyle = 'rgba(0, 90, 200, 0.7)'; break;
                default: break;
            }
        }
         try { staveNote.setStyle({ fillStyle: fillStyle, strokeStyle: strokeStyle }); } catch (e) { console.error("VXR LOG: Error setting style:", e, "Note:", staveNote);}

        return staveNote;
    }).filter(note => note !== null);
}


// --- Funzione Principale Esportata (Corretta per Single Stave) ---
export function renderExercise(elementId, exercise, options = {}) {
    console.log(`>>> VXR renderExercise chiamato per elemento "${elementId}". Esercizio dati:`, exercise);

    const scoreDiv = document.getElementById(elementId);
    if (!scoreDiv) {
        console.error(`>>> VXR renderExercise: Elemento "${elementId}" NON TROVATO!`);
        return;
    }
    console.log(`>>> VXR renderExercise: Elemento trovato`, scoreDiv, `. clientWidth: ${scoreDiv.clientWidth}, clientHeight: ${scoreDiv.clientHeight}`);

    scoreDiv.innerHTML = ''; // Pulisce

     if (!exercise || typeof exercise !== 'object') {
        console.error("VXR LOG: Invalid or missing exercise object provided.");
        scoreDiv.innerHTML = "<p style='color: red;'>Dati esercizio non validi.</p>";
        return;
     }

    const useGrandStaff = exercise.staveLayout === 'grand' || (exercise.notesTreble && exercise.notesBass);
    // Usa clientWidth per la larghezza del renderer, meno un po' di margine
    const rendererWidth = scoreDiv.clientWidth > 0 ? scoreDiv.clientWidth - (STAVE_START_X * 2) : 760; // Adattato margine
    const ticksPerMeasure = getTicksPerMeasure(exercise.timeSignature || "4/4");
    const ticksPerLine = ticksPerMeasure * MEASURES_PER_LINE;

    const trebleSegments = segmentNotesByMeasure(exercise.notesTreble || [], ticksPerMeasure, MEASURES_PER_LINE);
    const bassSegments = segmentNotesByMeasure(exercise.notesBass || [], ticksPerMeasure, MEASURES_PER_LINE);
    let singleStaveSegments = [];
     if (!useGrandStaff && exercise.notes && Array.isArray(exercise.notes)) { // Aggiunto controllo Array.isArray
         singleStaveSegments = segmentNotesByMeasure(exercise.notes, ticksPerMeasure, MEASURES_PER_LINE);
     }

    const numSystems = useGrandStaff
        ? Math.max(trebleSegments.length, bassSegments.length)
        : singleStaveSegments.length;

     // Se non ci sono note da disegnare, chiama renderEmptyStaff
     if (numSystems === 0) {
        const hadInputNotes = (exercise.notesTreble && exercise.notesTreble.length > 0) ||
                              (exercise.notesBass && exercise.notesBass.length > 0) ||
                              (exercise.notes && exercise.notes.length > 0);
         if (hadInputNotes) {
             console.warn("VXR LOG: Nessuna nota valida trovata per il rendering dopo la segmentazione/validazione.");
             scoreDiv.innerHTML = "<p>Le note dell'esercizio non sono valide per la visualizzazione.</p>";
         } else {
             console.log("VXR LOG: Nessuna nota fornita per l'esercizio. Disegno pentagramma vuoto.");
             // CHIAMA renderEmptyStaff QUI se l'esercizio è vuoto o non valido dopo il parsing
             renderEmptyStaff(elementId, exercise.clef || 'treble', exercise.timeSignature || "4/4", exercise.keySignature || 'C');
         }
         return; // Esci dalla funzione dopo aver disegnato il pentagramma vuoto/messaggio
     }

    // Calcola l'altezza totale necessaria
    // Usa clientHeight se disponibile per evitare di disegnare troppo alto/basso all'inizio
    const rendererHeight = scoreDiv.clientHeight > 0 ? scoreDiv.clientHeight : 300; // Usa clientHeight o un fallback

    console.log(`>>> VXR renderExercise: Usando rendererWidth: ${rendererWidth + (STAVE_START_X * 2)}, rendererHeight: ${rendererHeight}`);

    const factory = new Factory({ renderer: { elementId: elementId, width: rendererWidth + (STAVE_START_X * 2), height: rendererHeight } }); // Usa rendererHeight
    const context = factory.getContext();

    console.log(">>> VXR renderExercise: Factory e Context creati.");

    context.setFont('Arial', 10);
    context.clear(); // Pulisce il context della nuova factory


    // Passa l'opzione showTextAnnotations a createStyledStaveNotes
    const showTextAnnotationsOnStaff = options.showTextAnnotations || false;


    try {
        for (let i = 0; i < numSystems; i++) {
            const staveWidth = rendererWidth; // Larghezza disponibile per il pentagramma

            // Calcola la posizione Y per ciascun sistema/riga
            // Nel nostro caso (un solo sistema verticale nell'area del footer)
            // questo loop i andrà solo fino a 0 (o 1), e systemY_Treble sarà ~STAVE_START_Y_SINGLE
            const systemY_Treble = (useGrandStaff ? STAVE_START_Y_GRAND : STAVE_START_Y_SINGLE) + (i * (useGrandStaff ? SYSTEM_SPACING : SINGLE_STAVE_SYSTEM_SPACING));
            const systemY_Bass = STAVE_START_Y_GRAND + STAVE_VERTICAL_DISTANCE + (i * SYSTEM_SPACING); // Usato solo per Grand Staff

            let staveTreble = null, staveBass = null;
            let voiceTreble = null, voiceBass = null; // Dichiarate qui per scope
            const voicesToFormat = [];

            // Creazione Pentagrammi (Staves)
            if (useGrandStaff) {
                 staveTreble = new Stave(STAVE_START_X, systemY_Treble, staveWidth);
                 staveBass = new Stave(STAVE_START_X, systemY_Bass, staveWidth);

                 if (i === 0) {
                     staveTreble.addClef('treble').addTimeSignature(exercise.timeSignature || "4/4");
                     staveBass.addClef('bass').addTimeSignature(exercise.timeSignature || "4/4");
                     if (exercise.keySignature) {
                         staveTreble.addKeySignature(exercise.keySignature);
                         staveBass.addKeySignature(exercise.keySignature);
                     }
                 } else {
                     staveTreble.addClef('treble');
                     staveBass.addClef('bass');
                 }

                 // Disegna i pentagrammi PRIMA dei connettori
                 console.log(`>>> VXR renderExercise (Grand Staff): Disegnando pentagrammi [${i}] a Y=${systemY_Treble} e ${systemY_Bass} con larghezza ${staveWidth}`);
                 staveTreble.setContext(context).draw(); // *** DISEGNA PRIMA ***
                 staveBass.setContext(context).draw();   // *** DISEGNA PRIMA ***

                 // Disegna i connettori DOPO aver disegnato i pentagrammi
                 if (i === 0) { // Graffa solo per il primo sistema
                    const brace = new StaveConnector(staveTreble, staveBass);
                    brace.setType(StaveConnector.type.BRACE);
                    console.log(`>>> VXR renderExercise (Grand Staff): Disegnando BRACE per sistema [${i}]`);
                    brace.setContext(context).draw();
                 }
                 const singleLeft = new StaveConnector(staveTreble, staveBass); // Linea verticale sinistra per tutti i sistemi
                 singleLeft.setType(StaveConnector.type.SINGLE_LEFT);
                 console.log(`>>> VXR renderExercise (Grand Staff): Disegnando SINGLE_LEFT per sistema [${i}]`);
                 singleLeft.setContext(context).draw();

            } else { // Single Stave
                const clef = exercise.clef || 'treble';
                // Crea il pentagramma singolo
                staveTreble = new Stave(STAVE_START_X, systemY_Treble, staveWidth); // Usa STAVE_START_X e systemY_Treble

                if (i === 0) { // Solo per il primo sistema
                    staveTreble.addClef(clef).addTimeSignature(exercise.timeSignature || "4/4");
                    if (exercise.keySignature) staveTreble.addKeySignature(exercise.keySignature);
                } else {
                    staveTreble.addClef(clef); // Aggiungi la chiave anche nei sistemi successivi
                }
                // Disegna il pentagramma. Questo disegnerà anche la barra verticale iniziale.
                console.log(`>>> VXR renderExercise (Single Stave): Disegnando pentagramma [${i}] a Y=${systemY_Treble} con larghezza ${staveWidth}`);
                staveTreble.setContext(context).draw(); // *** DISEGNA IL PENTAGRAMMA ***

                // *** RIMOZIONE DEL CODICE StaveConnector PER SINGLE STAVE ***
                // console.log(`>>> VXR renderExercise (Single Stave): Disegnando connettore per pentagramma [${i}]`);
                // const singleLeft = new StaveConnector(staveTreble, null); // Il secondo argomento è null per single stave
                // singleLeft.setType(StaveConnector.type.SINGLE_LEFT);
                // singleLeft.setContext(context).draw();
                // *** FINE RIMOZIONE ***


                // Se la chiave è basso, usiamo staveTreble anche come staveBass per il disegno delle voci
                if (clef === 'bass') staveBass = staveTreble;
            }

            const numBeatsForVoice = ticksPerLine / (Vex.Flow.RESOLUTION / 4); // Calcola i "battiti" per la voce

            // Creazione Note e Voci
            const currentTrebleNotes = trebleSegments[i] || [];
            const currentBassNotes = bassSegments[i] || [];
            const currentSingleNotes = singleStaveSegments[i] || []; // Note per single stave

            let notesVexTreble = [], notesVexBass = [];

            if (useGrandStaff) {
                if (currentTrebleNotes.length > 0) {
                    // Passa l'opzione showTextAnnotations a createStyledStaveNotes
                    notesVexTreble = createStyledStaveNotes(currentTrebleNotes, 'treble', showTextAnnotationsOnStaff);
                    if (notesVexTreble.length > 0) {
                         try { voiceTreble = new Voice({ num_beats: numBeatsForVoice, beat_value: 4 }).setMode(Voice.Mode.SOFT).addTickables(notesVexTreble); voicesToFormat.push(voiceTreble); } catch (e) { console.error("VXR LOG: Error creating treble voice:", e, notesVexTreble); }
                    }
                }
                if (currentBassNotes.length > 0) {
                     // Passa l'opzione showTextAnnotations a createStyledStaveNotes
                    notesVexBass = createStyledStaveNotes(currentBassNotes, 'bass', showTextAnnotationsOnStaff);
                     if (notesVexBass.length > 0) {
                         try { voiceBass = new Voice({ num_beats: numBeatsForVoice, beat_value: 4 }).setMode(Voice.Mode.SOFT).addTickables(notesVexBass); voicesToFormat.push(voiceBass); } catch (e) { console.error("VXR LOG: Error creating bass voice:", e, notesVexBass); }
                     }
                }
            } else { // Single Stave
                if (currentSingleNotes.length > 0) {
                    const clefType = exercise.clef || 'treble';
                    // Passa l'opzione showTextAnnotations a createStyledStaveNotes
                    const styledNotes = createStyledStaveNotes(currentSingleNotes, clefType, showTextAnnotationsOnStaff);
                     if (styledNotes.length > 0) {
                         try {
                             const singleVoice = new Voice({ num_beats: numBeatsForVoice, beat_value: 4 }).setMode(Voice.Mode.SOFT).addTickables(styledNotes);
                             voicesToFormat.push(singleVoice);
                             // Assegna la voce al pentagramma corretto per il disegno, anche se è un solo rigo
                             // VexFlow la disegnerà sullo stave passato a voice.draw()
                             if (clefType === 'bass') {
                                 voiceBass = singleVoice; // Disegnerà su staveTreble (che contiene il pentagramma di basso in questo caso)
                             } else {
                                 voiceTreble = singleVoice; // Disegnerà su staveTreble
                             }
                            console.log(`>>> VXR renderExercise (Single Stave): Voce singola creata con ${styledNotes.length} note.`);

                         } catch (e) { console.error("VXR LOG: Error creating single stave voice:", e, styledNotes); }
                    }
                } else {
                     console.log(`>>> VXR renderExercise (Single Stave): Segmento [${i}] vuoto, nessuna nota da stilizzare o mettere in voce.`);
                }
            }

            // Formattazione e Disegno Voci
             if (voicesToFormat.length > 0) {
                console.log(`>>> VXR renderExercise: Inizio formattazione e disegno per sistema [${i}] con ${voicesToFormat.length} voci.`);
                const formatter = new Formatter();
                // JOIN voci se ce ne sono più di una (es. Treble + Bass)
                if (voicesToFormat.length > 1) {
                     formatter.joinVoices(voicesToFormat);
                }
                const requiredWidth = formatter.preCalculateMinTotalWidth(voicesToFormat);
                 // Calcola la larghezza effettiva per la formattazione: usa almeno requiredWidth
                const formatWidth = Math.max(requiredWidth, staveWidth); // Assicura almeno la larghezza necessaria

                 try {
                     // Formatta le voci
                    console.log(`>>> VXR renderExercise: Formattando voci con larghezza ${formatWidth}...`);
                     formatter.format(voicesToFormat, formatWidth, { align_rests: true, context: context }); // Passa la larghezza calcolata
                     console.log(`>>> VXR renderExercise: Formattazione sistema [${i}] completata.`);

                 } catch (e) {
                     console.warn(`VXR LOG: Formatter error system ${i+1} (width: ${formatWidth}):`, e, "Voices:", voicesToFormat);
                     // Fallback: riprova con formattazione più semplice o ignora l'errore del formatter
                      try {
                           console.log("VXR LOG: Retrying formatting without specific width...");
                           if (voicesToFormat.length > 1) { formatter.joinVoices(voicesToFormat); }
                           formatter.format(voicesToFormat, undefined, { align_rests: true, context: context });
                           console.log(`>>> VXR renderExercise: Fallback Formattazione sistema [${i}] completata.`);
                      } catch (e2) {
                           console.error(`VXR LOG: Fallback formatter failed system ${i+1}:`, e2);
                           continue; // Salta al prossimo sistema se il formatter fallisce completamente
                      }
                 }

                 try {
                    console.log(`>>> VXR renderExercise: Disegnando voci per sistema [${i}]...`);
                    voicesToFormat.forEach(voice => {
                        // Determina su quale pentagramma disegnare la voce
                        // Se è Grand Staff e questa voce è la voce di Basso, disegna su staveBass, altrimenti su staveTreble
                        const targetStave = (useGrandStaff && voice === voiceBass) ? staveBass : staveTreble;

                         if (targetStave) {
                            console.log(`>>> VXR renderExercise: Disegnando voce su stave:`, targetStave);
                             voice.draw(context, targetStave);
                             const beams = Beam.generateBeams(voice.getTickables().filter(n => !n.isRest()));
                             if (beams.length > 0) {
                                  console.log(`>>> VXR renderExercise: Disegnando ${beams.length} travature.`);
                                  beams.forEach(beam => beam.setContext(context).draw());
                             }
                         } else {
                             console.warn("VXR LOG: Target stave missing for voice, skipping draw. Voice:", voice);
                         }
                     });
                    console.log(`>>> VXR renderExercise: Disegno voci per sistema [${i}] completato.`);

                 } catch (drawError) {
                     console.error(`>>> VXR renderExercise: Error drawing voices or beams for system ${i+1}:`, drawError);
                 }
            } else {
                 console.log(`>>> VXR renderExercise: Sistema [${i}]: Nessuna voce valida da formattare o disegnare.`); // Log esatto solo se no voices
             }
        }
         console.log(`>>> VXR renderExercise: Fine loop su sistemi. Disegno VexFlow completato (senza errori visibili).`);
    } catch (error) {
        // Errore generale nel try principale
        console.error(">>> VXR Generale Errore durante il rendering VexFlow:", error);
        scoreDiv.innerHTML = `<p style="color: red;">Errore VexFlow: ${error.message}</p><pre>${error.stack}</pre>`;
    }
}


// --- Funzione NUOVA: Disegna un pentagramma base/vuoto (Esportata) ---
// Questa funzione la usiamo noi per mostrare un pentagramma quando non ci sono note di esercizio o note utente.
export function renderEmptyStaff(elementId, clef = 'treble', timeSignature = '4/4', keySignature = 'C') {
    console.log(`>>> VXR renderEmptyStaff chiamato per elemento "${elementId}".`);

    const scoreDiv = document.getElementById(elementId);
    if (!scoreDiv) {
        console.error(`>>> VXR renderEmptyStaff: Elemento "${elementId}" NON TROVATO!`);
        return null;
    }
    console.log(`>>> VXR renderEmptyStaff: Elemento trovato`, scoreDiv, `. clientWidth: ${scoreDiv.clientWidth}, clientHeight: ${scoreDiv.clientHeight}`);


    // Pulisce il div prima di disegnare
    scoreDiv.innerHTML = '';

    // Calcola larghezza e altezza basandosi sullo spazio disponibile nel div
    const rendererWidth = scoreDiv.clientWidth > 0 ? scoreDiv.clientWidth : 700;
    const rendererHeight = scoreDiv.clientHeight > 0 ? scoreDiv.clientHeight : 150;

    console.log(`>>> VXR renderEmptyStaff: Usando rendererWidth: ${rendererWidth}, rendererHeight: ${rendererHeight}`);

    try {
        // Crea la "fabbrica" di VexFlow per questo disegno
        const factory = new Factory({
            renderer: { elementId: elementId, width: rendererWidth, height: rendererHeight }
        });
        console.log(">>> VXR renderEmptyStaff: Factory creata.");

        // Ottiene il "foglio da disegno"
        const context = factory.getContext();
        console.log(">>> VXR renderEmptyStaff: Context ottenuto.");

        context.setFont('Arial', 12, ""); // Imposta font e dimensione
        context.clear(); // Pulisce il "foglio da disegno"

        // Calcola la posizione Y per centrare verticalmente il pentagramma nel div
        // Un pentagramma è alto circa 80-100px con chiave e tempo
        const staveY = Math.max(10, (rendererHeight - 80) / 2);
        console.log(`>>> VXR renderEmptyStaff: Stave Y position: ${staveY}. STAVE_START_X: ${STAVE_START_X}. Stave Width: ${rendererWidth - (STAVE_START_X * 2)}`);


        // Crea l'oggetto Stave (il pentagramma)
        // Inizia a STAVE_START_X, a posizione Y calcolata, con la larghezza del div meno i margini laterali
        const stave = new Stave(STAVE_START_X, staveY, rendererWidth - (STAVE_START_X * 2));

        // Aggiunge chiave, tempo e armatura di chiave
        console.log(`>>> VXR renderEmptyStaff: Aggiungendo clef: ${clef}, timeSignature: ${timeSignature}, keySignature: ${keySignature}`);
        stave.addClef(clef);
        if (timeSignature) stave.addTimeSignature(timeSignature);
        // Aggiungi armatura di chiave solo se non è C (Do Maggiore)
        if (keySignature && keySignature !== 'C') stave.addKeySignature(keySignature);

        // Disegna il pentagramma sul "foglio da disegno"
        console.log(">>> VXR renderEmptyStaff: Chiamando stave.setContext(context).draw()...");
        stave.setContext(context).draw();
        console.log(">>> VXR renderEmptyStaff: Chiamata a stave.draw() completata.");


        // Ritorna la factory (potrebbe servire in futuro)
        console.log(">>> VXR renderEmptyStaff: Disegno completato (senza errori visibili).");
        return factory;

    } catch (error) {
        // Se c'è un errore durante il disegno del pentagramma vuoto
        console.error(">>> VXR Errore VexFlow in renderEmptyStaff:", error);
        // Mostra un messaggio di errore nel div
        scoreDiv.innerHTML = `<p style="color: red;">Errore VexFlow: ${error.message}</p>`;
        return null; // Indica che il disegno non è riuscito
    }
}
/**
 * js/vexflow_renderer.js
 * Renderer per esercizi musicali e pentagrammi base usando VexFlow.
 * TUTTI i pentagrammi usano la larghezza piena.
 * Permette un customStartY per posizionamento verticale specifico.
 */

// Importa le classi necessarie da Vex.Flow
const { Factory, Stave, StaveNote, Formatter, Voice, Beam, Accidental, StaveConnector, TickContext, Fraction, Note, Annotation, TextNote } = Vex.Flow;

// --- Costanti ---
const MEASURES_PER_LINE = 4;
const SYSTEM_SPACING = 280;
const SINGLE_STAVE_SYSTEM_SPACING = 150;
const STAVE_START_X_FALLBACK = 15; 
const STAVE_START_Y_GRAND_DEFAULT = 1;    
const STAVE_START_Y_SINGLE_DEFAULT = -10;  // Default per single staff
const STAVE_VERTICAL_DISTANCE = 50

// --- Funzioni Helper --- 
// (durationToTicks, getTicksPerMeasure, segmentNotesByMeasure, createStyledStaveNotes - rimangono invariate
//  e devono includere la correzione per il nome "Si" in createStyledStaveNotes)
// ... (COPIA QUI LE FUNZIONI HELPER DALLA VERSIONE PRECEDENTE E CORRETTA) ...
function durationToTicks(durationString) {
    const BEAT_TICKS = Vex.Flow.RESOLUTION / 4; let ticks = 0;
    const baseDuration = durationString.replace(/[.dr]/g, '');
    switch (baseDuration) {
        case 'w': ticks = 4 * BEAT_TICKS; break; case 'h': ticks = 2 * BEAT_TICKS; break;
        case 'q': ticks = BEAT_TICKS; break; case '8': ticks = BEAT_TICKS / 2; break;
        case '16': ticks = BEAT_TICKS / 4; break; case '32': ticks = BEAT_TICKS / 8; break;
        case '64': ticks = BEAT_TICKS / 16; break; default: ticks = BEAT_TICKS;
    }
    if (durationString.includes('.')) {
        let numDots = (durationString.match(/\./g) || []).length;
        let dotValue = ticks;
        for (let i = 0; i < numDots; i++) { dotValue /= 2; ticks += dotValue; }
    } else if (durationString.endsWith('d') && !durationString.endsWith('rd')) {
        ticks = ticks * 1.5;
    }
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
    const segments = []; let currentSegment = []; let currentTickCount = 0;
    const ticksPerLine = ticksPerMeasure * measuresPerLine;
    const validNotes = notes.filter(note => note && typeof note.duration === 'string');

    validNotes.forEach(note => {
        const noteTicks = durationToTicks(note.duration);
        if (isNaN(noteTicks)) { console.warn("VXR LOG: Invalid duration, skipping note:", note); return; }

        if ((currentTickCount + noteTicks > ticksPerLine && currentSegment.length > 0) || (noteTicks > ticksPerLine && currentSegment.length === 0)) {
            if (currentTickCount > 0) { segments.push(currentSegment); }
            currentSegment = [note]; currentTickCount = noteTicks;
            if (noteTicks > ticksPerLine) {
                console.warn(`VXR LOG: Note duration ${note.duration} exceeds ticks per line. Placing on its own line.`);
                segments.push(currentSegment); currentSegment = []; currentTickCount = 0;
            }
        } else if (noteTicks <= ticksPerLine) {
            currentSegment.push(note); currentTickCount += noteTicks;
        }
        if (currentTickCount === ticksPerLine && currentSegment.length > 0) {
            segments.push(currentSegment); currentSegment = []; currentTickCount = 0;
        }
    });
    if (currentSegment.length > 0) { segments.push(currentSegment); }
    return segments;
}

function createStyledStaveNotes(noteDataArray, clefType, showTextAnnotations = false, defaultFill = '#333', defaultStroke = '#333') {
    if (!noteDataArray || !Array.isArray(noteDataArray)) return [];
    const italianNoteNames = { 'C': 'Do', 'C#': 'Do#', 'Db': 'Reb', 'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib', 'E': 'Mi', 'Fb': 'Fab', 'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb', 'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab', 'A': 'La', 'A#': 'La#', 'Bb': 'Sib', 'B': 'Si', 'Cb': 'Dob' };

    return noteDataArray.map((noteData) => {
        if (!noteData || typeof noteData !== 'object' || !noteData.keys || !Array.isArray(noteData.keys) || noteData.keys.length === 0 || typeof noteData.duration !== 'string') {
             console.warn("VXR LOG: Invalid note data object:", noteData); return null;
        }
        const isRest = noteData.type === 'r' || noteData.duration.endsWith('r');
        const noteConfig = {
            keys: isRest ? ["b/4"] : noteData.keys,
            duration: noteData.duration, 
            clef: clefType,
        };
        if (isRest) noteConfig.type = 'r'; 

        let staveNote;
        try { staveNote = new StaveNote(noteConfig); }
        catch (e) { console.error("VXR LOG: Error creating StaveNote:", e, noteConfig, noteData); return null; }

        if (!isRest) {
            noteData.keys.forEach((key, keyIndex) => {
                const keyParts = key.split('/'); 
                if (keyParts.length < 2) return;
                const pitchNameFull = keyParts[0]; 
                let accidentalSymbol = null;
                if (pitchNameFull.endsWith("##")) accidentalSymbol = "##";
                else if (pitchNameFull.endsWith("bb")) accidentalSymbol = (pitchNameFull === "bb" ? "b" : "bb");
                else if (pitchNameFull.endsWith("#")) accidentalSymbol = "#";
                else if (pitchNameFull.length > 1 && pitchNameFull.endsWith("b")) accidentalSymbol = "b"; 
                
                if (accidentalSymbol) { 
                    try { staveNote.addModifier(new Accidental(accidentalSymbol), keyIndex); } 
                    catch (e) { console.error("VXR LOG: Error adding accidental:", e, accidentalSymbol, keyIndex); } 
                }

                if (showTextAnnotations) { 
                    let baseNoteName = pitchNameFull;
                    if (pitchNameFull.length > 1) { 
                        if (pitchNameFull.endsWith("##") || pitchNameFull.endsWith("bb")) {
                            baseNoteName = pitchNameFull.slice(0, -2); 
                        } else if (pitchNameFull.endsWith("#") || pitchNameFull.endsWith("b")) {
                            baseNoteName = pitchNameFull.slice(0, -1); 
                        }
                    }
                    const rawPitch = baseNoteName.toUpperCase(); 
                    const italianName = italianNoteNames[rawPitch] || rawPitch; 
                    if (italianName && italianName.trim() !== "") { 
                        const annotation = new Annotation(italianName).setFont("Arial", 10, "bold").setVerticalJustification(Annotation.VerticalJustify.TOP); 
                        try { staveNote.addModifier(annotation, keyIndex); } 
                        catch(e){ console.error("VXR LOG: Error adding name annotation:", e); }
                    } else if (rawPitch.trim() !== "") { 
                         const annotation = new Annotation(rawPitch).setFont("Arial", 10, "bold").setVerticalJustification(Annotation.VerticalJustify.TOP); 
                        try { staveNote.addModifier(annotation, keyIndex); } 
                        catch(e){ console.error("VXR LOG: Error adding rawPitch annotation:", e); }
                    }
                }
            });
            if (noteData.annotations && Array.isArray(noteData.annotations)) {
                noteData.annotations.forEach(annotData => {
                    if (annotData && annotData.text) {
                        const annotation = new Annotation(annotData.text.toString()); 
                        if (annotData.font) { annotation.setFont(annotData.font.family || 'Arial', annotData.font.size || 10, annotData.font.weight || ''); }
                        if (annotData.justification) { annotation.setVerticalJustification(annotData.justification); } else { annotation.setVerticalJustification(Annotation.VerticalJustify.BOTTOM); } 
                        try { staveNote.addModifier(annotation, 0); } 
                        catch (e) { console.error("VXR LOG: Error adding custom annotation:", e, annotData); }
                    }
                });
            }
            if (noteData.duration.includes('.') && !noteData.duration.endsWith('rd')) { 
                let numDots = (noteData.duration.match(/\./g) || []).length;
                for (let i = 0; i < numDots; i++) { try { staveNote.addDot(0); } catch(e) { console.error("VXR LOG: Error adding dot:", e); } }
            } else if (noteData.duration.endsWith('d') && !noteData.duration.endsWith('rd')) { 
                 try { staveNote.addDot(0); } catch(e) { console.error("VXR LOG: Error adding dot for 'd':", e); }
            }
        }
        let fillStyle = defaultFill; let strokeStyle = defaultStroke;
        if (noteData.status) {
            switch (noteData.status) {
                case 'correct': fillStyle = '#28a745'; strokeStyle = '#1c7430'; break;
                case 'incorrect': fillStyle = 'rgba(220, 53, 69, 0.7)'; strokeStyle = '#a71d2a'; break;
                case 'expected': fillStyle = 'rgba(0, 123, 255, 0.5)'; strokeStyle = 'rgba(0, 90, 200, 0.7)'; break;
                case 'highlight': fillStyle = '#ffc107'; strokeStyle = '#e0a800'; break;
                default: break;
            }
        }
        try { staveNote.setStyle({ fillStyle: fillStyle, strokeStyle: strokeStyle }); }
        catch (e) { console.error("VXR LOG: Error setting style:", e); }
        return staveNote;
    }).filter(note => note !== null);
}


// --- Funzione Principale Esportata ---
export function renderExercise(elementId, exercise, options = {}) {
    console.log(`>>> VXR renderExercise (ALWAYS FULL WIDTH): Elemento "${elementId}". Opzioni:`, options);
    const scoreDiv = document.getElementById(elementId);
    if (!scoreDiv) { /* ... */ return; }
    scoreDiv.innerHTML = ''; 

    if (!exercise || typeof exercise !== 'object') { /* ... */ return; }

    const useGrandStaff = exercise.staveLayout === 'grand' || (exercise.notesTreble && exercise.notesBass);
    const totalFactoryWidth = scoreDiv.clientWidth > 0 ? scoreDiv.clientWidth : 800; 

    const ticksPerMeasure = getTicksPerMeasure(exercise.timeSignature);
    
    const trebleSegments = segmentNotesByMeasure(exercise.notesTreble || [], ticksPerMeasure, MEASURES_PER_LINE);
    const bassSegments = segmentNotesByMeasure(exercise.notesBass || [], ticksPerMeasure, MEASURES_PER_LINE);
    let singleStaveSegments = [];
    if (!useGrandStaff && exercise.notes && Array.isArray(exercise.notes)) {
        singleStaveSegments = segmentNotesByMeasure(exercise.notes, ticksPerMeasure, MEASURES_PER_LINE);
    }

    const numSystems = useGrandStaff ? Math.max(trebleSegments.length, bassSegments.length) : singleStaveSegments.length;

    if (numSystems === 0) {
        renderEmptyStaff(elementId, exercise.clef || 'treble', exercise.timeSignature, exercise.keySignature, totalFactoryWidth, true, options.customStartY); // Force full width for empty too
        return;
    }
    
    let effectiveSystemStartYGrand = typeof options.customStartY === 'number' ? options.customStartY : STAVE_START_Y_GRAND_DEFAULT;
    let effectiveSystemStartYSingle = typeof options.customStartY === 'number' ? options.customStartY : STAVE_START_Y_SINGLE_DEFAULT;

    const rendererHeight = scoreDiv.clientHeight > 0 ? scoreDiv.clientHeight : 
        (numSystems * (useGrandStaff ? SYSTEM_SPACING : SINGLE_STAVE_SYSTEM_SPACING)) + 
        (useGrandStaff ? effectiveSystemStartYGrand : effectiveSystemStartYSingle) + 20;
    
    const factory = new Factory({ renderer: { elementId: elementId, width: totalFactoryWidth, height: rendererHeight } });
    const context = factory.getContext();
    context.setFont('Arial', 10); context.clear();

    const showTextAnnotationsOnStaff = options.showTextAnnotations || false;
    // const forceFullWidth = options.useFullWidth || false; // Non più necessaria, è sempre full width

    try {
        for (let i = 0; i < numSystems; i++) {
            const systemY_Treble = (useGrandStaff ? effectiveSystemStartYGrand : effectiveSystemStartYSingle) + 
                                 (i * (useGrandStaff ? SYSTEM_SPACING : SINGLE_STAVE_SYSTEM_SPACING));
            const systemY_Bass = effectiveSystemStartYGrand + STAVE_VERTICAL_DISTANCE + (i * SYSTEM_SPACING);

            let staveTreble = null, staveBass = null;
            let voiceTreble = null, voiceBass = null;
            const voicesToFormat = [];

            const currentSystemNotesTreble = useGrandStaff ? (trebleSegments[i] || []) : (singleStaveSegments[i] || []);
            const currentSystemNotesBass = useGrandStaff ? (bassSegments[i] || []) : [];
            
            // SEMPRE LARGHEZZA PIENA
            const currentSystemStaveWidth = totalFactoryWidth - (STAVE_START_X_FALLBACK * 2); 
            const currentSystemStartX = STAVE_START_X_FALLBACK;
                                      
            const currentClef = exercise.clef || 'treble'; 

            if (useGrandStaff) {
                staveTreble = new Stave(currentSystemStartX, systemY_Treble, currentSystemStaveWidth);
                staveBass = new Stave(currentSystemStartX, systemY_Bass, currentSystemStaveWidth);
                // ... (aggiungi clef, timeSignature, keySignature, connectors) ...
                 if (i === 0) {
                    staveTreble.addClef('treble'); if (exercise.timeSignature) staveTreble.addTimeSignature(exercise.timeSignature); if (exercise.keySignature) staveTreble.addKeySignature(exercise.keySignature);
                    staveBass.addClef('bass'); if (exercise.timeSignature) staveBass.addTimeSignature(exercise.timeSignature); if (exercise.keySignature) staveBass.addKeySignature(exercise.keySignature);
                } else { staveTreble.addClef('treble'); staveBass.addClef('bass'); }
                staveTreble.setContext(context).draw(); staveBass.setContext(context).draw();
                if (i === 0) { new StaveConnector(staveTreble, staveBass).setType(StaveConnector.type.BRACE).setContext(context).draw(); }
                new StaveConnector(staveTreble, staveBass).setType(StaveConnector.type.SINGLE_LEFT).setContext(context).draw();
                new StaveConnector(staveTreble, staveBass).setType(StaveConnector.type.SINGLE_RIGHT).setContext(context).draw();
            } else { 
                staveTreble = new Stave(currentSystemStartX, systemY_Treble, currentSystemStaveWidth);
                // ... (aggiungi clef, timeSignature, keySignature, connectors) ...
                if (i === 0) {
                    staveTreble.addClef(currentClef);
                    if (exercise.timeSignature) staveTreble.addTimeSignature(exercise.timeSignature);
                    if (exercise.keySignature) staveTreble.addKeySignature(exercise.keySignature);
                } else { staveTreble.addClef(currentClef); }
                staveTreble.setContext(context).draw();
                new StaveConnector(staveTreble, staveTreble).setType(StaveConnector.type.SINGLE_RIGHT).setContext(context).draw();
                if (currentClef === 'bass') staveBass = staveTreble; 
            }
            
            // ... (resto della logica per creare voci, formattare e disegnare come nella versione precedente) ...
            // Questa parte non cambia significativamente, usa currentSystemStaveWidth che ora è sempre pieno.
            let totalTicksInCurrentSystemForVoice = 0;
            const notesForVoiceTickCalc = useGrandStaff ? [...currentSystemNotesTreble, ...currentSystemNotesBass] : [...currentSystemNotesTreble];
            notesForVoiceTickCalc.forEach(noteData => {
                if (noteData && typeof noteData.duration === 'string') {
                    totalTicksInCurrentSystemForVoice += durationToTicks(noteData.duration);
                }
            });
            const beatValueForVoice = 4;
            const ticksPerBeatInVoice = Vex.Flow.RESOLUTION / beatValueForVoice;
            const numBeatsForVoice = Math.max(1, Math.ceil(totalTicksInCurrentSystemForVoice / ticksPerBeatInVoice));

            if (useGrandStaff) {
                if (currentSystemNotesTreble.length > 0) {
                    const notesVexTreble = createStyledStaveNotes(currentSystemNotesTreble, 'treble', showTextAnnotationsOnStaff);
                    if (notesVexTreble.length > 0) { voiceTreble = new Voice({ num_beats: numBeatsForVoice, beat_value: beatValueForVoice }).setMode(Voice.Mode.SOFT).addTickables(notesVexTreble); voicesToFormat.push(voiceTreble); }
                }
                if (currentSystemNotesBass.length > 0) {
                    const notesVexBass = createStyledStaveNotes(currentSystemNotesBass, 'bass', showTextAnnotationsOnStaff);
                    if (notesVexBass.length > 0) { voiceBass = new Voice({ num_beats: numBeatsForVoice, beat_value: beatValueForVoice }).setMode(Voice.Mode.SOFT).addTickables(notesVexBass); voicesToFormat.push(voiceBass); }
                }
            } else { 
                if (currentSystemNotesTreble.length > 0) { 
                    const styledNotes = createStyledStaveNotes(currentSystemNotesTreble, currentClef, showTextAnnotationsOnStaff);
                    if (styledNotes.length > 0) {
                        const singleVoice = new Voice({ num_beats: numBeatsForVoice, beat_value: beatValueForVoice }).setMode(Voice.Mode.SOFT).addTickables(styledNotes);
                        voicesToFormat.push(singleVoice);
                        if (currentClef === 'bass') { voiceBass = singleVoice; } else { voiceTreble = singleVoice; }
                    }
                }
            }

            if (voicesToFormat.length > 0) {
                const formatter = new Formatter();
                if (voicesToFormat.length > 1 && voiceTreble && voiceBass) { 
                     formatter.joinVoices([voiceTreble, voiceBass]);
                }
                
                const formatWidthForVoices = currentSystemStaveWidth - Math.min(10, currentSystemStaveWidth * 0.02) ; 
                try { formatter.format(voicesToFormat, formatWidthForVoices, { align_rests: true, context: context }); }
                catch (e) {
                    console.warn(`VXR LOG: Formatter error (width: ${formatWidthForVoices}):`, e, "Attempting fallback format.");
                    try { formatter.format(voicesToFormat, undefined, { align_rests: true, context: context }); } 
                    catch (e2) { console.error(`VXR LOG: Fallback formatter failed:`, e2); continue; }
                }
                voicesToFormat.forEach(voice => {
                    const targetStave = (useGrandStaff && voice === voiceBass) ? staveBass : staveTreble;
                    if (targetStave) {
                        voice.draw(context, targetStave);
                        const beams = Beam.generateBeams(voice.getTickables().filter(n => !n.isRest() && n.getIntrinsicTicks() < (Vex.Flow.RESOLUTION/4) )); 
                        if (beams.length > 0) { beams.forEach(beam => beam.setContext(context).draw()); }
                    }
                });
            }
        }
        console.log(`>>> VXR renderExercise: Disegno VexFlow completato.`);
    } catch (error) {
        console.error(">>> VXR Generale Errore VexFlow:", error);
        scoreDiv.innerHTML = `<p style="color: red;">Errore VexFlow: ${error.message}</p><pre>${error.stack}</pre>`;
    }
}

export function renderEmptyStaff(elementId, clef = 'treble', timeSignature = '4/4', keySignature, givenTotalWidth = 0, forceFullWidth = true, customStartY) {
    // forceFullWidth è ora true di default o passato come true dalla home
    console.log(`>>> VXR renderEmptyStaff: Elemento "${elementId}". customStartY: ${customStartY}, forceFullWidth: ${forceFullWidth}`);
    const scoreDiv = document.getElementById(elementId);
    if (!scoreDiv) { /* ... */ return null; }
    scoreDiv.innerHTML = '';

    const totalAvailableWidth = givenTotalWidth > 0 ? givenTotalWidth : (scoreDiv.clientWidth > 0 ? scoreDiv.clientWidth : 700);
    const rendererHeight = scoreDiv.clientHeight > 0 ? scoreDiv.clientHeight : 150; 

    try {
        const factory = new Factory({ renderer: { elementId: elementId, width: totalAvailableWidth, height: rendererHeight } });
        const context = factory.getContext();
        context.setFont('Arial', 12, ""); context.clear();
        
        const defaultEmptyStartY = STAVE_START_Y_SINGLE_DEFAULT;
        const staveY = typeof customStartY === 'number' ? customStartY : defaultEmptyStartY;

        // SEMPRE LARGHEZZA PIENA (a meno che forceFullWidth non sia esplicitamente false, ma non dovrebbe succedere con la logica attuale)
        let emptyStaveWidth = totalAvailableWidth - (STAVE_START_X_FALLBACK * 2); 
        let staveX = STAVE_START_X_FALLBACK;

        if (!forceFullWidth) { // Questo blocco ora non dovrebbe quasi mai essere eseguito se vogliamo sempre full width
            let extraWidthForModifiersEmpty = 0;
            if (clef) extraWidthForModifiersEmpty += 30;
            if (timeSignature) extraWidthForModifiersEmpty += 30;
            if (keySignature) extraWidthForModifiersEmpty += (keySignature.length > 1 ? keySignature.match(/[#b]/g)?.length || 0 : 0) * 10 + 15;
            
            let calculatedEmptyWidth = Math.max(150, extraWidthForModifiersEmpty + 40); 
            calculatedEmptyWidth = Math.min(calculatedEmptyWidth, totalAvailableWidth - 40); 
            
            emptyStaveWidth = calculatedEmptyWidth;
            staveX = (totalAvailableWidth - emptyStaveWidth) / 2; 
        }

        const stave = new Stave(staveX, staveY, emptyStaveWidth);

        if (clef) stave.addClef(clef);
        if (timeSignature) stave.addTimeSignature(timeSignature);
        if (keySignature) stave.addKeySignature(keySignature); 

        stave.setContext(context).draw();
        console.log(">>> VXR renderEmptyStaff: Disegno pentagramma vuoto completato.");
        return factory;
    } catch (error) { /* ... */ return null; }
}
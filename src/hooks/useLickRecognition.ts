import { useState, useCallback, useRef, useEffect } from "react";
import { Lick, LickNote } from "@/types/lick";
import { RecordedNote } from "@/types/recording";

interface RecognitionResult {
  lick: Lick;
  accuracy: number; // 0-100
  points: number;
  timingFeedback?: {
    firstNoteOffsetMs: number; // negative = early/rushing, positive = late/dragging
    isRushing: boolean;
    isDragging: boolean;
  };
}

interface UseLickRecognitionProps {
  licks: Lick[];
  recordedNotes: RecordedNote[];
  isRecording: boolean;
  beatDuration: number; // milliseconds per beat
  timingTolerance?: number; // milliseconds deviation allowed (default 150ms)
  onLickRecognized?: (result: RecognitionResult) => void;
}

export const useLickRecognition = ({
  licks,
  recordedNotes,
  isRecording,
  beatDuration,
  timingTolerance = 150,
  onLickRecognized
}: UseLickRecognitionProps) => {
  const [totalScore, setTotalScore] = useState(0);
  const [recentRecognition, setRecentRecognition] = useState<RecognitionResult | null>(null);
  const recognizedLickIdsRef = useRef<Set<string>>(new Set());
  const lastCheckIndexRef = useRef(0);

  // Helper to generate multiple interpretations of a note's timing
  const getSubdivisionInterpretations = useCallback((note: RecordedNote): Array<{beatNumber: number; subdivision: number}> => {
    const interpretations = [];
    
    // 1. Raw interpretation (as-is)
    interpretations.push({
      beatNumber: note.beatNumber,
      subdivision: note.subdivision
    });
    
    // 2. Floor to previous 16th note
    const sixteenths = [0, 0.25, 0.5, 0.75];
    let floorSubdivision = 0;
    for (const s of sixteenths) {
      if (s <= note.subdivision) {
        floorSubdivision = s;
      }
    }
    if (floorSubdivision !== note.subdivision) {
      interpretations.push({
        beatNumber: note.beatNumber,
        subdivision: floorSubdivision
      });
    }
    
    // 3. Ceiling to next 16th note (including next beat)
    let ceilSubdivision = 1.0; // Default to next beat
    for (const s of sixteenths) {
      if (s > note.subdivision) {
        ceilSubdivision = s;
        break;
      }
    }
    
    // If ceiling is 1.0, wrap to next beat at subdivision 0
    if (ceilSubdivision === 1.0) {
      const nextBeat = note.beatNumber === 4 ? 1 : note.beatNumber + 1;
      interpretations.push({
        beatNumber: nextBeat,
        subdivision: 0
      });
    } else if (ceilSubdivision !== note.subdivision) {
      interpretations.push({
        beatNumber: note.beatNumber,
        subdivision: ceilSubdivision
      });
    }
    
    return interpretations;
  }, []);

  // Check if a sequence of notes matches a lick pattern
  const matchesLick = useCallback((notes: RecordedNote[], lick: Lick): { 
    matches: boolean; 
    accuracy: number;
    timingFeedback?: {
      firstNoteOffsetMs: number;
      isRushing: boolean;
      isDragging: boolean;
    };
  } => {
    if (notes.length < lick.notes.length) {
      return { matches: false, accuracy: 0 };
    }

    // Check the last N notes where N = lick length
    const recentNotes = notes.slice(-lick.notes.length);
    
    console.log(`  🎵 Checking lick "${lick.name}" (${lick.notes.length} notes, tolerance: ${timingTolerance}ms):`);

    // STEP 1: Check if all note IDs match
    for (let i = 0; i < lick.notes.length; i++) {
      const playedNote = recentNotes[i];
      const lickNote = lick.notes[i];

      if (playedNote.soundId !== lickNote.soundId) {
        console.log(`    ❌ Note ${i}: Wrong note (expected ${lickNote.noteName}, got ${playedNote.noteName})`);
        return { matches: false, accuracy: 0 };
      }
    }

    // STEP 2: Check absolute starting position (first note)
    const firstPlayedNote = recentNotes[0];
    const firstLickNote = lick.notes[0];
    
    const firstExpectedTime = (firstLickNote.beatNumber - 1 + firstLickNote.subdivision) * beatDuration;
    
    // Try all interpretations of the first note
    const firstNoteInterpretations = getSubdivisionInterpretations(firstPlayedNote);
    let bestFirstNoteOffset = Infinity;
    let bestFirstInterpretation = firstNoteInterpretations[0];

    for (const interp of firstNoteInterpretations) {
      const interpTime = (interp.beatNumber - 1 + interp.subdivision) * beatDuration;
      const offset = interpTime - firstExpectedTime;
      
      if (Math.abs(offset) < Math.abs(bestFirstNoteOffset)) {
        bestFirstNoteOffset = offset;
        bestFirstInterpretation = interp;
      }
    }

    const firstNoteOffset = bestFirstNoteOffset;
    const firstPlayedTime = (bestFirstInterpretation.beatNumber - 1 + bestFirstInterpretation.subdivision) * beatDuration;

    console.log(`    🎯 First note timing: offset = ${firstNoteOffset.toFixed(1)}ms (using B${bestFirstInterpretation.beatNumber}.${bestFirstInterpretation.subdivision})`);

    // If first note is too far off, reject (wrong beat)
    if (Math.abs(firstNoteOffset) > timingTolerance) {
      console.log(`    ❌ First note too far off (${Math.abs(firstNoteOffset).toFixed(1)}ms > ${timingTolerance}ms) - wrong beat!`);
      return { matches: false, accuracy: 0 };
    }

    // Track timing feedback
    const isRushing = firstNoteOffset < -10; // More than 10ms early
    const isDragging = firstNoteOffset > 10;  // More than 10ms late
    
    if (isRushing) {
      console.log(`    🏃 Rushing detected: ${Math.abs(firstNoteOffset).toFixed(1)}ms early`);
    } else if (isDragging) {
      console.log(`    🐌 Dragging detected: ${firstNoteOffset.toFixed(1)}ms late`);
    }

    // STEP 3: Check relative intervals between notes
    let totalAccuracy = 0;
    
    // First note accuracy based on absolute position
    const firstNoteAccuracy = Math.max(0, 100 - (Math.abs(firstNoteOffset) / timingTolerance) * 100);
    totalAccuracy += firstNoteAccuracy;
    console.log(`    🎹 Note 0 (${firstPlayedNote.noteName}): accuracy = ${firstNoteAccuracy.toFixed(1)}%`);

    // Check intervals for remaining notes
    for (let i = 1; i < lick.notes.length; i++) {
      const playedNote = recentNotes[i];
      const lickNote = lick.notes[i];

      // Calculate expected interval from first note
      const expectedTime = (lickNote.beatNumber - 1 + lickNote.subdivision) * beatDuration;
      const expectedInterval = expectedTime - firstExpectedTime;
      
      // Try all interpretations of this note and pick the best match
      const interpretations = getSubdivisionInterpretations(playedNote);
      let bestIntervalDiff = Infinity;
      let bestInterpretation = interpretations[0];
      
      for (const interp of interpretations) {
        const interpTime = (interp.beatNumber - 1 + interp.subdivision) * beatDuration;
        const interpInterval = interpTime - firstPlayedTime;
        const intervalDiff = Math.abs(expectedInterval - interpInterval);
        
        if (intervalDiff < bestIntervalDiff) {
          bestIntervalDiff = intervalDiff;
          bestInterpretation = interp;
        }
      }
      
      console.log(`    🎹 Note ${i} (${playedNote.noteName}): best interval diff = ${bestIntervalDiff.toFixed(1)}ms (using B${bestInterpretation.beatNumber}.${bestInterpretation.subdivision})`);

      // If best interpretation is still too far off, not a match
      if (bestIntervalDiff > timingTolerance) {
        console.log(`    ❌ Interval too far off (${bestIntervalDiff.toFixed(1)}ms > ${timingTolerance}ms) - bad rhythm!`);
        return { matches: false, accuracy: 0 };
      }

      // Calculate accuracy for this interval
      const noteAccuracy = Math.max(0, 100 - (bestIntervalDiff / timingTolerance) * 100);
      totalAccuracy += noteAccuracy;
    }

    const averageAccuracy = totalAccuracy / lick.notes.length;
    console.log(`    ✅ Match! Average accuracy: ${averageAccuracy.toFixed(1)}%`);
    
    return { 
      matches: true, 
      accuracy: averageAccuracy,
      timingFeedback: {
        firstNoteOffsetMs: firstNoteOffset,
        isRushing,
        isDragging
      }
    };
  }, [beatDuration, timingTolerance]);

  // Calculate points based on difficulty and accuracy
  const calculatePoints = useCallback((lick: Lick, accuracy: number): number => {
    const baseDifficulty = lick.difficulty || 50;
    const accuracyMultiplier = accuracy / 100;
    const points = Math.round(baseDifficulty * accuracyMultiplier);
    return points;
  }, []);

  // Check for lick matches when new notes are recorded
  useEffect(() => {
    // Reset recognition state when recording stops and there are no notes
    if (recordedNotes.length === 0) {
      recognizedLickIdsRef.current.clear();
      lastCheckIndexRef.current = 0;
      if (!isRecording) {
        console.log("🔄 Lick recognition reset (not recording)");
      }
      return;
    }

    // Only check new notes since last check
    if (recordedNotes.length <= lastCheckIndexRef.current) {
      return;
    }

    console.log(`🔍 Checking for licks... (${recordedNotes.length} notes recorded, last check at ${lastCheckIndexRef.current})`);
    lastCheckIndexRef.current = recordedNotes.length;

    // Check each lick for a match
    for (const lick of licks) {
      const result = matchesLick(recordedNotes, lick);
      
      if (result.matches) {
        // Mark as recognized
        recognizedLickIdsRef.current.add(lick.id);
        
        // Calculate points
        const points = calculatePoints(lick, result.accuracy);
        
        const recognitionResult: RecognitionResult = {
          lick,
          accuracy: result.accuracy,
          points,
          timingFeedback: result.timingFeedback
        };

        console.log(`✅ Lick recognized: ${lick.name}, Points: ${points}, Accuracy: ${result.accuracy.toFixed(1)}%`);
        if (result.timingFeedback) {
          if (result.timingFeedback.isRushing) {
            console.log(`   🏃 Rushing: ${Math.abs(result.timingFeedback.firstNoteOffsetMs).toFixed(1)}ms early`);
          } else if (result.timingFeedback.isDragging) {
            console.log(`   🐌 Dragging: ${result.timingFeedback.firstNoteOffsetMs.toFixed(1)}ms late`);
          }
        }

        // Update score
        setTotalScore(prev => prev + points);
        setRecentRecognition(recognitionResult);

        // Clear recent recognition after animation
        setTimeout(() => {
          setRecentRecognition(null);
        }, 3000);

        // Notify callback
        if (onLickRecognized) {
          onLickRecognized(recognitionResult);
        }

        // Only recognize one lick at a time
        break;
      }
    }
  }, [recordedNotes, isRecording, licks, matchesLick, calculatePoints, onLickRecognized]);

  const resetScore = useCallback(() => {
    setTotalScore(0);
    setRecentRecognition(null);
    recognizedLickIdsRef.current.clear();
    lastCheckIndexRef.current = 0;
  }, []);

  const resetRecognizedLicks = useCallback(() => {
    recognizedLickIdsRef.current.clear();
    console.log("🔄 Recognized licks cleared (for new turn)");
  }, []);

  return {
    totalScore,
    recentRecognition,
    resetScore,
    resetRecognizedLicks
  };
};

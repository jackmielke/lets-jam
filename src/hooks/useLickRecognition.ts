import { useState, useCallback, useRef, useEffect } from "react";
import { Lick, LickNote } from "@/types/lick";
import { RecordedNote } from "@/types/recording";

interface RecognitionResult {
  lick: Lick;
  accuracy: number; // 0-100
  points: number;
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

  // Check if a sequence of notes matches a lick pattern
  const matchesLick = useCallback((notes: RecordedNote[], lick: Lick): { matches: boolean; accuracy: number } => {
    if (notes.length < lick.notes.length) {
      return { matches: false, accuracy: 0 };
    }

    // Check the last N notes where N = lick length
    const recentNotes = notes.slice(-lick.notes.length);
    
    let totalAccuracy = 0;
    let matchedNotes = 0;

    console.log(`  🎵 Checking lick "${lick.name}" (${lick.notes.length} notes, tolerance: ${timingTolerance}ms):`);

    for (let i = 0; i < lick.notes.length; i++) {
      const playedNote = recentNotes[i];
      const lickNote = lick.notes[i];

      // Check if note ID matches
      if (playedNote.soundId !== lickNote.soundId) {
        console.log(`    ❌ Note ${i}: Wrong note (expected ${lickNote.noteName}, got ${playedNote.noteName})`);
        return { matches: false, accuracy: 0 };
      }

      // Calculate timing accuracy
      const expectedTime = (lickNote.beatNumber - 1 + lickNote.subdivision) * beatDuration;
      const playedTime = (playedNote.beatNumber - 1 + playedNote.subdivision) * beatDuration;
      const timeDiff = Math.abs(expectedTime - playedTime);

      console.log(`    🎹 Note ${i} (${playedNote.noteName}): timing diff = ${timeDiff.toFixed(1)}ms`);

      // If timing is too far off, not a match
      if (timeDiff > timingTolerance) {
        console.log(`    ❌ Timing too far off (${timeDiff.toFixed(1)}ms > ${timingTolerance}ms)`);
        return { matches: false, accuracy: 0 };
      }

      // Calculate accuracy for this note (0-100)
      const noteAccuracy = Math.max(0, 100 - (timeDiff / timingTolerance) * 100);
      totalAccuracy += noteAccuracy;
      matchedNotes++;
    }

    const averageAccuracy = totalAccuracy / matchedNotes;
    console.log(`    ✅ Match! Average accuracy: ${averageAccuracy.toFixed(1)}%`);
    return { matches: true, accuracy: averageAccuracy };
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
    if (!isRecording || recordedNotes.length === 0) {
      // Don't reset during active sessions - only when truly stopping
      if (recordedNotes.length === 0 && !isRecording) {
        recognizedLickIdsRef.current.clear();
        lastCheckIndexRef.current = 0;
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
          points
        };

        console.log(`✅ Lick recognized: ${lick.name}, Points: ${points}, Accuracy: ${result.accuracy.toFixed(1)}%`);

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

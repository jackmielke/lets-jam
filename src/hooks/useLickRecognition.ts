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
  onLickRecognized?: (result: RecognitionResult) => void;
}

export const useLickRecognition = ({
  licks,
  recordedNotes,
  isRecording,
  beatDuration,
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
    
    // Calculate timing tolerance (allow 100ms deviation)
    const timingTolerance = 100; // ms
    
    let totalAccuracy = 0;
    let matchedNotes = 0;

    for (let i = 0; i < lick.notes.length; i++) {
      const playedNote = recentNotes[i];
      const lickNote = lick.notes[i];

      // Check if note ID matches
      if (playedNote.soundId !== lickNote.soundId) {
        return { matches: false, accuracy: 0 };
      }

      // Calculate timing accuracy
      const expectedTime = (lickNote.beatNumber - 1 + lickNote.subdivision) * beatDuration;
      const playedTime = (playedNote.beatNumber - 1 + playedNote.subdivision) * beatDuration;
      const timeDiff = Math.abs(expectedTime - playedTime);

      // If timing is too far off, not a match
      if (timeDiff > timingTolerance) {
        return { matches: false, accuracy: 0 };
      }

      // Calculate accuracy for this note (0-100)
      const noteAccuracy = Math.max(0, 100 - (timeDiff / timingTolerance) * 100);
      totalAccuracy += noteAccuracy;
      matchedNotes++;
    }

    const averageAccuracy = totalAccuracy / matchedNotes;
    return { matches: true, accuracy: averageAccuracy };
  }, [beatDuration]);

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
      // Reset when recording stops
      recognizedLickIdsRef.current.clear();
      lastCheckIndexRef.current = 0;
      return;
    }

    // Only check new notes since last check
    if (recordedNotes.length <= lastCheckIndexRef.current) {
      return;
    }

    lastCheckIndexRef.current = recordedNotes.length;

    // Check each lick for a match
    for (const lick of licks) {
      // Skip if already recognized in this recording session
      if (recognizedLickIdsRef.current.has(lick.id)) {
        continue;
      }

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

  return {
    totalScore,
    recentRecognition,
    resetScore
  };
};

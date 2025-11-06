import { useState, useEffect, useRef, useCallback } from "react";

export interface BeatInfo {
  beatNumber: number; // 1, 2, 3, 4
  timestamp: number;
  subdivision: number; // 0 = on beat, 0.25 = 16th note after, 0.5 = 8th note after, etc.
}

interface UseMetronomeProps {
  bpm: number;
  beatsPerBar: number;
  onBeat?: (beatInfo: BeatInfo) => void;
}

export const useMetronome = ({ bpm, beatsPerBar = 4, onBeat }: UseMetronomeProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(1);
  const lastBeatTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const beatDuration = (60 / bpm) * 1000; // milliseconds per beat

  const playClick = useCallback((isDownbeat: boolean = false) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Downbeat (beat 1) is higher pitched and louder
    oscillator.frequency.setValueAtTime(isDownbeat ? 1000 : 800, currentTime);
    
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(isDownbeat ? 0.3 : 0.2, currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
    
    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.05);
  }, []);

  const start = useCallback(() => {
    setIsPlaying(true);
    setCurrentBeat(1);
    lastBeatTimeRef.current = Date.now();
    playClick(true); // Play first beat immediately
    
    if (onBeat) {
      onBeat({
        beatNumber: 1,
        timestamp: lastBeatTimeRef.current,
        subdivision: 0
      });
    }
  }, [playClick, onBeat]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentBeat(1);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Calculate which beat and subdivision a timestamp falls on
  const getBeatAtTimestamp = useCallback((timestamp: number): BeatInfo => {
    if (!lastBeatTimeRef.current) {
      return { beatNumber: 1, timestamp, subdivision: 0 };
    }

    const timeSinceLastBeat = timestamp - lastBeatTimeRef.current;
    const beatsPassed = timeSinceLastBeat / beatDuration;
    
    // Calculate beat number (1-4, cycling)
    const totalBeats = currentBeat - 1 + beatsPassed;
    const beatNumber = Math.floor(totalBeats % beatsPerBar) + 1;
    
    // Calculate subdivision (0 = on beat, 0.25 = 16th after, 0.5 = 8th after, etc.)
    const subdivision = beatsPassed % 1;
    
    return {
      beatNumber,
      timestamp,
      subdivision
    };
  }, [currentBeat, beatDuration, beatsPerBar]);

  // Calculate how many milliseconds off from nearest beat/subdivision
  const getTimingAccuracy = useCallback((timestamp: number): {
    offsetMs: number;
    nearestSubdivision: number;
    accuracy: 'perfect' | 'good' | 'ok' | 'poor';
  } => {
    const beatInfo = getBeatAtTimestamp(timestamp);
    
    // Round to nearest 16th note (0, 0.25, 0.5, 0.75)
    const sixteenths = [0, 0.25, 0.5, 0.75, 1];
    let nearestSubdivision = 0;
    let minDiff = Infinity;
    
    sixteenths.forEach(sixteenth => {
      const diff = Math.abs(beatInfo.subdivision - sixteenth);
      if (diff < minDiff) {
        minDiff = diff;
        nearestSubdivision = sixteenth;
      }
    });
    
    // Convert subdivision difference to milliseconds
    const offsetMs = minDiff * beatDuration;
    
    // Determine accuracy rating
    let accuracy: 'perfect' | 'good' | 'ok' | 'poor';
    if (offsetMs < 30) accuracy = 'perfect';
    else if (offsetMs < 50) accuracy = 'good';
    else if (offsetMs < 100) accuracy = 'ok';
    else accuracy = 'poor';
    
    return { offsetMs, nearestSubdivision, accuracy };
  }, [getBeatAtTimestamp, beatDuration]);

  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      lastBeatTimeRef.current = now;
      
      setCurrentBeat(prev => {
        const next = prev >= beatsPerBar ? 1 : prev + 1;
        playClick(next === 1);
        
        if (onBeat) {
          onBeat({
            beatNumber: next,
            timestamp: now,
            subdivision: 0
          });
        }
        
        return next;
      });
    }, beatDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, beatDuration, beatsPerBar, playClick, onBeat]);

  return {
    isPlaying,
    currentBeat,
    start,
    stop,
    toggle,
    getBeatAtTimestamp,
    getTimingAccuracy,
    beatDuration
  };
};

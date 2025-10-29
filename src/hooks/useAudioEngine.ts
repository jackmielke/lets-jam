import { useRef, useCallback } from "react";
import { SoundType } from "@/types/audio";

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType, frequency?: number) => {
    const audioContext = getAudioContext();
    const currentTime = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Piano-like sound with sine wave
    oscillator.type = "sine";
    
    // Use frequency from the note definition
    const noteFreq = frequency || 261.63;
    oscillator.frequency.setValueAtTime(noteFreq, currentTime);
    
    // ADSR envelope for piano-like sound
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.2, currentTime + 0.1); // Decay
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 1); // Release

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 1);
  }, [getAudioContext]);

  return { playSound };
};

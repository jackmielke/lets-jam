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

    // Mario Bros 8-bit sound with square wave
    oscillator.type = "square";
    
    // Use frequency from the note definition
    const noteFreq = frequency || 261.63;
    oscillator.frequency.setValueAtTime(noteFreq, currentTime);
    
    // Short, punchy envelope for 8-bit sound
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, currentTime + 0.005); // Fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15); // Quick decay

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.15);
  }, [getAudioContext]);

  return { playSound };
};

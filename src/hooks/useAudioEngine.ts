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

    // Roblox-style synthetic sound with triangle wave
    oscillator.type = "triangle";
    
    // Use frequency from the note definition
    const noteFreq = frequency || 261.63;
    oscillator.frequency.setValueAtTime(noteFreq, currentTime);
    
    // Add slight vibrato effect for Roblox character
    oscillator.frequency.linearRampToValueAtTime(noteFreq * 1.02, currentTime + 0.05);
    oscillator.frequency.linearRampToValueAtTime(noteFreq, currentTime + 0.1);
    
    // Roblox-style envelope - bouncy and synthetic
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.3, currentTime + 0.08); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.25); // Decay

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.25);
  }, [getAudioContext]);

  return { playSound };
};

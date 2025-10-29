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

  const playSound = useCallback((type: SoundType) => {
    const audioContext = getAudioContext();
    const currentTime = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different sound characteristics for each drum type
    switch (type) {
      case "kick":
        oscillator.frequency.setValueAtTime(150, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        gainNode.gain.setValueAtTime(1, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        break;
      case "snare":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(200, currentTime);
        gainNode.gain.setValueAtTime(0.7, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        
        // Add noise for snare character
        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.3, currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noise.start(currentTime);
        noise.stop(currentTime + 0.2);
        break;
      case "hihat":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(10000, currentTime);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
        break;
      case "clap":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(1000, currentTime);
        gainNode.gain.setValueAtTime(0.5, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        break;
      case "tom":
        oscillator.frequency.setValueAtTime(220, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.8, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        break;
      case "cymbal":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(8000, currentTime);
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        break;
      case "cowbell":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(800, currentTime);
        gainNode.gain.setValueAtTime(0.5, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        break;
      case "rim":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(400, currentTime);
        gainNode.gain.setValueAtTime(0.4, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        break;
    }

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 1);
  }, [getAudioContext]);

  return { playSound };
};

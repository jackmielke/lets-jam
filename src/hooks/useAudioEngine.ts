import { useRef, useCallback, useState } from "react";
import { SoundType } from "@/types/audio";

export type InstrumentType = "roblox" | "synth" | "organ" | "guitar";

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNotesRef = useRef<Set<string>>(new Set());
  const [instrumentType, setInstrumentType] = useState<InstrumentType>("roblox");

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType, frequency?: number) => {
    const audioContext = getAudioContext();
    
    // Use high-precision scheduling - start sounds slightly ahead
    const currentTime = audioContext.currentTime + 0.005;
    const noteFreq = frequency || 261.63;
    const noteId = `${noteFreq}-${Date.now()}`;

    // Add to active notes for polyphony tracking
    activeNotesRef.current.add(noteId);
    
    // Calculate volume reduction based on active notes (prevent clipping)
    const polyphonyFactor = Math.min(1, 3 / Math.max(1, activeNotesRef.current.size));
    
    // Cleanup function to remove note when it stops
    const cleanup = () => {
      activeNotesRef.current.delete(noteId);
    };

    if (instrumentType === "synth") {
      // Analog synth sound with sawtooth wave and filter
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(noteFreq, currentTime);

      // Sweeping filter for synth character
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(noteFreq * 8, currentTime);
      filter.frequency.exponentialRampToValueAtTime(noteFreq * 2, currentTime + 0.3);
      filter.Q.setValueAtTime(8, currentTime);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // ADSR envelope with polyphony compensation
      const volume = 0.4 * polyphonyFactor;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.4);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.4);
      oscillator.onended = cleanup;

    } else if (instrumentType === "organ") {
      // Church organ with multiple harmonics
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);

      // Create multiple sine waves at harmonic frequencies
      const harmonics = [1, 2, 3, 4, 5, 6];
      const amplitudes = [1.0, 0.5, 0.3, 0.2, 0.15, 0.1];

      harmonics.forEach((harmonic, index) => {
        const osc = audioContext.createOscillator();
        const harmonicGain = audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(noteFreq * harmonic, currentTime);

        harmonicGain.gain.setValueAtTime(0, currentTime);
        harmonicGain.gain.linearRampToValueAtTime(amplitudes[index] * 0.15, currentTime + 0.05);
        harmonicGain.gain.setValueAtTime(amplitudes[index] * 0.15, currentTime + 0.5);
        harmonicGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.8);

        osc.connect(harmonicGain);
        harmonicGain.connect(gainNode);

        osc.start(currentTime);
        osc.stop(currentTime + 0.8);
        
        // Cleanup on last harmonic
        if (index === harmonics.length - 1) {
          osc.onended = cleanup;
        }
      });

    } else if (instrumentType === "guitar") {
      // Dirty electric guitar with distortion
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const distortion = audioContext.createWaveShaper();
      const filter = audioContext.createBiquadFilter();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(noteFreq, currentTime);

      // Create distortion curve
      const makeDistortionCurve = (amount: number) => {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1;
          curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
      };

      distortion.curve = makeDistortionCurve(100);
      distortion.oversample = "4x";

      // Add brightness with high-pass filter
      filter.type = "highpass";
      filter.frequency.setValueAtTime(400, currentTime);

      oscillator.connect(distortion);
      distortion.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Aggressive attack and sustain with polyphony compensation
      const volume = 0.3 * polyphonyFactor;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.5);
      oscillator.onended = cleanup;

    } else {
      // Roblox-style synthetic sound with triangle wave (default)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(noteFreq, currentTime);
      
      // Add slight vibrato effect
      oscillator.frequency.linearRampToValueAtTime(noteFreq * 1.02, currentTime + 0.05);
      oscillator.frequency.linearRampToValueAtTime(noteFreq, currentTime + 0.1);
      
      // Roblox-style envelope - bouncy and synthetic with polyphony compensation
      const volume = 0.5 * polyphonyFactor;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(volume * 0.6, currentTime + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.25);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.25);
      oscillator.onended = cleanup;
    }
  }, [getAudioContext, instrumentType]);

  return { playSound, instrumentType, setInstrumentType };
};

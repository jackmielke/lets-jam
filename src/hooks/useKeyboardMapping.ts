import { useEffect, useCallback, useRef } from "react";

interface KeyMapping {
  [key: string]: string; // keyboard key -> sound id
}

// Map ASDF row to white keys (C4-E5)
// Map QWERTY row to black keys (sharps/flats)
const keyMap: KeyMapping = {
  // White keys on home row: a s d f g h j k l ; '
  'a': 'c4',  // C4
  's': 'd4',  // D4
  'd': 'e4',  // E4
  'f': 'f4',  // F4
  'g': 'g4',  // G4
  'h': 'a4',  // A4
  'j': 'b4',  // B4
  'k': 'c5',  // C5
  'l': 'd5',  // D5
  ';': 'e5',  // E5
  "'": 'f5',  // F5
  
  // Black keys on QWERTY row: w e r t y u i o
  'w': 'cs4', // C#4
  'e': 'ds4', // D#4
  't': 'fs4', // F#4
  'y': 'gs4', // G#4
  'u': 'as4', // A#4
  'i': 'cs5', // C#5
  'o': 'ds5', // D#5
};

interface UseKeyboardMappingProps {
  onKeyPress: (soundId: string) => void;
  enabled?: boolean;
}

export const useKeyboardMapping = ({ onKeyPress, enabled = true }: UseKeyboardMappingProps) => {
  const pressedKeys = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const key = event.key.toLowerCase();
    const soundId = keyMap[key];
    
    // Prevent repeated triggers when key is held
    if (!soundId || pressedKeys.current.has(key)) return;
    
    pressedKeys.current.add(key);
    onKeyPress(soundId);
  }, [onKeyPress, enabled]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    pressedKeys.current.delete(key);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, enabled]);

  return { keyMap };
};

// Export a function to get the keyboard key for a sound ID
export const getKeyForSound = (soundId: string): string | undefined => {
  return Object.entries(keyMap).find(([_, id]) => id === soundId)?.[0]?.toUpperCase();
};

import { useEffect, useCallback, useRef } from "react";

interface KeyMapping {
  [key: string]: string; // keyboard key -> sound id
}

// Map ASDF row to white keys (E4-A5)
// Map QWERTY row to black keys (sharps/flats)
const keyMap: KeyMapping = {
  // White keys on home row: a s d f g h j k l ; '
  'a': 'e4',  // E4
  's': 'f4',  // F4
  'd': 'g4',  // G4
  'f': 'a4',  // A4
  'g': 'b4',  // B4
  'h': 'c5',  // C5 (centered on H)
  'j': 'd5',  // D5
  'k': 'e5',  // E5
  'l': 'f5',  // F5
  ';': 'g5',  // G5
  "'": 'a5',  // A5
  
  // Black keys on QWERTY row: r y u i o
  'r': 'fs4', // F#4 (between s-d / F4-G4)
  'y': 'gs4', // G#4 (between d-f / G4-A4)
  'u': 'as4', // A#4 (between f-g / A4-B4)
  'i': 'cs5', // C#5 (between h-j / C5-D5)
  'o': 'ds5', // D#5 (between j-k / D5-E5)
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

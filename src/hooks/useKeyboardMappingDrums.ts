import { useEffect, useCallback, useRef } from "react";

interface KeyMapping {
  [key: string]: string; // keyboard key -> sound id
}

// Map keyboard keys to drum pads
const keyMap: KeyMapping = {
  // Top row - Cymbals and Hi-hats
  'q': 'hihat-closed',
  'w': 'hihat-open',
  'e': 'crash',
  'r': 'ride',
  
  // Middle row - Toms and snares
  'a': 'snare',
  's': 'tom-high',
  'd': 'tom-mid',
  'f': 'tom-low',
  
  // Bottom row - Kicks and percussion
  'z': 'kick',
  'x': 'kick-sub',
  'c': 'clap',
  'v': 'rim',
  
  // Right side - Extra percussion
  'u': 'cowbell',
  'i': 'shaker',
  'o': 'tambourine',
  'p': 'woodblock',
};

interface UseKeyboardMappingDrumsProps {
  onKeyPress: (soundId: string) => void;
  enabled?: boolean;
}

export const useKeyboardMappingDrums = ({ onKeyPress, enabled = true }: UseKeyboardMappingDrumsProps) => {
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
export const getKeyForDrumSound = (soundId: string): string | undefined => {
  return Object.entries(keyMap).find(([_, id]) => id === soundId)?.[0]?.toUpperCase();
};

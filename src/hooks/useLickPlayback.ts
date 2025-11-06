import { useCallback, useRef } from "react";
import { Lick } from "@/types/lick";
import { DrumSound } from "@/types/audio";

interface UseLickPlaybackProps {
  onPlaySound: (soundId: string) => void;
  onHighlight: (soundId: string | null) => void;
  drumSounds: DrumSound[];
  bpm: number;
}

export const useLickPlayback = ({ onPlaySound, onHighlight, drumSounds, bpm }: UseLickPlaybackProps) => {
  const playbackTimeoutsRef = useRef<number[]>([]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
    onHighlight(null);
  }, [onHighlight]);

  const playLick = useCallback((lick: Lick) => {
    // Clear any existing playback
    stopPlayback();

    const beatDuration = (60 / bpm) * 1000; // milliseconds per beat

    lick.notes.forEach((note, index) => {
      // Calculate absolute time from beat number and subdivision
      const noteTime = ((note.beatNumber - 1) + note.subdivision) * beatDuration;

      const timeoutId = window.setTimeout(() => {
        onPlaySound(note.soundId);
        onHighlight(note.soundId);

        // Clear highlight after 150ms
        const clearTimeoutId = window.setTimeout(() => {
          onHighlight(null);
        }, 150);
        playbackTimeoutsRef.current.push(clearTimeoutId);
      }, noteTime);

      playbackTimeoutsRef.current.push(timeoutId);
    });
  }, [bpm, onPlaySound, onHighlight, stopPlayback]);

  return { playLick, stopPlayback };
};

import { useState } from "react";
import { DrumSound } from "@/types/audio";
import { getKeyForSound } from "@/hooks/useKeyboardMapping";

interface PianoKeyProps {
  sound: DrumSound;
  onPlay: () => void;
  isBlack?: boolean;
  isPressed?: boolean;
}

export const PianoKey = ({ sound, onPlay, isBlack, isPressed = false }: PianoKeyProps) => {
  const keyboardKey = getKeyForSound(sound.id);

  return (
    <button
      onClick={onPlay}
      className={`
        relative transition-all duration-100
        ${isBlack 
          ? "bg-gradient-to-b from-gray-900 to-black text-white h-24 sm:h-28 w-8 sm:w-10 -mx-2 z-10 rounded-b-md shadow-xl" 
          : "bg-gradient-to-b from-white to-gray-100 text-gray-900 h-40 sm:h-44 w-10 sm:w-12 rounded-b-md shadow-md border-r border-gray-300"
        }
        ${isPressed ? "!bg-gradient-to-b !from-red-500 !to-red-600 !text-white scale-95 shadow-[0_0_20px_rgba(239,68,68,0.6)]" : ""}
        hover:brightness-95 active:scale-95
        flex flex-col items-center justify-end pb-2 gap-1
      `}
    >
      <span className={`text-[10px] sm:text-xs font-semibold ${isBlack ? "text-white" : "text-gray-700"}`}>
        {sound.name}
      </span>
      {keyboardKey && (
        <span className={`text-[8px] sm:text-[10px] font-mono font-bold ${isPressed ? "text-white" : isBlack ? "text-white/60" : "text-gray-500"}`}>
          [{keyboardKey}]
        </span>
      )}
    </button>
  );
};

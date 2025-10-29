import { useState } from "react";
import { DrumSound } from "@/types/audio";

interface PianoKeyProps {
  sound: DrumSound;
  onPlay: () => void;
  isBlack?: boolean;
}

export const PianoKey = ({ sound, onPlay, isBlack }: PianoKeyProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onPlay();
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <button
      onClick={handlePress}
      className={`
        relative transition-all duration-100
        ${isBlack 
          ? "bg-gradient-to-b from-gray-900 to-black text-white h-24 sm:h-28 w-8 sm:w-10 -mx-2 z-10 rounded-b-md shadow-xl" 
          : "bg-gradient-to-b from-white to-gray-100 text-gray-900 h-40 sm:h-44 w-10 sm:w-12 rounded-b-md shadow-md border-r border-gray-300"
        }
        ${isPressed ? (isBlack ? "from-gray-700 to-gray-800 scale-95" : "from-gray-200 to-gray-300 scale-95") : ""}
        hover:brightness-95 active:scale-95
        flex flex-col items-center justify-end pb-2 gap-1
      `}
    >
      <span className={`text-[10px] sm:text-xs font-semibold ${isBlack ? "text-white" : "text-gray-700"}`}>
        {sound.name}
      </span>
      {isPressed && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${isBlack ? "bg-primary" : "bg-secondary"} animate-pulse rounded-b-md`} />
      )}
    </button>
  );
};
